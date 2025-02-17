import { lazy, Suspense } from "react";
import Loader from "./components/Loader";

const WebRTCVideoChat = lazy(
  () => import("./components/group/WebRTCVideoChat")
);
const BokBok = lazy(() => import("./components/BokBok"));
const Welcome = lazy(() => import("./components/Welcome"));

function App() {
  const roomId = window.location.pathname.split("/").pop();

  if (!roomId) {
    return (
      <Suspense fallback={<Loader />}>
        <Welcome />
      </Suspense>
    );
  }

  if (roomId.length < 4) {
    return (
      <div className="w-full h-full min-h-screen text-gray-100 dark:text-white flex justify-center items-center flex-col">
        <h1>Invalid Meeting ID</h1>
        <a href="/" className="text-blue-600 hover:text-blue-700">
          Go Back
        </a>
      </div>
    );
  }

  if (roomId === "one-to-one") {
    return (
      <Suspense fallback={<Loader />}>
        <BokBok />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<Loader />}>
      <WebRTCVideoChat roomId={roomId} />
    </Suspense>
  );
}

export default App;
