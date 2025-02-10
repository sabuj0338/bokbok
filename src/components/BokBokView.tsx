import React from "react";
import AudioIconButton from "./AudioIconButton";
import HangUpIconButton from "./HangUpIconButton";
import Loader from "./Loader";
import RecordIconButton from "./RecordIconButton";
import ShareScreenIconButton from "./ShareScreenIconButton";
import Video from "./Video";
import VideoIconButton from "./VideoIconButton";

type Props = {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isRemoteVideoEnabled: boolean;
  isRemoteAudioEnabled: boolean;
  isRecording: boolean;
  isScreenSharing: boolean;
  startScreenRecording: () => void;
  startScreenSharing: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  isSocketConnected: boolean;
  hangUp: (byClick?: boolean) => void;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
};

export default function BokBokView({
  isVideoEnabled,
  isAudioEnabled,
  isRemoteVideoEnabled,
  isRemoteAudioEnabled,
  isScreenSharing,
  isSocketConnected,
  isRecording,
  startScreenRecording,
  startScreenSharing,
  toggleVideo,
  toggleAudio,
  hangUp,
  localVideoRef,
  remoteVideoRef,
}: // socket,
Props) {
  const hidden = isSocketConnected ? "" : "hidden";
  return (
    <div className="container mx-auto">
      {!isSocketConnected && <Loader />}
      <main
        className={`min-h-screen flex flex-col justify-center items-center ${hidden}`}
      >
        <div className="p-3 w-full h-full flex flex-wrap justify-center items-center gap-8">
          <Video
            id="localVideo"
            isVideoEnabled={isVideoEnabled}
            isAudioEnabled={isAudioEnabled}
            videoRef={localVideoRef}
          />
          <Video
            id="remoteVideo"
            isVideoEnabled={isRemoteVideoEnabled}
            isAudioEnabled={isRemoteAudioEnabled}
            videoRef={remoteVideoRef}
          />
        </div>
      </main>

      <nav className="w-full flex justify-center items-center fixed bottom-8 left-0 right-0">
        <div className="py-3 px-4 inline-flex flex-wrap justify-center gap-2 bg-zinc-800 rounded-full">
          <RecordIconButton
            status={isRecording}
            onClick={startScreenRecording}
          />
          <AudioIconButton status={isAudioEnabled} onClick={toggleAudio} />
          <VideoIconButton status={isVideoEnabled} onClick={toggleVideo} />
          <ShareScreenIconButton
            status={isScreenSharing}
            onClick={startScreenSharing}
          />
          <HangUpIconButton onClick={() => hangUp(true)} />
        </div>
      </nav>
    </div>
  );
}
