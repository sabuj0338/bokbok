import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { BIT_RATES, ICE_SERVERS, MEDIA_CONSTRAINTS } from "../../consts";
import { socket } from "../../socket";
import BokBokView from "../BokBokView";

type Props = {
  roomId: string;
};

export default function OneToOne({ roomId }: Props) {
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

  useEffect(() => {
    console.info("👉 is socket connected use effect");

    /**
     * socket connected
     * initiate local stream
     * join room
     */
    socket.on("connect", async () => {
      console.log("👉 socket connected");

      await localStreamInit();

      socket.emit("join-meeting-room", roomId);

      setIsSocketConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("👉 socket disconnected");
      setIsSocketConnected(false);
    });

    /**
     * @param remoteUserId string
     * who is disconnected. it can be first user or second user
     */
    socket.on("user-disconnected", (remoteUserId) => {
      console.log("👉 user-disconnected event", remoteUserId);
      hangUp();
    });

    /**
     * @param remoteUserId string
     * second user who is joined
     * and sent joined event to first joined user
     */
    socket.on("user-joined", async (remoteUserId) => {
      console.log("👉 user-joined event", remoteUserId);
      const peerConnection = await createPeerConnection(remoteUserId);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      // sending offer to second user
      socket.emit("offer", { targetUserId: remoteUserId, offer });
    });

    /**
     * @param localUserId string
     * this event is receiving second user
     * first user sent offer to second user
     */
    socket.on("offer", async ({ localUserId, offer }) => {
      console.log("👉 offer event", localUserId);
      const peerConnection = await createPeerConnection(localUserId);
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      // sending answer to remote user
      socket.emit("answer", { targetUserId: localUserId, answer });
    });

    /**
     * @param localUserId string
     * this event is receiving first user
     * second user sent answer to first user offer
     */
    socket.on("answer", async ({ localUserId, answer }) => {
      console.log("👉 answer event", localUserId);
      await peerConnectionRef.current?.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    /**
     * this event is receiving both user
     * sharing ice candidate
     */
    socket.on("ice-candidate", async ({ candidate }) => {
      console.log("👉 ice-candidate event");
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    });

    /**
     * showing toast message if room is full
     */
    socket.on("room-full", (roomId) => {
      toast.error(`Room ${roomId} is full! Try another room.`);
    });

    // Handle receiving a remote screen share signal
    socket.on("screen-share", async ({ isSharing }) => {
      console.log("screen share started", isSharing);
      if (isSharing && remoteStreamRef.current && screenShareVideoRef.current) {
        screenShareVideoRef.current.srcObject = remoteStreamRef.current;
      } else {
        screenShareVideoRef.current = null;
      }
      setIsRemoteScreenSharing(isSharing);
    });

    socket.on("toggle-video", toggleRemoteVideo);
    socket.on("toggle-audio", toggleRemoteAudio);

    setBitrate();

    return () => {
      socket.off("user-joined");
      socket.off("user-disconnected");
      socket.off("incoming-call");
      socket.off("call-accepted");
      socket.off("ice-candidate");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("room-full");
      socket.off("toggle-video");
      socket.off("toggle-audio");
      socket.off("screen-share");
    };
  }, [roomId]);

  async function localStreamInit() {
    if (localStreamRef.current) return; // Prevent re-initialization
    const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);

    // store local stream
    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  }

  const createPeerConnection = async (userId: string) => {
    console.log("👉 Creating peer connection");
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = peerConnection;

    remoteStreamRef.current = new MediaStream();
    if (remoteVideoRef.current)
      remoteVideoRef.current.srcObject = remoteStreamRef.current;

    // Add local stream tracks to the peer connection
    localStreamRef.current?.getTracks().forEach((track) => {
      console.log("👉 Adding local track to peer connection");
      peerConnection.addTrack(track, localStreamRef.current!);
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          targetUserId: userId,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      console.log("👉 Received remote camera stream");
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current?.addTrack(track);
      });
    };

    peerConnection.oniceconnectionstatechange = async () => {
      if (!peerConnection || peerConnection.iceConnectionState === "closed")
        return;
      if (peerConnection.iceConnectionState === "disconnected") {
        console.warn("Peer disconnected! Attempting to reconnect...");

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("offer", { targetUserId: userId, offer });
      }
    };

    // peerConnection.onconnectionstatechange = async () => {
    //   if (peerConnection.connectionState === "failed") {
    //     console.error("Connection failed! Resetting...");
    //     if (peerConnectionRef.current) {
    //       peerConnectionRef.current.close();
    //       peerConnectionRef.current = null;
    //     }
    //     createPeerConnection(userId);
    //   }
    // };

    // // Handle offer/answer exchange
    peerConnection.onnegotiationneeded = async () => {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit("offer", { targetUserId: userId, offer });
    };

    return peerConnection;
  };

  async function setBitrate() {
    const sender = peerConnectionRef.current
      ?.getSenders()
      .find((s) => s.track?.kind === "video");
    if (!sender) return;
    const params = sender.getParameters();
    // params.encodings[0].maxBitrate = bitrate * 1000;
    params.encodings = BIT_RATES;
    await sender.setParameters(params);
  }

  async function toggleVideo() {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];

      if (isVideoEnabled) {
        videoTrack.stop(); // Stop the camera
        localStreamRef.current.removeTrack(videoTrack);
        setIsVideoEnabled(false);
        socket.emit("toggle-video", { enabled: false });
      } else {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: MEDIA_CONSTRAINTS.video,
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
        socket.emit("toggle-video", { enabled: true });
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
      socket.emit("toggle-audio", { enabled: !isAudioEnabled });
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
        socket.emit("screen-share", {
          isSharing: true,
          streamId: screenShareStream.id,
        });

        // Handle stop sharing event
        screenTrack.onended = () => stopScreenShare();

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
      // Notify remote user that screen sharing stopped
      socket.emit("screen-share", {
        isSharing: false,
        streamId: screenShareStreamRef.current?.id,
      });

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

  function hangUp() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsVideoEnabled(false);
    setIsAudioEnabled(false);
    setIsScreenSharing(false);
    setIsRecording(false);
    socket.disconnect();
    window.location.href = "/";
  }

  return (
    <BokBokView
      socketId={socket.id as string}
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
      hangUp={hangUp}
      localVideoRef={localVideoRef}
      remoteVideoRef={remoteVideoRef}
      screenShareVideoRef={screenShareVideoRef}
    />
  );
}
