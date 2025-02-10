import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("https://bokbok.onrender.com"); // Replace with your signaling server URL

const WebRTCVideoChat: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const initWebRTC = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      // Attach local stream tracks to peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });
      remoteStreamRef.current = new MediaStream();
      if (remoteVideoRef.current)
        remoteVideoRef.current.srcObject = remoteStreamRef.current;

      // Receive tracks and add to remote stream
      peerConnection.ontrack = (event) => {
        // if (remoteVideoRef.current) {
        //   remoteVideoRef.current.srcObject = event.streams[0];
        // }
        event.streams[0].getTracks().forEach((track) => {
          remoteStreamRef.current?.addTrack(track);
        });
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", event.candidate);
        }
      };

      // Handle offer/answer exchange
      peerConnection.onnegotiationneeded = async () => {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("offer", offer);
      };

      socket.on("offer", async (offer) => {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("answer", answer);
      });

      socket.on("answer", async (answer) => {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      });

      socket.on("ice-candidate", async (candidate) => {
        if (peerConnection.remoteDescription) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      peerConnectionRef.current = peerConnection;
    };

    initWebRTC();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      socket.disconnect();
    };
  }, []);

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks()[0].enabled = !isVideoEnabled;
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks()[0].enabled = !isAudioEnabled;
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const startScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(screenStream.getVideoTracks()[0]);
        }
        setIsScreenSharing(true);
      } catch (error) {
        console.error("Error starting screen sharing", error);
      }
    } else {
      const sender = peerConnectionRef.current
        ?.getSenders()
        .find((s) => s.track?.kind === "video");
      if (sender && localStreamRef.current) {
        sender.replaceTrack(localStreamRef.current.getVideoTracks()[0]);
      }
      setIsScreenSharing(false);
    }
  };

  const startRecording = () => {
    if (localStreamRef.current) {
      mediaRecorderRef.current = new MediaRecorder(localStreamRef.current);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = saveRecording;
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveRecording = () => {
    const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recorded-video.webm";
    a.click();
    URL.revokeObjectURL(url);
    recordedChunksRef.current = [];
  };

  const hangUp = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    socket.emit("hangup");
    setIsVideoEnabled(false);
    setIsAudioEnabled(false);
    setIsScreenSharing(false);
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4 bg-gray-900 text-white">
      <div className="flex space-x-4">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-64 h-48 border rounded-lg"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-64 h-48 border rounded-lg"
        />
      </div>
      <div className="flex space-x-2">
        <button onClick={toggleVideo} className="p-2 bg-blue-500 rounded-lg">
          {isVideoEnabled ? "Stop Video" : "Start Video"}
        </button>
        <button onClick={toggleAudio} className="p-2 bg-green-500 rounded-lg">
          {isAudioEnabled ? "Mute" : "Unmute"}
        </button>
        <button
          onClick={startScreenShare}
          className="p-2 bg-yellow-500 rounded-lg"
        >
          {isScreenSharing ? "Stop Share" : "Share Screen"}
        </button>
        {isRecording ? (
          <button onClick={stopRecording} className="p-2 bg-red-500 rounded-lg">
            Stop Recording
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="p-2 bg-purple-500 rounded-lg"
          >
            Record
          </button>
        )}
        <button onClick={hangUp} className="p-2 bg-gray-500 rounded-lg">
          Hang Up
        </button>
      </div>
    </div>
  );
};

export default WebRTCVideoChat;
