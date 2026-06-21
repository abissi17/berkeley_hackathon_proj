import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getClinicChildren, getClinicChild } from "../api/compassApi";
import ChildRow from "../components/ChildRow";
import RoadmapTab from "../components/RoadmapTab";
import LettersTab from "../components/LettersTab";
import ProvidersTab from "../components/ProvidersTab";
import ChatTab from "../components/ChatTab";

export default function ClinicPage() {
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Selected child for detail view
  const [selectedId, setSelectedId] = useState(null);
  const [childProfile, setChildProfile] = useState(null);
  const [childLoading, setChildLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("roadmap");

  // Load children list
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getClinicChildren();
        setChildren(res.children || []);
      } catch (err) {
        setError(err.message || "Failed to load children.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load child detail when selected
  useEffect(() => {
    if (!selectedId) {
      setChildProfile(null);
      return;
    }
    (async () => {
      try {
        setChildLoading(true);
        const profile = await getClinicChild(selectedId);
        setChildProfile(profile);
      } catch (err) {
        setChildProfile(null);
      } finally {
        setChildLoading(false);
      }
    })();
  }, [selectedId]);

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
            <h1 className="text-xl font-bold text-gray-900">
              Compass Clinic
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/intake" className="btn-primary text-sm !py-2 !px-4">
              + Add new child
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
            >
              <span className="text-lg leading-none">←</span>
              Back
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Left: child list */}
        <aside className="w-80 border-r border-gray-200 bg-white flex-shrink-0">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Children ({children.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-4 text-center text-sm text-gray-400">
              Loading...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-sm text-red-500">{error}</div>
          ) : children.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">
              No children in the database yet.
              <Link to="/intake" className="block mt-2 text-compass-600 font-medium">
                + Add the first child
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {children.map((child) => (
                <ChildRow
                  key={child.id}
                  child={child}
                  isSelected={selectedId === child.id}
                  onClick={() => setSelectedId(child.id)}
                />
              ))}
            </ul>
          )}
        </aside>

        {/* Right: child detail or empty state */}
        <main className="flex-1 min-w-0">
          {!selectedId ? (
            <div className="flex items-center justify-center h-full text-center px-8">
              <div>
                <div className="text-5xl mb-4">📋</div>
                <h2 className="text-lg font-semibold text-gray-700">
                  Select a child
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Click a child from the left panel to view their full
                  roadmap, letters, providers, and chat.
                </p>
              </div>
            </div>
          ) : childLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-6 w-6 border-2 border-compass-600 border-t-transparent rounded-full" />
            </div>
          ) : childProfile ? (
            <div>
              {/* Child info bar + tabs */}
              <div className="border-b border-gray-200 bg-white px-6 py-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {childProfile.child_name}
                </h2>
                <p className="text-sm text-gray-500">
                  {childProfile.child_age_months} months
                  {childProfile.diagnosis_status !== "none" &&
                    ` · ${childProfile.diagnosis_status}`}
                  {childProfile.diagnosis_name &&
                    ` — ${childProfile.diagnosis_name}`}
                </p>

                <div className="flex gap-0 mt-3">
                  {[
                    { key: "roadmap", label: "🗺️ Roadmap" },
                    { key: "letters", label: "✉️ Letters" },
                    { key: "providers", label: "🏥 Providers" },
                    { key: "chat", label: "💬 Chat" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-4 py-2 text-sm transition ${
                        activeTab === tab.key ? "tab-active" : "tab-inactive"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              <div className="px-6 py-6">
                {activeTab === "roadmap" && (
                  <RoadmapTab roadmap={childProfile.roadmap || []} />
                )}
                {activeTab === "letters" && (
                  <LettersTab letters={childProfile.letters || {}} />
                )}
                {activeTab === "providers" && (
                  <ProvidersTab providers={childProfile.providers || []} />
                )}
                {activeTab === "chat" && (
                  <ChatTab sessionId={`clinic-${childProfile.id}`} />
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-red-500">
                Failed to load child profile.
              </p>
            </div>
          )}
        </main>
      </div>

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
