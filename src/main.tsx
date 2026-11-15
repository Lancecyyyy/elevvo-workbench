import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { PrefsProvider } from "./lib/prefs";
import { ToastProvider } from "./lib/toast";
import { WorkspaceProvider } from "./lib/workspace/store";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <PrefsProvider>
        <ToastProvider>
          <WorkspaceProvider>
            <App />
          </WorkspaceProvider>
        </ToastProvider>
      </PrefsProvider>
    </BrowserRouter>
  </StrictMode>,
);
