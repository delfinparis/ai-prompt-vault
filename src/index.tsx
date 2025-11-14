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

// Check URL parameter to determine which app to render
const params = new URLSearchParams(window.location.search);
const useNewApp = params.get('v2') === 'true' || params.get('execution') === 'true';

const root = createRoot(document.getElementById("root")!);
root.render(useNewApp ? <RealtorExecutionApp /> : <AIPromptVault />);