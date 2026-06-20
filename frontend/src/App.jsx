import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import IntakePage from "./pages/IntakePage";
import DashboardPage from "./pages/DashboardPage";
import ClinicPage from "./pages/ClinicPage";

export default function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/intake" element={<IntakePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/clinic" element={<ClinicPage />} />
      </Routes>
    </div>
  );
}
