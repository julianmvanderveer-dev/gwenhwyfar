import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { seedDatabase } from "./lib/db";
import "./index.css";

seedDatabase().finally(() => {
  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
});
