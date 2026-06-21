import { useState } from "react";

const LETTER_META = {
  school: {
    title: "School District Evaluation Request",
    icon: "🏫",
    description:
      "A formal letter requesting a comprehensive evaluation under IDEA. Send this to your school district's Special Education office.",
  },
  insurance: {
    title: "Insurance Coverage Request",
    icon: "📋",
    description:
      "A letter requesting coverage for developmental and therapeutic services under the EPSDT benefit.",
  },
  regional_center: {
    title: "Regional Center Intake Request",
    icon: "🤝",
    description:
      "A letter requesting early intervention evaluation through California's Early Start program (IDEA Part C).",
  },
};

export default function LettersTab({ letters, onGenerate, loading }) {
  const [copiedKey, setCopiedKey] = useState(null);

  if (!letters || Object.keys(letters).length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">✉️</p>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Ready-to-send letters</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
          Generate three personalized draft letters — to your school district, insurance company,
          and regional center — pre-filled with the right legal language.
        </p>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Generating…
            </>
          ) : (
            "Generate Letters"
          )}
        </button>
      </div>
    );
  }

  async function handleCopy(key, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Ready-to-send letters</h2>
      <p className="text-sm text-gray-500">
        These drafts include the legal language you need. Fill in the{" "}
        <code className="bg-gray-100 px-1 rounded text-xs">[PLACEHOLDERS]</code>{" "}
        with your personal details before sending.
      </p>

      <div className="grid gap-4 mt-4">
        {Object.entries(LETTER_META).map(([key, meta]) => {
          const text = letters[key];
          if (!text) return null;

          return (
            <div key={key} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{meta.icon}</span>
                  <h3 className="font-semibold text-gray-900">{meta.title}</h3>
                </div>
                <button
                  onClick={() => handleCopy(key, text)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-md transition ${
                    copiedKey === key
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {copiedKey === key ? "✓ Copied!" : "📋 Copy"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">{meta.description}</p>
              <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-700 whitespace-pre-wrap font-sans max-h-64 overflow-y-auto">
                {text}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}
