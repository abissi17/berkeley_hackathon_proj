const PRIORITY_BADGE = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
};

const CATEGORY_ICON = {
  medical: "🏥",
  school: "🏫",
  therapy: "🎯",
  insurance: "📋",
  support: "🤝",
};

export default function RoadmapTab({ roadmap }) {
  if (!roadmap || roadmap.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-2">🗺️</p>
        <p>No roadmap steps yet. Complete the intake form to generate one.</p>
      </div>
    );
  }

  // Sort: high priority first
  const sorted = [...roadmap].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Your personalized action roadmap</h2>
      <p className="text-sm text-gray-500">
        These steps are customized for your child's profile. Work through them
        in priority order — but every family moves at their own pace.
      </p>

      <div className="space-y-3 mt-4">
        {sorted.map((step, i) => (
          <div key={i} className="card flex gap-4 items-start">
            {/* Icon */}
            <div className="text-2xl flex-shrink-0 pt-1">
              {CATEGORY_ICON[step.category] || "📌"}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-base font-semibold text-gray-900">
                  {step.title}
                </h3>
                <span
                  className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                    PRIORITY_BADGE[step.priority] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {step.priority}
                </span>
                <span className="text-xs text-gray-400">
                  · {step.timeline}
                </span>
              </div>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
