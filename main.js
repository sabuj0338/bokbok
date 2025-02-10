import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("toggle-video", (data) => {
    socket.broadcast.emit("toggle-video", data);
  });
  
  socket.on("toggle-audio", (data) => {
    socket.broadcast.emit("toggle-audio", data);
  });
  
  socket.on("screen-share", (data) => {
    socket.broadcast.emit("screen-share", data);
  });

  socket.on("offer", (data) => {
    socket.broadcast.emit("offer", data);
  });

  socket.on("answer", (data) => {
    socket.broadcast.emit("answer", data);
  });

  socket.on("ice-candidate", (data) => {
    socket.broadcast.emit("ice-candidate", data);
  });

  socket.on("hang-up", (data) => {
    socket.broadcast.emit("hang-up", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Signaling server running on http://localhost:3000");
});
