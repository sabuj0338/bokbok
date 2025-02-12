import { useEffect, useRef } from "react";

type Props = {
  videoStream: VideoStreamType;
};
export default function VideoStream({ videoStream }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    videoRef.current!.srcObject = videoStream.stream;
  });
  return (
    <div className="relative w-full aspect-video bg-zinc-900 rounded">
      <video
        id={videoStream.stream.id}
        autoPlay
        playsInline
        // muted={isAudioOn}
        className="w-full aspect-video bg-zinc-900 rounded"
        ref={videoRef}
      />

      {!videoStream.isVideoEnabled && (
        <div className="absolute top-0 left-0 right-0 bottom-0 w-full aspect-video bg-zinc-900 rounded flex justify-center items-center">
          <div className="inline-block rounded-full p-8 bg-zinc-700 text-zinc-300 animate-pulse">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8"
            >
              <path d="M18 20a6 6 0 0 0-12 0" />
              <circle cx="12" cy="10" r="4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
        </div>
      )}

      <div className="absolute top-3 right-3 text-zinc-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          {videoStream.isAudioEnabled ? (
            <>
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </>
          ) : (
            <>
              <line x1="2" x2="22" y1="2" y2="22" />
              <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
              <path d="M5 10v2a7 7 0 0 0 12 5" />
              <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
