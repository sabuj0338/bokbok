import { lazy, Suspense } from "react";
import Loader from "./components/Loader";

const BokBok = lazy(() => import("./components/BokBok"));
const Welcome = lazy(() => import("./components/Welcome"));

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const bokBokId = urlParams.get("bokbok_id");

  if (!bokBokId) {
    return (
      <Suspense fallback={<Loader />}>
        <Welcome />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<Loader />}>
      <BokBok bokBokId={bokBokId} />
    </Suspense>
  );
}

export default App;
