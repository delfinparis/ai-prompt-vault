import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AIPromptVault from "./AIPromptVault";

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <AIPromptVault />
    </React.StrictMode>
  );
}<<<<<<< HEAD
import React from "react";
import { createRoot } from "react-dom/client";
import AIPromptVault from "./AIPromptVault";
import "./App.css";

const root = createRoot(document.getElementById("root")!);
root.render(<AIPromptVault />);
=======
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
>>>>>>> 0511aae (Initialize project using Create React App)
