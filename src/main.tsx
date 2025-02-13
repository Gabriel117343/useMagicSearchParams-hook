import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      {/* para el ejemplo, será necesario envolver con BrowserRouter ya que el hook personalizado utiliza por detras el hook de useSearchParams*/}
      <App />
    </BrowserRouter>
  </StrictMode>
);
