import { useEffect, useRef, useState } from "react";
import { ice_servers, media_constraints } from "../../consts";
import { socket } from "../../socket";
import Loader from "../Loader";
import VideoStream from "./VideoStream";

type Props = {
  bokBokId: string;
};

export default function WebRTCVideoChat({ bokBokId }: Props) {
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  // const localVideoRef = useRef<HTMLVideoElement>(null);
  // const localStreamRef = useRef<MediaStream | null>(null);
  // const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const videoGridRef = useRef<HTMLDivElement>(null);
  const peerConnectionListRef = useRef<RTCPeerConnection[]>([]);
  // const videoStreamListRef = useRef<MediaStream[]>([]);
  const [videoStreamList, setVideoStreamList] = useState<
    { peerId: string; stream: MediaStream }[]
  >([]);

  // const remoteVideoRef = useRef<HTMLVideoElement>(null);
  // const remoteStreamRef = useRef<MediaStream | null>(null);

  // const screenShareVideoRef = useRef<HTMLVideoElement>(null);
  // const screenShareStreamRef = useRef<MediaStream | null>(null);

  // const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  // const recordedChunksRef = useRef<Blob[]>([]);

  // const [isLocalVideoEnabled, setIsLocalVideoEnabled] = useState(true);
  // const [isLocalAudioEnabled, setIsAudioEnabled] = useState(true);

  // const [isRemoteVideoEnabled, setIsRemoteVideoEnabled] = useState(true);
  // const [isRemoteAudioEnabled, setIsRemoteAudioEnabled] = useState(true);

  // const [isScreenSharing, setIsScreenSharing] = useState(false);
  // const [isRemoteScreenSharing, setIsRemoteScreenSharing] = useState(false);

  // const [isRecording, setIsRecording] = useState(false);

  // initialize the socket connection
  async function onConnect() {
    console.log("socket connected");
    setIsSocketConnected(true);
  }

  async function onDisconnect() {
    console.log("socket disconnected");
    setIsSocketConnected(false);
  }

  async function createPeerConnection(peerId: string) {
    console.log("create peer connection", peerId);
    const peerConnection = new RTCPeerConnection(ice_servers);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("room:ice-candidate", peerId, event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      setVideoStreamList((prev) => [
        ...prev,
        { peerId, stream: event.streams[0] },
      ]);
    };

    // Attach local stream tracks to peer connection
    const stream = await navigator.mediaDevices.getUserMedia(media_constraints);
    stream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, stream));

    return peerConnection;
  }

  useEffect(() => {
    // console.log("use effect", bokBokId);
    socket.on("connect", onConnect);

    socket.on("disconnect", onDisconnect);

    // socket.on("hang-up", hangUp);

    async function localStreamInit() {
      if (peerConnectionListRef.current.length == 0) {
        const _localStream = await navigator.mediaDevices.getUserMedia(
          media_constraints
        );
        // setLocalStream(_localStream);
        // setIsLocalVideoEnabled(true);

        // Add local stream to videoStreamList
        setVideoStreamList((prev) => [
          ...prev,
          { peerId: socket.id as string, stream: _localStream },
        ]);
      }
    }

    const initWebRTC = async () => {
      socket.emit("join-room", bokBokId);

      localStreamInit();

      socket.on("room:user-joined", async (peerId) => {
        console.log("room:user-joined", peerId);
        const peerConnection = await createPeerConnection(peerId);
        peerConnectionListRef.current[peerId] = peerConnection;

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("room:offer", peerId, offer);

        // setLocalStream(null);
        // setIsLocalVideoEnabled(false);
      });

      socket.on("room:offer", async (peerId, offer) => {
        console.log("room:offer", peerId);
        const peerConnection = await createPeerConnection(peerId);
        peerConnectionListRef.current[peerId] = peerConnection;

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("room:answer", peerId, answer);

        // setLocalStream(null);
        // setIsLocalVideoEnabled(false);
      });

      socket.on("room:answer", async (peerId, answer) => {
        console.log("room:answer", peerId);
        await peerConnectionListRef.current[peerId].setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      });

      socket.on("room:ice-candidate", (peerId, candidate) => {
        console.log("room:ice-candidate", peerId);
        peerConnectionListRef.current[peerId].addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      });

      socket.on("room:user-left", (peerId) => {
        console.log("room:user-left", peerId);
        if (peerConnectionListRef.current[peerId]) {
          peerConnectionListRef.current[peerId].close();
          delete peerConnectionListRef.current[peerId];
        }

        setVideoStreamList((prev) => {
          // Stop all tracks of the stream before removal
          const streamToRemove = prev.find((item) => item.peerId === peerId);
          streamToRemove?.stream.getTracks().forEach((track) => track.stop());

          // Filter out the stream of the disconnected peer
          return prev.filter((item) => item.peerId !== peerId);
        });
      });
    };

    initWebRTC();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, [bokBokId]);

  console.log("bokBokId", videoStreamList);

  const hidden = isSocketConnected ? "" : "hidden";

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl lg:text-4xl xl:text-5xl font-medium text-black dark:text-gray-100">
        {socket.id}
      </h1>
      {!isSocketConnected && <Loader />}
      <main
        className={`min-h-screen flex flex-col justify-center items-center ${hidden}`}
      >
        <div className="p-3 w-full h-full flex flex-wrap md:flex-nowrap justify-center items-center gap-4">
          {/* <div className="">
            {isLocalVideoEnabled && localStream != null && (
              <VideoStream stream={localStream} />
            )}
          </div> */}
          <div ref={videoGridRef} className="w-full grid grid-cols-1 gap-4">
            {videoStreamList.map(({ peerId, stream }, index) => (
              <VideoStream key={peerId + index} stream={stream} />
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
