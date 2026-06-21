import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RoadmapTab from "../components/RoadmapTab";
import LettersTab from "../components/LettersTab";
import ProvidersTab from "../components/ProvidersTab";
import ChatTab from "../components/ChatTab";

const TABS = [
  { key: "roadmap", label: "🗺️ Roadmap" },
  { key: "letters", label: "✉️ Letters" },
  { key: "providers", label: "🏥 Providers" },
  { key: "chat", label: "💬 Chat" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("roadmap");

  useEffect(() => {
    const stored = sessionStorage.getItem("compass_dashboard");
    if (!stored) {
      navigate("/intake");
      return;
    }
    try {
      setData(JSON.parse(stored));
    } catch {
      navigate("/intake");
    }
  }, [navigate]);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-compass-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { session_id, roadmap, letters, providers } = data;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <span className="text-2xl">🧭</span>
            <h1 className="text-xl font-bold text-gray-900">Compass</h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            <span className="text-lg leading-none">←</span>
            Back
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm transition ${
                activeTab === tab.key ? "tab-active" : "tab-inactive"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        {activeTab === "roadmap" && <RoadmapTab roadmap={roadmap} />}
        {activeTab === "letters" && <LettersTab letters={letters} />}
        {activeTab === "providers" && <ProvidersTab providers={providers} />}
        {activeTab === "chat" && <ChatTab sessionId={session_id} />}
      </main>

      {/* Disclaimer footer */}
      <footer className="border-t border-gray-200 bg-white py-3">
        <p className="text-center text-xs text-gray-400">
          ⚠️ This tool does not provide medical diagnoses. Always consult a
          qualified healthcare provider.
        </p>
      </footer>
    </div>
  );
}
