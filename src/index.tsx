import React from "react";
import { createRoot } from "react-dom/client";
import AIPromptVault from "./AIPromptVault";
import "./index.css";

const root = createRoot(document.getElementById("root")!);
root.render(<AIPromptVault />);