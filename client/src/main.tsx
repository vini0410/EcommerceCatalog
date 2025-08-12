import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "@/context/AuthContext";
import { LocaleProvider } from "@/context/LocaleContext";

createRoot(document.getElementById("root")!).render(
  <LocaleProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </LocaleProvider>
);
