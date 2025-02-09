import { useEffect, useState } from "react";
import VideoIcon from "../icons/VideoIcon";
import VideoOffIcon from "../icons/VideoOffIcon";
import { socket } from "../socket";
import Loader from "./Loader";

type Props = {
  bokBokId: string;
};

export default function BokBok({ bokBokId }: Props) {
  const [isConnected, setIsConnected] = useState(socket.connected);
  // const [fooEvents, setFooEvents] = useState([]);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    // function onFooEvent(value) {
    //   setFooEvents((previous) => [...previous, value]);
    // }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    // socket.on("foo", onFooEvent);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      // socket.off("foo", onFooEvent);
    };
  }, []);

  console.log(isConnected, bokBokId);

  if (!socket.connected) {
    return <Loader/>;
  }

  return (
    <>
      <main className="flex flex-col justify-center items-center">
        <div id="video-streams" className="flex justify-center"></div>
        <h2>Local WebRTC Video Call</h2>
        <div className="p-3 w-full flex justify-center gap-8">
          <video
            id="localVideo"
            className="max-w-60"
            // autoplay
            // playsinline
            controls
          ></video>
          <video
            id="remoteVideo"
            className="max-w-60"
            // autoplay
            // playsinline
            controls
          ></video>
        </div>

        <div className="p-3 flex flex-wrap justify-center gap-4">
          <button
            id="videoButton"
            // onClick="toggleVideo()"
            type="button"
            className="cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 focus:ring-4 focus:ring-indigo-500"
          >
            Stop Video
          </button>
          <button
            id="muteButton"
            // onClick="toggleAudio()"
            type="button"
            className="cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 focus:ring-4 focus:ring-indigo-500"
          >
            Mute
          </button>
          <button
            // onClick="startCall()"
            type="button"
            className="cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 focus:ring-4 focus:ring-indigo-500"
          >
            Start Call
          </button>
          <button
            // onClick="hangUp()"
            type="button"
            className="cursor-pointer px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 focus:ring-4 focus:ring-red-500"
          >
            Hang Up
          </button>
          <button
            // onClick="attemptReconnection()"
            type="button"
            className="cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 focus:ring-4 focus:ring-indigo-500"
          >
            Reconnect
          </button>
          <button
            // onClick="startScreenShare()"
            type="button"
            className="cursor-pointer px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 focus:ring-4 focus:ring-purple-500"
          >
            Share Screen
          </button>
          <button
            // onClick="stopScreenShare()"
            type="button"
            className="cursor-pointer px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 focus:ring-4 focus:ring-red-500"
          >
            Stop Sharing
          </button>
          <button
            id="startRecording"
            type="button"
            className="cursor-pointer px-4 py-2 bg-lime-600 text-white rounded hover:bg-lime-500 focus:ring-4 focus:ring-lime-500"
          >
            Start Recording
          </button>
          <button
            id="stopRecording"
            type="button"
            className="cursor-pointer px-4 py-2 bg-lime-600 text-white rounded hover:bg-lime-500 focus:ring-4 focus:ring-lime-500"
          >
            Stop & Download
          </button>

          <button
            // onClick="toggleVideo(false)"
            type="button"
            className="cursor-pointer px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-500 focus:ring-4 focus:ring-orange-500"
          >
            Disable Video
          </button>
          <button
            // onClick="toggleAudio(false)"
            type="button"
            className="cursor-pointer px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-500 focus:ring-4 focus:ring-orange-500"
          >
            Mute Audio
          </button>
        </div>
      </main>

      <nav className="w-full flex justify-center fixed bottom-8 left-0 right-0">
        <div className="min-w-60 p-3 inline-flex flex-wrap justify-center gap-2 bg-zinc-900 rounded-full">
          <button
            id="videoButton"
            type="button"
            className="cursor-pointer px-3 py-3 text-zinc-300 bg-zinc-800 rounded-full hover:bg-zinc-700"
          >
            <VideoIcon />
          </button>
          <button
            id="videoButton"
            type="button"
            className="cursor-pointer px-3 py-3 text-zinc-300 bg-zinc-800 rounded-full hover:bg-zinc-700"
          >
            <VideoOffIcon />
          </button>
        </div>
      </nav>
    </>
  );
}
