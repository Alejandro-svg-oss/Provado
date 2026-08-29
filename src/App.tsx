import { Route, Routes } from "react-router-dom";
import { InputPage } from "./routes/InputPage";
import { SearchingPage } from "./routes/SearchingPage";
import { ResultsPage } from "./routes/ResultsPage";
import { HistoryPage } from "./routes/HistoryPage";
import { AuthPage } from "./routes/AuthPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<InputPage />} />
      <Route path="/buscando" element={<SearchingPage />} />
      <Route path="/resultados" element={<ResultsPage />} />
      <Route path="/historial" element={<HistoryPage />} />
      <Route path="/entrar" element={<AuthPage />} />
    </Routes>
  );
}
