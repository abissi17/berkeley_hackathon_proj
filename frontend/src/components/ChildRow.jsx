const STATUS_BADGE = {
  none: "bg-gray-100 text-gray-500",
  suspected: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
};

const STATUS_LABEL = {
  none: "No diagnosis",
  suspected: "Suspected",
  confirmed: "Confirmed",
};

export default function ChildRow({ child, isSelected, onClick }) {
  const ageDisplay =
    child.child_age_months >= 12
      ? `${Math.floor(child.child_age_months / 12)}y ${child.child_age_months % 12}m`
      : `${child.child_age_months}m`;

  const createdDate = child.created_at
    ? new Date(child.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full text-left px-4 py-3 transition hover:bg-gray-50 ${
          isSelected ? "bg-compass-50 border-l-2 border-compass-600" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm text-gray-900 truncate">
            {child.child_name}
          </span>
          <span
            className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
              STATUS_BADGE[child.diagnosis_status] || STATUS_BADGE.none
            }`}
          >
            {STATUS_LABEL[child.diagnosis_status] || "Unknown"}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
          <span>{ageDisplay}</span>
          {createdDate && (
            <>
              <span>·</span>
              <span>{createdDate}</span>
            </>
          )}
        </div>
      </button>
    </li>
  );
}
