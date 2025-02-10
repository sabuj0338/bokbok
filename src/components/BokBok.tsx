import { useEffect, useRef, useState } from "react";
import { ice_servers, media_constraints } from "../consts";
import { socket } from "../socket";
import BokBokView from "./BokBokView";

type Props = {
  bokBokId: string;
};

export default function BokBok({ bokBokId }: Props) {
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isRemoteVideoEnabled, setIsRemoteVideoEnabled] = useState(true);
  const [isRemoteAudioEnabled, setIsRemoteAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRemoteScreenSharing, setIsRemoteScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const screenShareStreamRef = useRef<MediaStream | null>(null);

  // initialize the socket connection
  async function onConnect() {
    console.log("socket connected");
    setIsSocketConnected(true);
  }

  async function onDisconnect() {
    console.log("socket disconnected");
    setIsSocketConnected(false);
  }

  useEffect(() => {
    socket.on("connect", onConnect);

    socket.on("disconnect", onDisconnect);

    // socket.on("hang-up", hangUp);

    const initWebRTC = async () => {
      const localStream = await navigator.mediaDevices.getUserMedia(
        media_constraints
      );
      localStreamRef.current = localStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      const peerConnection = new RTCPeerConnection(ice_servers);

      // Attach local stream tracks to peer connection
      localStream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, localStream));

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
        if (event.candidate && !event.candidate.candidate.includes("relay")) {
          socket.emit("ice-candidate", event.candidate);
        }
      };

      peerConnection.oniceconnectionstatechange = async () => {
        if (!peerConnection || peerConnection.iceConnectionState === "closed")
          return;
        if (peerConnection.iceConnectionState === "disconnected") {
          console.warn("Peer disconnected! Attempting to reconnect...");

          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socket.emit("reconnect-offer", offer);
        }
      };

      peerConnection.onconnectionstatechange = async () => {
        if (peerConnection.connectionState === "failed") {
          console.error("Connection failed! Resetting...");
          restartConnection();
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

      // Handle receiving a remote screen share signal
      socket.on("screen-share", (isSharing: boolean) => {
        console.log("screen share started", isSharing);
        if (isSharing) {
          if (remoteStreamRef.current && screenShareVideoRef.current) {
            screenShareVideoRef.current.srcObject = remoteStreamRef.current;
          }
        }
        const stream = screenShareVideoRef.current?.srcObject as MediaStream;
        const videoTrack = stream?.getVideoTracks()[0];
        if (videoTrack) videoTrack.enabled = isSharing;
        setIsRemoteScreenSharing(isSharing);
      });

      peerConnectionRef.current = peerConnection;
    };

    function restartConnection() {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      initWebRTC();
    }

    initWebRTC();

    setBitrate();

    socket.on("toggle-video", toggleRemoteVideo);
    socket.on("toggle-audio", toggleRemoteAudio);

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, []);

  async function setBitrate() {
    // if(!peerConnectionRef.current) return;
    const sender = peerConnectionRef.current
      ?.getSenders()
      .find((s) => s.track?.kind === "video");
    if (!sender) return;
    const params = sender.getParameters();
    // params.encodings[0].maxBitrate = bitrate * 1000;
    params.encodings = [
      {
        rid: "high",
        maxBitrate: 2500000,
      }, // High quality
      {
        rid: "mid",
        maxBitrate: 1000000,
      }, // Medium quality
      {
        rid: "low",
        maxBitrate: 300000,
      }, // Low quality
    ];
    await sender.setParameters(params);
  }

  async function toggleVideo() {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];

      if (isVideoEnabled) {
        videoTrack.stop(); // Stop the camera
        localStreamRef.current.removeTrack(videoTrack);
        setIsVideoEnabled(false);
        socket.emit("toggle-video", false);
      } else {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: media_constraints.video,
        });
        const newVideoTrack = newStream.getVideoTracks()[0];
        localStreamRef.current.addTrack(newVideoTrack);

        // Replace the track in the peer connection
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(newVideoTrack);

        if (localVideoRef.current)
          localVideoRef.current.srcObject = localStreamRef.current;
        setIsVideoEnabled(true);
        socket.emit("toggle-video", true);
      }
    }
  }

  async function toggleRemoteVideo(enabled: boolean) {
    console.log("toggle remote video", enabled);
    setIsRemoteVideoEnabled(enabled);
    if (remoteVideoRef.current) {
      const stream = remoteVideoRef.current.srcObject as MediaStream;
      const videoTrack = stream?.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = enabled;
    }
  }

  function toggleAudio() {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks()[0].enabled = !isAudioEnabled;
      setIsAudioEnabled(!isAudioEnabled);
      socket.emit("toggle-audio", !isAudioEnabled);
    }
  }

  function toggleRemoteAudio(enabled: boolean) {
    console.log("toggle remote audio", enabled);
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getAudioTracks()[0].enabled = enabled;
      setIsRemoteAudioEnabled(enabled);
    }
  }

  async function toggleScreenShare() {
    if (!isScreenSharing) {
      try {
        const screenShareStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenShareStreamRef.current = screenShareStream;
        // Show screen share in a separate video element
        if (screenShareVideoRef.current) {
          screenShareVideoRef.current.srcObject = screenShareStream;
        }
        // Replace video track in WebRTC connection
        const screenTrack = screenShareStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);

        // Notify remote user that screen sharing started
        socket.emit("screen-share", true);

        // Handle when the user stops screen sharing
        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } catch (error) {
        console.error("Error starting screen sharing", error);
      }
    } else {
      stopScreenShare();
    }
  }

  // Stop Screen Sharing
  const stopScreenShare = async () => {
    if (screenShareStreamRef.current) {
      screenShareStreamRef.current.getTracks().forEach((track) => track.stop());
      screenShareStreamRef.current = null;
    }

    // Switch back to the camera stream
    if (localStreamRef.current) {
      const newVideoTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = peerConnectionRef.current
        ?.getSenders()
        .find((s) => s.track?.kind === "video");
      if (sender) sender.replaceTrack(newVideoTrack);
      if (localVideoRef.current)
        localVideoRef.current.srcObject = localStreamRef.current;
    }

    // Notify remote user that screen sharing stopped
    socket.emit("screen-share", false);

    setIsScreenSharing(false);
  };

  function startRecording() {
    if (remoteStreamRef.current) {
      mediaRecorderRef.current = new MediaRecorder(remoteStreamRef.current);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = saveRecording;
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  function saveRecording() {
    const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recorded-video.webm";
    a.click();
    URL.revokeObjectURL(url);
    recordedChunksRef.current = [];
  }

  function hangUp(byClick?: boolean) {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsVideoEnabled(false);
    setIsAudioEnabled(false);
    setIsScreenSharing(false);
    setIsRemoteScreenSharing(false);
    setIsRecording(false);
    if (byClick === true) socket.emit("hang-up");
    socket.disconnect();
    window.location.href = "/";
  }

  console.log("bokBokId", bokBokId);

  return (
    <BokBokView
      isVideoEnabled={isVideoEnabled}
      isAudioEnabled={isAudioEnabled}
      isRemoteVideoEnabled={isRemoteVideoEnabled}
      isRemoteAudioEnabled={isRemoteAudioEnabled}
      isScreenSharing={isScreenSharing}
      isRemoteScreenSharing={isRemoteScreenSharing}
      isSocketConnected={isSocketConnected}
      isRecording={isRecording}
      startScreenRecording={isRecording ? stopRecording : startRecording}
      toggleScreenShare={toggleScreenShare}
      toggleVideo={toggleVideo}
      toggleAudio={toggleAudio}
      hangUp={() => hangUp(true)}
      localVideoRef={localVideoRef}
      remoteVideoRef={remoteVideoRef}
      screenShareVideoRef={screenShareVideoRef}
    />
  );
}
