import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import CallYourSphereWizard from "./CallYourSphereWizard";
import CallYourSphereWizardV2 from "./CallYourSphereWizardV2";
import PromptCrafter from "./PromptCrafter";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Feature flags
const USE_V2 = true; // Call Your Sphere version

// Simple routing based on URL path
function App() {
  const path = window.location.pathname;

  // /prompts or /ai-scripts -> PromptCrafter
  if (path === '/prompts' || path === '/ai-scripts') {
    return <PromptCrafter />;
  }

  // Default: Call Your Sphere
  return USE_V2 ? <CallYourSphereWizardV2 /> : <CallYourSphereWizard />;
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA support
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('Call Your Sphere is now available offline!');
  },
  onUpdate: (registration: ServiceWorkerRegistration) => {
    console.log('New version available! Please refresh to update.');

    // Show a user-friendly prompt instead of force-reloading
    // eslint-disable-next-line no-restricted-globals
    const updateAvailable = confirm(
      'A new version of Call Your Sphere is available! Would you like to update now?\n\n' +
      'Click OK to refresh and get the latest version.'
    );

    if (updateAvailable && registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }
});

// Suppress harmless ResizeObserver errors (browser timing quirk during quality meter updates)
// Suppress both console errors and React error overlay
window.addEventListener("error", (e) => {
  if (e.message?.includes("ResizeObserver")) {
    e.stopImmediatePropagation();
    e.preventDefault();
    return false;
  }
});

// Also catch unhandled rejections
window.addEventListener("unhandledrejection", (e) => {
  if (e.reason?.message?.includes("ResizeObserver")) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

// Override console.error to filter ResizeObserver warnings
const originalError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.("ResizeObserver")) return;
  originalError.apply(console, args);
};