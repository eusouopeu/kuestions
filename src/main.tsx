import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { aplicarTema, temaInicial } from "./lib/tema";
import "./styles.css";

// Antes de qualquer render: evita o flash do tema claro em quem escolheu
// escuro (a leitura definitiva via Preferences, assíncrona, roda no boot
// de App e só reconcilia se divergir deste espelho local).
aplicarTema(temaInicial());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
