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

const users = {}; // Store connected users

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

  socket.on("hang-up", (data) => {
    socket.broadcast.emit("hang-up", data);
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

  // group call
  socket.on("join-room", (roomId) => {
    console.log(`User joined room ${roomId}`);
    if (!users[roomId]) users[roomId] = [];
    users[roomId].push(socket.id);

    console.log(users, socket.id);

    // Notify existing users
    users[roomId].forEach((peerId) => {
      if (peerId !== socket.id) {
        console.log("inside foreach", peerId, socket.id);
        io.to(peerId).emit("room:user-joined", socket.id);
      }
    });

    socket.on("room:toggle-video", (peerId, data) => {
      io.to(peerId).emit("room:toggle-video", socket.id, data);
    });

    socket.on("room:toggle-audio", (peerId, data) => {
      io.to(peerId).emit("room:toggle-audio", socket.id, data);
    });

    socket.on("room:screen-share", (peerId, data) => {
      io.to(peerId).emit("room:screen-share", socket.id, data);
    });

    socket.on("room:hang-up", (peerId, data) => {
      io.to(peerId).emit("room:hang-up", socket.id, data);
    });

    socket.on("room:offer", (peerId, offer) => {
      io.to(peerId).emit("room:offer", socket.id, offer);
    });

    socket.on("room:answer", (peerId, answer) => {
      io.to(peerId).emit("room:answer", socket.id, answer);
    });

    socket.on("room:ice-candidate", (peerId, candidate) => {
      io.to(peerId).emit("room:ice-candidate", socket.id, candidate);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", roomId, socket.id);
      users[roomId] = users[roomId].filter((id) => id !== socket.id);
      io.to(roomId).emit("room:user-left", socket.id);
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const roomId = Object.keys(users).find((roomId) =>
      users[roomId].includes(socket.id)
    );
    if (roomId) {
      users[roomId] = users[roomId].filter((id) => id !== socket.id);
      io.to(roomId).emit("room:user-left", socket.id);
    }
  });
});

server.listen(3000, () => {
  console.log("Signaling server running on http://localhost:3000");
});
