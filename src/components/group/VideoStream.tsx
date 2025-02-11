import { useEffect, useRef } from "react";

type Props = {
  stream: MediaStream;
};
export default function VideoStream({ stream }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    videoRef.current!.srcObject = stream;
  });
  return (
    <video
      autoPlay
      muted
      playsInline
      className="aspect-video bg-zinc-900 rounded"
      ref={videoRef}
    />
  );
}
