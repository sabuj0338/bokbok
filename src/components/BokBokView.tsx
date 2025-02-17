import React from "react";
import { twMerge } from "tailwind-merge";
import AudioIconButton from "./buttons/AudioIconButton";
import HangUpIconButton from "./buttons/HangUpIconButton";
import RecordIconButton from "./buttons/RecordIconButton";
import ShareScreenIconButton from "./buttons/ShareScreenIconButton";
import VideoIconButton from "./buttons/VideoIconButton";
import Header from "./Header";
import Loader from "./Loader";
import Video from "./Video";

type Props = {
  socketId: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isRemoteVideoEnabled: boolean;
  isRemoteAudioEnabled: boolean;
  isRecording: boolean;
  isScreenSharing: boolean;
  isRemoteScreenSharing: boolean;
  isSocketConnected: boolean;
  startScreenRecording: () => void;
  toggleScreenShare: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  hangUp: (byClick?: boolean) => void;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  screenShareVideoRef: React.RefObject<HTMLVideoElement | null>;
};

export default function BokBokView({
  socketId,
  isVideoEnabled,
  isAudioEnabled,
  isRemoteVideoEnabled,
  isRemoteAudioEnabled,
  isScreenSharing,
  isRemoteScreenSharing,
  isSocketConnected,
  isRecording,
  startScreenRecording,
  toggleScreenShare,
  toggleVideo,
  toggleAudio,
  hangUp,
  localVideoRef,
  remoteVideoRef,
  screenShareVideoRef,
}: // socket,
Props) {
  const hidden = isSocketConnected ? "" : "hidden";
  return (
    <div className="container mx-auto">
      <Header socketId={socketId}/>
      {!isSocketConnected && <Loader />}
      <main
        className={`min-h-screen flex flex-col justify-center items-center ${hidden}`}
      >
        <div className="p-3 w-full h-full flex flex-wrap md:flex-nowrap justify-center items-center gap-4">
          <div className={`w-full md:w-4/5 ${(isRemoteScreenSharing || isScreenSharing) ? "" : "hidden"}`}>
            <Video
              id="screenShareVideo"
              isVideoEnabled={isRemoteScreenSharing || isScreenSharing}
              isAudioEnabled={false}
              videoRef={screenShareVideoRef}
              className={`border border-zinc-600`}
            />
          </div>
          <div
            className={twMerge(
              "flex flex-wrap justify-center items-center gap-4",
              (isRemoteScreenSharing ||isScreenSharing) ? "w-full md:w-1/5" : "w-full md:flex-nowrap",
            )}
          >
            <Video
              id="localVideo"
              isVideoEnabled={isVideoEnabled}
              isAudioEnabled={isAudioEnabled}
              videoRef={localVideoRef}
              className="border border-green-600"
            />
            <Video
              id="remoteVideo"
              isVideoEnabled={isRemoteVideoEnabled}
              isAudioEnabled={isRemoteAudioEnabled}
              videoRef={remoteVideoRef}
              className="border border-indigo-600"
            />
          </div>
        </div>
      </main>

      <nav className="w-full flex justify-center items-center fixed bottom-8 left-0 right-0">
        <div className="py-3 px-4 inline-flex flex-wrap justify-center gap-2 bg-zinc-200 dark:bg-zinc-800 rounded-full">
          <RecordIconButton
            status={isRecording}
            onClick={startScreenRecording}
          />
          <AudioIconButton status={isAudioEnabled} onClick={toggleAudio} />
          <VideoIconButton status={isVideoEnabled} onClick={toggleVideo} />
          <ShareScreenIconButton
            status={isScreenSharing}
            onClick={toggleScreenShare}
          />
          <HangUpIconButton onClick={() => hangUp(true)} />
        </div>
      </nav>
    </div>
  );
}
