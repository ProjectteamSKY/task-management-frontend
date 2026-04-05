import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@svar-ui/react-gantt/all.css"; // 👈 add this line

createRoot(document.getElementById("root")!).render(<App />);