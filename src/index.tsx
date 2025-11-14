import React from "react";
import { createRoot } from "react-dom/client";
import AIPromptVault from "./AIPromptVault";
import { RealtorExecutionApp } from "./RealtorExecutionApp";
import "./index.css";

// Suppress harmless ResizeObserver errors (browser timing quirk during quality meter updates)
// Suppress both console errors and React error overlay
window.addEventListener('error', (e) => {
  if (e.message?.includes('ResizeObserver')) {
    e.stopImmediatePropagation();
    e.preventDefault();
    return false;
  }
});

// Also catch unhandled rejections
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason?.message?.includes('ResizeObserver')) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

// Override console.error to filter ResizeObserver warnings
const originalError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('ResizeObserver')) return;
  originalError.apply(console, args);
};

// Check URL parameter - use old app only if explicitly requested
const params = new URLSearchParams(window.location.search);
const useOldApp = params.get('legacy') === 'true' || params.get('v1') === 'true';

const root = createRoot(document.getElementById("root")!);
root.render(useOldApp ? <AIPromptVault /> : <RealtorExecutionApp />);