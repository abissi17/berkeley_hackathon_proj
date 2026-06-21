import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { submitIntake } from "../api/compassApi";

const DIAGNOSIS_OPTIONS = [
  { value: "none", label: "None — just exploring" },
  { value: "suspected", label: "Suspected — we have concerns but no evaluation yet" },
  { value: "confirmed", label: "Confirmed — diagnosed by a professional" },
];

export default function IntakePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clinicMode = searchParams.get("mode") === "clinic";

  const [form, setForm] = useState({
    child_name: "",
    child_age_months: 36,
    zip_code: "",
    concerns: "",
    diagnosis_status: "none",
    diagnosis_name: "",
    insurance: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "child_age_months" ? Number(value) : value,
      // Clear diagnosis name when switching away from "confirmed"
      ...(name === "diagnosis_status" && value !== "confirmed"
        ? { diagnosis_name: "" }
        : {}),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await submitIntake({ ...form, save_to_db: clinicMode });
      if (clinicMode) {
        navigate("/clinic");
      } else {
        sessionStorage.setItem("compass_dashboard", JSON.stringify(result));
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          <span className="text-lg leading-none">←</span>
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-4xl">🧭</span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            {clinicMode ? "Add a child to your clinic" : "Tell us about your child"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {clinicMode
              ? "This child's roadmap and letters will be saved to your clinic database."
              : "This takes about 5 minutes. All information stays private in your browser session."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card space-y-5">
          {/* Child name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Child's name
            </label>
            <input
              type="text"
              name="child_name"
              value={form.child_name}
              onChange={handleChange}
              required
              placeholder="First name or nickname"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                         focus:border-compass-500 focus:ring-1 focus:ring-compass-500
                         outline-none transition"
            />
          </div>

          {/* Age slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Child's age:{" "}
              <span className="text-compass-600 font-semibold">
                {form.child_age_months < 12
                  ? `${form.child_age_months}m`
                  : form.child_age_months % 12 === 0
                  ? `${form.child_age_months / 12}y`
                  : `${Math.floor(form.child_age_months / 12)}y ${form.child_age_months % 12}m`}
              </span>
            </label>
            <input
              type="range"
              name="child_age_months"
              min="0"
              max="216"
              step="1"
              value={form.child_age_months}
              onChange={handleChange}
              className="w-full accent-compass-600"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>0m</span>
              <span>6m</span>
              <span>1y</span>
              <span>3y</span>
              <span>6y</span>
              <span>12y</span>
              <span>18y</span>
            </div>
          </div>

          {/* Zip code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zip code
            </label>
            <input
              type="text"
              name="zip_code"
              value={form.zip_code}
              onChange={handleChange}
              required
              placeholder="e.g. 94720"
              maxLength={10}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                         focus:border-compass-500 focus:ring-1 focus:ring-compass-500
                         outline-none transition"
            />
          </div>

          {/* Concerns */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What concerns you?
            </label>
            <textarea
              name="concerns"
              value={form.concerns}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Describe what you've noticed — speech delays, social challenges, behavioral concerns, learning difficulties..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                         focus:border-compass-500 focus:ring-1 focus:ring-compass-500
                         outline-none transition resize-y"
            />
          </div>

          {/* Diagnosis status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diagnosis status
            </label>
            <select
              name="diagnosis_status"
              value={form.diagnosis_status}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                         focus:border-compass-500 focus:ring-1 focus:ring-compass-500
                         outline-none transition bg-white"
            >
              {DIAGNOSIS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Diagnosis name — only when confirmed */}
          {form.diagnosis_status === "confirmed" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnosis name (optional)
              </label>
              <input
                type="text"
                name="diagnosis_name"
                value={form.diagnosis_name}
                onChange={handleChange}
                placeholder="e.g. Autism Spectrum Disorder, ADHD"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                           focus:border-compass-500 focus:ring-1 focus:ring-compass-500
                           outline-none transition"
              />
            </div>
          )}

          {/* Insurance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Insurance provider (optional)
            </label>
            <input
              type="text"
              name="insurance"
              value={form.insurance}
              onChange={handleChange}
              placeholder="e.g. Blue Shield, Kaiser, Medi-Cal"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                         focus:border-compass-500 focus:ring-1 focus:ring-compass-500
                         outline-none transition"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Building your roadmap...
              </span>
            ) : (
              "Generate my roadmap"
            )}
          </button>
        </form>

        {/* Disclaimer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          ⚠️ This tool does not provide medical diagnoses. Always consult a
          qualified healthcare provider.
        </p>
      </div>
    </div>
  );
}
