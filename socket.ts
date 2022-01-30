import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
dotenv.config();

const app = express();
const server = require("http").Server(app);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,POST");
  next();
});

const io = require("socket.io")(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

let users = [];

const addUser = (userId: string, socketId: string) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId: string) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId: string) => {
  return users.find((user) => user.userId === userId);
};

server.listen(4000, () => {
  console.log("Connected");
  io.on("connection", (socket: any) => {
    console.log("socket connected", socket.id);
    socket.on("addUser", (userId: string) => {
      addUser(userId, socket.id);
      io.emit("getUsers", users);
    });

    socket.on("sendMessage", ({ sender, receiverId, text }) => {
      const user = getUser(receiverId);
      if (user) {
        io.to(user.socketId).emit("getMessage", {
          sender,
          receiverId,
          text,
        });
      }
      return;
    });

    socket.on("disconnect", () => {
      console.log(`a user ${socket.id} disconnected`);
      removeUser(socket.id);
      io.emit("getUsers", users);
    });
  });
});
