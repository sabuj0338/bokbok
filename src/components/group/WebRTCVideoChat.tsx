import { useEffect, useRef, useState } from "react";
import { ice_servers, media_constraints } from "../../consts";
import { socket } from "../../socket";
import AudioIconButton from "../AudioIconButton";
import HangUpIconButton from "../HangUpIconButton";
import Loader from "../Loader";
import VideoIconButton from "../VideoIconButton";
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
  const [videoStreamList, setVideoStreamList] = useState<VideoStreamType[]>([]);

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

  async function toggleAudio() {
    console.log("👉 toggle audio");

    const localStream = videoStreamList.find((item) => item.isLocal);
    if (localStream) {
      // console.log("👉 ", peerConnectionListRef.current, localStream.peerId);
      localStream.stream.getAudioTracks()[0].enabled = !localStream.isAudioEnabled;
      socket.emit("room:user-toggle-audio", localStream.peerId, !localStream.isAudioEnabled);

      setVideoStreamList((prev) => {
        return prev.map((item) => {
          if (item.peerId === localStream.peerId && item.isLocal) {
            return { ...item, isAudioEnabled: !localStream.isAudioEnabled };
          }
          return item;
        });
      });
    }
  }

  async function toggleVideo() {
    console.log("👉 toggle video");
    const localStream = videoStreamList.find((item) => item.isLocal);

    if (localStream) {
      const videoTrack = localStream.stream.getVideoTracks()[0];

      if (localStream.isVideoEnabled) {
        videoTrack.stop(); // Stop the camera
        setVideoStreamList((prev) => {
          return prev.map((item) => {
            if (item.peerId === localStream.peerId && item.isLocal) {
              return { ...item, isVideoEnabled: false };
            }
            return item;
          });
        });
        socket.emit("room:user-toggle-video", localStream.peerId, false);
      } else {
        const _newLocalStream = await navigator.mediaDevices.getUserMedia({
          video: media_constraints.video,
        });
        setVideoStreamList((prev) => {
          return prev.map((item) => {
            if (item.peerId === localStream.peerId && item.isLocal) {
              return { ...item, isVideoEnabled: true, stream: _newLocalStream };
            }
            return item;
          });
        });
        socket.emit("room:user-toggle-video", localStream.peerId, true);
      }
    }
  }

  function hangUp(byClick?: boolean) {
    // if (localStreamRef.current) {
    //   localStreamRef.current.getTracks().forEach((track) => track.stop());
    // }
    // if (peerConnectionRef.current) {
    //   peerConnectionRef.current.close();
    // }
    // if (mediaRecorderRef.current) {
    //   mediaRecorderRef.current.stop();
    // }
    // setIsVideoEnabled(false);
    // setIsAudioEnabled(false);
    // setIsScreenSharing(false);
    // setIsRemoteScreenSharing(false);
    // setIsRecording(false);
    if (byClick === true) socket.emit("hang-up");
    socket.disconnect();
    window.location.href = "/";
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
      // Check if this stream is already added
      setVideoStreamList((prev) => {
        const isAlreadyAdded = prev.some(
          (item) => item.stream.id === event.streams[0].id
        );
        if (!isAlreadyAdded) {
          return [
            ...prev,
            {
              peerId,
              stream: event.streams[0],
              isAudioEnabled: true,
              isVideoEnabled: true,
            },
          ];
        }
        return prev;
      });
    };

    // Attach local stream tracks to peer connection
    const stream = await navigator.mediaDevices.getUserMedia(media_constraints);
    stream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, stream));

    return peerConnection;
  }

  async function localStreamInit(peerId: string) {
    const _localStream = await navigator.mediaDevices.getUserMedia(
      media_constraints
    );

    // Add local stream to videoStreamList
    setVideoStreamList((prev) => [
      ...prev,
      {
        peerId: peerId,
        stream: _localStream,
        isAudioEnabled: true,
        isVideoEnabled: true,
        isLocal: true,
      },
    ]);
  }

  useEffect(() => {
    if(isSocketConnected) {
      // console.log("localStreamInit", socket.connected, socket.id);
      localStreamInit(socket.id as string);
    }
  },[isSocketConnected])

  useEffect(() => {
    console.log("use effect", socket.connected);
    socket.on("connect", onConnect);

    socket.on("disconnect", onDisconnect);

    // socket.on("hang-up", hangUp);

    const initWebRTC = async () => {
      socket.emit("join-room", bokBokId);

      // localStreamInit(socket.id as string);

      socket.on("room:user-joined", async (peerId) => {
        console.log("room:user-joined", peerId);
        // Check if a connection already exists
        if (!peerConnectionListRef.current[peerId]) {
          const peerConnection = await createPeerConnection(peerId);
          peerConnectionListRef.current[peerId] = peerConnection;

          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socket.emit("room:offer", peerId, offer);
        }
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

    socket.on("room:user-toggle-video", (peerId, enabled) => {
      console.log("👉 toggle remote video", peerId, enabled);
    
      setVideoStreamList((prev) => {
        const remoteStream = prev.find((item) => item.peerId === peerId);
        if (remoteStream) {
          remoteStream.stream.getVideoTracks()[0].enabled = enabled;
        }
        return prev.map((item) => {
          if (item.peerId === peerId) {
            return { ...item, isVideoEnabled: enabled };
          }
          return item;
        });
      });
    });
    
    socket.on("room:user-toggle-audio", (peerId, enabled) => {
      console.log("👉 toggle remote audio", peerId, enabled);
    
      setVideoStreamList((prev) => {
        const remoteStream = prev.find((item) => item.peerId === peerId);
        if (remoteStream) {
          remoteStream.stream.getAudioTracks()[0].enabled = enabled;
        }
        return prev.map((item) => {
          if (item.peerId === peerId) {
            return { ...item, isAudioEnabled: enabled };
          }
          return item;
        });
      });
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, [bokBokId]);

  console.log("bokBokId", videoStreamList);

  const hidden = isSocketConnected ? "" : "hidden";
  const localVideoStream = videoStreamList.find((item) => item.isLocal);

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
          <div ref={videoGridRef} className="w-full grid grid-cols-1 gap-4">
            {videoStreamList.map((item, index) => (
              <VideoStream key={item.peerId + index} videoStream={item} />
            ))}
          </div>
        </div>
      </main>

      <nav className="w-full flex justify-center items-center fixed bottom-8 left-0 right-0">
        <div className="py-3 px-4 inline-flex flex-wrap justify-center gap-2 bg-zinc-800 rounded-full">
          {/* <RecordIconButton
            status={isRecording}
            onClick={startScreenRecording}
          /> */}
          {localVideoStream && (
            <AudioIconButton
              status={localVideoStream.isAudioEnabled}
              onClick={toggleAudio}
            />
          )}
          {localVideoStream && (
            <VideoIconButton
              status={localVideoStream.isVideoEnabled}
              onClick={toggleVideo}
            />
          )}
          {/* <ShareScreenIconButton
            status={isScreenSharing}
            onClick={toggleScreenShare}
          /> */}
          <HangUpIconButton onClick={() => hangUp(true)} />
        </div>
      </nav>
    </div>
  );
}
