import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Toaster
      position="bottom-left"
      containerStyle={{ bottom: "10%" }}
      toastOptions={{
        duration: 3000,
        style: { padding: "16px" },
        // ...toastStyle,
        success: {
          style: {
            border: "1px dashed #16a34a",
            background: "#052e16",
            color: "#f4f4f4",
          },
          iconTheme: {
            primary: "#22c55e",
            secondary: "#f4f4f4",
          },
        },
        error: {
          style: {
            border: "1px dashed #dc2626",
            background: "#450a0a",
            color: "#f4f4f4",
          },
          iconTheme: {
            primary: "#dc2626",
            secondary: "#f4f4f4",
          },
        },
      }}
    />
  </StrictMode>
);
