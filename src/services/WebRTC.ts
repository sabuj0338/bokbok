// import { io, Socket } from "socket.io-client";

// const socket_url = "https://bokbok.onrender.com";
// const servers = {
//   iceServers: [{
//     urls: "stun:stun.l.google.com:19302"
//   }]
// };

// const media_constraints = {
//   video: {
//     width: {
//       ideal: 1280
//     },
//     height: {
//       ideal: 720
//     },
//     frameRate: {
//       max: 30
//     }
//   },
//   audio: true
// };

// export class WebRTC {
//   socket: Socket;
//   localStream: MediaStream;
//   remoteStream: MediaStream;
//   peerConnection: RTCPeerConnection;
//   constructor() {
//     this.socket = io(socket_url);
//     this.socket.on("connect", () => {
//       console.log("socket connected");
//     })
//     this.socket.on("disconnect", () => {
//       console.log("socket disconnected");
//     })
//     this.peerConnection = new RTCPeerConnection();
//   }


// }