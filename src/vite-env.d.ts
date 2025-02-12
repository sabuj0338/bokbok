/// <reference types="vite/client" />

type VideoStreamType = {
  stream: MediaStream;
  peerId: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isLocal?: true;
}