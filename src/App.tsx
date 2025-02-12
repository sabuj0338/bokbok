import { lazy, Suspense } from "react";
import Loader from "./components/Loader";

const WebRTCVideoChat = lazy(
  () => import("./components/group/WebRTCVideoChat")
);
const BokBok = lazy(() => import("./components/BokBok"));
const Welcome = lazy(() => import("./components/Welcome"));

function App() {
  const bokBokId = window.location.pathname.split("/").pop();

  if (!bokBokId) {
    return (
      <Suspense fallback={<Loader />}>
        <Welcome />
      </Suspense>
    );
  }

  if (bokBokId.length < 4) {
    return (
      <div className="w-full h-full min-h-screen text-gray-100 dark:text-white flex justify-center items-center flex-col">
        <h1>Invalid Meeting ID</h1>
        <a href="/" className="text-blue-600 hover:text-blue-700">
          Go Back
        </a>
      </div>
    );
  }

  if (bokBokId.length < 10) {
    return (
      <Suspense fallback={<Loader />}>
        <BokBok bokBokId={bokBokId} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<Loader />}>
      <WebRTCVideoChat bokBokId={bokBokId} />
    </Suspense>
  );
}

export default App;
