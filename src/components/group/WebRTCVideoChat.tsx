import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { socket } from "../../socket";
import Loader from "../Loader";
import VideoStream from "./VideoStream";

type Props = {
  bokBokId: string;
};

export default function WebRTCVideoChat({ bokBokId }: Props) {
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  // const localVideoRef = useRef<HTMLVideoElement>(null);
  // const remoteVideoRef = useRef<HTMLVideoElement>(null);
  // const screenShareVideoRef = useRef<HTMLVideoElement>(null);
  const videoGridRef = useRef<HTMLDivElement>(null);
  const peerConnectionListRef = useRef<RTCPeerConnection[]>([]);
  // const videoStreamListRef = useRef<MediaStream[]>([]);
  const [videoStreamList, setVideoStreamList] = useState<MediaStream[]>([]);
  // const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  // const recordedChunksRef = useRef<Blob[]>([]);
  // const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  // const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  // const [isRemoteVideoEnabled, setIsRemoteVideoEnabled] = useState(true);
  // const [isRemoteAudioEnabled, setIsRemoteAudioEnabled] = useState(true);
  // const [isScreenSharing, setIsScreenSharing] = useState(false);
  // const [isRemoteScreenSharing, setIsRemoteScreenSharing] = useState(false);
  // const [isRecording, setIsRecording] = useState(false);
  // const localStreamRef = useRef<MediaStream | null>(null);
  // const remoteStreamRef = useRef<MediaStream | null>(null);
  // const screenShareStreamRef = useRef<MediaStream | null>(null);

  // initialize the socket connection
  async function onConnect() {
    console.log("socket connected");
    setIsSocketConnected(true);
  }

  async function onDisconnect() {
    console.log("socket disconnected");
    setIsSocketConnected(false);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function createPeerConnection(peerId: any) {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", peerId, event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      console.log("event.streams[0]", event.streams[0]);
      const video = document.createElement("video");
      video.srcObject = event.streams[0];
      video.autoplay = true;
      video.className = "border border-green-600";
      videoGridRef.current?.appendChild(video);
      setVideoStreamList((prev) => [...prev, event.streams[0]]);
    };

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        stream
          .getTracks()
          .forEach((track) => {
            peerConnection.addTrack(track, stream)
            console.log("track", track);
          });
      });

    return peerConnection;
  }

  useEffect(() => {
    console.log("use effect", bokBokId);
    socket.on("connect", onConnect);

    socket.on("disconnect", onDisconnect);

    // socket.on("hang-up", hangUp);

    const initWebRTC = async () => {
      socket.emit("join-room", bokBokId);

      // const localStream = await navigator.mediaDevices.getUserMedia(
      //   media_constraints
      // );
      // localStreamRef.current = localStream;
      // if (localVideoRef.current) {
      //   localVideoRef.current.srcObject = localStream;
      // }
      // Attach local stream tracks to peer connection
      // localStream
      // .getTracks()
      // .forEach((track) => peerConnection.addTrack(track, localStream));

      socket.on("user-joined", async (peerId) => {
        console.log("user-joined", peerId);
        const peerConnection = await createPeerConnection(peerId);
        peerConnectionListRef.current[peerId] = peerConnection;

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("offer", peerId, offer);
      });

      socket.on("offer", async (peerId, offer) => {
        console.log("offer", peerId, offer);
        const peerConnection = await createPeerConnection(peerId);
        peerConnectionListRef.current[peerId] = peerConnection;

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("answer", peerId, answer);
      });

      socket.on("answer", async (peerId, answer) => {
        console.log("answer", peerId, answer);
        await peerConnectionListRef.current[peerId].setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      });

      socket.on("ice-candidate", (peerId, candidate) => {
        console.log("ice-candidate", peerId, candidate);
        peerConnectionListRef.current[peerId].addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      });

      socket.on("user-left", (peerId) => {
        console.log("user-left", peerId);
        if (peerConnectionListRef.current[peerId]) {
          peerConnectionListRef.current[peerId].close();
          peerConnectionListRef.current = peerConnectionListRef.current.filter(
            (item) => item !== peerConnectionListRef.current[peerId]
          );
        }
      });
    };

    initWebRTC();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, [bokBokId]);

  console.log("bokBokId", bokBokId);

  const hidden = isSocketConnected ? "" : "hidden";

  return (
    <div className="container mx-auto">
      {!isSocketConnected && <Loader />}
      <main
        className={`min-h-screen flex flex-col justify-center items-center ${hidden}`}
      >
        <div className="p-3 w-full h-full flex flex-wrap md:flex-nowrap justify-center items-center gap-4">
          <div className=""></div>
          <div
            ref={videoGridRef}
            className={twMerge(
              "flex flex-wrap justify-center items-center gap-4",
              "w-full md:flex-nowrap"
            )}
          >
            {videoStreamList.map((stream, index) => (
              <VideoStream key={index} stream={stream} />
            ))}
          </div>
        </div>
      </main>

      <nav className="w-full flex justify-center items-center fixed bottom-8 left-0 right-0">
        <div className="py-3 px-4 inline-flex flex-wrap justify-center gap-2 bg-zinc-800 rounded-full">
          {/* <RecordIconButton
            status={isRecording}
            onClick={startScreenRecording}
          />
          <AudioIconButton status={isAudioEnabled} onClick={toggleAudio} />
          <VideoIconButton status={isVideoEnabled} onClick={toggleVideo} />
          <ShareScreenIconButton
            status={isScreenSharing}
            onClick={toggleScreenShare}
          />
          <HangUpIconButton onClick={() => hangUp(true)} /> */}
        </div>
      </nav>
    </div>
  );
}
