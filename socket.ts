import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
dotenv.config();

const PORT = process.env.PORT;
const originUrl = process.env.CORS_ORIGIN;
const app = express();
const server = createServer(app);

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: originUrl,
    credentials: true,
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

server.listen(PORT, () => {
  console.log(`Server is running on ${PORT} port`);
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
