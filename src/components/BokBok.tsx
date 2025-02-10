import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import BokBokView from "./BokBokView";

type Props = {
  bokBokId: string;
};

export default function BokBok({ bokBokId }: Props) {
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
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

  // initialize the socket connection
  async function onConnect() {
    console.log("socket connected");
    setIsSocketConnected(true);
  }

  async function onDisconnect() {
    console.log("socket disconnected");
    setIsSocketConnected(false);
    socket.disconnect();
    window.location.href = "/";
  }

  useEffect(() => {
    socket.on("connect", onConnect);

    socket.on("disconnect", onDisconnect);

    // socket.on("hang-up", () => {
    //   stopRecording();
    //   if (localStreamRef.current) {
    //     localStreamRef.current.getTracks().forEach((track) => track.stop());
    //   }
    //   if (peerConnectionRef.current) {
    //     peerConnectionRef.current.close();
    //   }
    //   setIsVideoEnabled(false);
    //   setIsAudioEnabled(false);
    //   setIsScreenSharing(false);
    //   setIsRecording(false);
    //   socket.disconnect();
    //   window.location.href = "/";
    // });

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
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, []);

  const toggleVideo = async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];

      if (isVideoEnabled) {
        videoTrack.stop(); // Stop the camera
        localStreamRef.current.removeTrack(videoTrack);
        setIsVideoEnabled(false);
      } else {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
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
      }
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

  const hangUp = (byClick?: boolean) => {
    stopRecording();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    setIsVideoEnabled(false);
    setIsAudioEnabled(false);
    setIsScreenSharing(false);
    setIsRecording(false);
    socket.disconnect();
    window.location.href = "/";
    if (byClick === true) socket.emit("hang-up");
  };

  return (
    <BokBokView
      isVideoEnabled={isVideoEnabled}
      isAudioEnabled={isAudioEnabled}
      isScreenSharing={isScreenSharing}
      isSocketConnected={isSocketConnected}
      isRecording={isRecording}
      startScreenRecording={isRecording ? stopRecording : startRecording}
      startScreenSharing={startScreenShare}
      toggleVideo={toggleVideo}
      toggleAudio={toggleAudio}
      hangUp={() => hangUp(true)}
      localVideoRef={localVideoRef}
      remoteVideoRef={remoteVideoRef}
    />
  );
}
