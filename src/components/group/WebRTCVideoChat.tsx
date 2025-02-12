import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { ice_servers, media_constraints } from "../../consts";
import { socket } from "../../socket";
import AudioIconButton from "../AudioIconButton";
import HangUpIconButton from "../HangUpIconButton";
import Loader from "../Loader";
import ShareScreenIconButton from "../ShareScreenIconButton";
import Video from "../Video";
import VideoIconButton from "../VideoIconButton";
import VideoStream from "./VideoStream";

type Props = {
  bokBokId: string;
};

export default function WebRTCVideoChat({ bokBokId }: Props) {
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  const peerConnectionListRef = useRef<Record<string, RTCPeerConnection>>({});
  // const streamList = useRef<VideoStreamType[]>([]);
  const [videoStreamList, setVideoStreamList] = useState<VideoStreamType[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);

  const screenShareVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareStreamRef = useRef<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  // const [isRemoteScreenSharing, setIsRemoteScreenSharing] = useState(false);

  async function toggleScreenShare() {
    const localStream = localStreamRef.current;
    if (!localStream) return;

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

        // Replace video track with screen track
        Object.values(peerConnectionListRef.current).forEach(
          (peerConnection) => {
            const sender = peerConnection
              .getSenders()
              .find((s) => s.track?.kind === "video");
            if (sender) {
              sender.replaceTrack(screenTrack);
            }
          }
        );

        // Force renegotiation to update peers
        // await Promise.all(
        //   Object.values(peerConnectionListRef.current).map(
        //     async (peerConnection) => {
        //       const offer = await peerConnection.createOffer();
        //       await peerConnection.setLocalDescription(offer);
        //       socket.emit("room:offer", socket.id, offer);
        //     }
        //   )
        // );

        // Notify peers about screen sharing
        socket.emit("room:user-screen-share", socket.id, true);

        // Handle stop sharing event
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
  async function stopScreenShare() {
    if (screenShareStreamRef.current) {
      screenShareStreamRef.current.getTracks().forEach((track) => track.stop());
      screenShareStreamRef.current = null;
    }

    // Switch back to the camera stream
    if (localStreamRef.current) {
      const newVideoTrack = localStreamRef.current.getVideoTracks()[0];
      Object.values(peerConnectionListRef.current).forEach((peerConnection) => {
        const sender = peerConnection
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(newVideoTrack);
      });

      // turn off video
      toggleVideo();
      // Force renegotiation to update peers
      // await Promise.all(
      //   Object.values(peerConnectionListRef.current).map(
      //     async (peerConnection) => {
      //       const offer = await peerConnection.createOffer();
      //       await peerConnection.setLocalDescription(offer);
      //       socket.emit("room:offer", socket.id, offer);
      //     }
      //   )
      // );
    }

    // Notify peers that screen sharing stopped
    socket.emit("room:user-screen-share", socket.id, false);

    setIsScreenSharing(false);
  }

  async function toggleAudio() {
    console.log("👉 toggle audio");

    const localStream = videoStreamList.find((item) => item.isLocal);
    if (localStream && localStream.stream) {
      localStream.stream.getAudioTracks()[0].enabled =
        !localStream.isAudioEnabled;
      socket.emit(
        "room:user-toggle-audio",
        localStream.peerId,
        !localStream.isAudioEnabled
      );

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

    const localStreamIndex = videoStreamList.findIndex((item) => item.isLocal);
    if (localStreamIndex === -1 || localStreamRef.current == null) return; // Local stream not found
    const currentStream = videoStreamList[localStreamIndex]; // Local stream found

    const videoTrack = localStreamRef.current.getVideoTracks()[0];

    if (currentStream.isVideoEnabled) {
      // Turn video OFF
      videoTrack.stop();
      localStreamRef.current.removeTrack(videoTrack);

      setVideoStreamList((prev) => {
        const newList = [...prev];
        newList[localStreamIndex] = { ...currentStream, isVideoEnabled: false };
        return newList;
      });

      socket.emit("room:user-toggle-video", currentStream.peerId, false);
    } else {
      // Turn video ON
      const newLocalStream = await navigator.mediaDevices.getUserMedia({
        video: media_constraints.video,
      });
      const newVideoTrack = newLocalStream.getVideoTracks()[0];
      localStreamRef.current.addTrack(newVideoTrack);

      Object.values(peerConnectionListRef.current).forEach((peerConnection) => {
        const sender = peerConnection
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(newVideoTrack);
        }
      });

      setVideoStreamList((prev) => {
        const newList = [...prev];
        newList[localStreamIndex] = {
          ...currentStream,
          isVideoEnabled: true,
          stream: newLocalStream,
        };
        return newList;
      });

      socket.emit("room:user-toggle-video", currentStream.peerId, true);
    }
  }

  function hangUp(byClick?: boolean) {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (byClick === true) socket.emit("room:user-hang-up");
    socket.disconnect();
    window.location.href = "/";
  }

  async function createPeerConnection(peerId: string) {
    console.log("👉 create peer connection", peerId);

    const peerConnection = new RTCPeerConnection(ice_servers);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("room:ice-candidate", peerId, event.candidate);
      }
    };

    // add remote stream to videoStreamList,
    // it fires when remote user add stream to peer connection
    peerConnection.ontrack = (event) => {
      // Check if this stream is already added
      setVideoStreamList((prev) => {
        const isAlreadyAdded = prev.some(
          (item) =>
            item.peerId === peerId && item.stream.id === event.streams[0].id
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

    peerConnection.oniceconnectionstatechange = async () => {
      if (!peerConnection || peerConnection.iceConnectionState === "closed")
        return;
      if (peerConnection.iceConnectionState === "disconnected") {
        console.warn("Peer disconnected! Attempting to reconnect...");

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("room:user-reconnect-offer", peerId, offer);
      }
    };

    peerConnection.onconnectionstatechange = async () => {
      if (peerConnection.connectionState === "failed") {
        console.error("Connection failed! Resetting...");

        if (peerConnectionListRef.current[peerId]) {
          peerConnectionListRef.current[peerId].close();
          delete peerConnectionListRef.current[peerId];
        }
        // createPeerConnection(peerId);
      }
    };

    // Handle offer/answer exchange
    peerConnection.onnegotiationneeded = async () => {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit("room:offer", peerId, offer);
    };

    // Attach local stream only once
    const _localStream = localStreamRef.current;
    if (_localStream) {
      _localStream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, _localStream));
    }

    return peerConnection;
  }

  async function localStreamInit(peerId: string) {
    const _localStream = await navigator.mediaDevices.getUserMedia(
      media_constraints
    );

    // store local stream
    localStreamRef.current = _localStream;

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
    if (isSocketConnected) {
      localStreamInit(socket.id as string);
    }
  }, [isSocketConnected]);

  useEffect(() => {
    console.log("👉 use effect", socket.connected);

    socket.on("connect", () => setIsSocketConnected(true));

    socket.on("disconnect", () => setIsSocketConnected(false));

    const initWebRTC = async () => {
      socket.emit("join-room", bokBokId);

      socket.on("room:user-joined", async (peerId) => {
        console.log("room:user-joined", peerId);

        const peerConnection = await createPeerConnection(peerId);
        peerConnectionListRef.current[peerId] = peerConnection;

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("room:offer", peerId, offer);
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
          streamToRemove?.stream?.getTracks().forEach((track) => track.stop());

          // Filter out the stream of the disconnected peer
          return prev.filter((item) => item.peerId !== peerId);
        });
      });

      // Handle receiving a remote screen share signal
      socket.on("room:user-screen-share", (peerId, isSharing) => {
        console.log("room:user-screen-share", isSharing, peerId);

        setVideoStreamList((prev) => {
          return prev.map((item) => {
            if (item.peerId === peerId) {
              return { ...item, isVideoEnabled: isSharing };
            }
            return item;
          });
        });
      });
    };

    initWebRTC();

    socket.on("room:user-toggle-video", (peerId, enabled) => {
      console.log("room:user-toggle-video", peerId, enabled);

      setVideoStreamList((prev) => {
        const remoteStream = prev.find((item) => item.peerId === peerId);
        if (remoteStream && remoteStream.stream) {
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
      console.log("room:user-toggle-audio", peerId, enabled);

      setVideoStreamList((prev) => {
        const remoteStream = prev.find((item) => item.peerId === peerId);
        if (remoteStream && remoteStream.stream) {
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
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      socket.off("connect");
      socket.off("disconnect");
      // setIsScreenSharing(false);
      socket.disconnect();
    };
  }, [bokBokId]);

  console.log("bokBokId", videoStreamList, peerConnectionListRef.current);

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
          <div className={`w-full md:w-4/5 ${isScreenSharing ? "" : "hidden"}`}>
            <Video
              id="screenShareVideo"
              isVideoEnabled={isScreenSharing}
              isAudioEnabled={false}
              videoRef={screenShareVideoRef}
              className={`border border-zinc-600`}
            />
          </div>

          <div
            className={twMerge(
              "grid grid-cols-1 gap-4",
              isScreenSharing
                ? "w-full md:w-1/5"
                : "w-full md:grid-cols-2 lg:grid-cols-3"
            )}
          >
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
          {localVideoStream && (
            <ShareScreenIconButton
              status={isScreenSharing}
              onClick={toggleScreenShare}
            />
          )}
          <HangUpIconButton onClick={() => hangUp(true)} />
        </div>
      </nav>
    </div>
  );
}
