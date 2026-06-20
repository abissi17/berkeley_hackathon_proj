export default function ProvidersTab({ providers }) {
  if (!providers || providers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-2">🏥</p>
        <p>No providers found. Try a different zip code or check the national directories below.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Local therapy providers</h2>
      <p className="text-sm text-gray-500">
        Providers near your zip code. Results are cached for 24 hours.
        Always call ahead to confirm availability and insurance acceptance.
      </p>

      <div className="grid gap-3 mt-4 sm:grid-cols-2">
        {providers.map((provider, i) => (
          <div key={i} className="card flex flex-col">
            <h3 className="font-semibold text-gray-900">{provider.name}</h3>
            <span className="inline-block mt-1 text-xs font-medium text-compass-600 bg-compass-50 rounded-full px-2 py-0.5 w-fit">
              {provider.type}
            </span>

            {provider.address && (
              <p className="mt-2 text-xs text-gray-500 flex items-start gap-1">
                <span className="flex-shrink-0">📍</span>
                {provider.address}
              </p>
            )}

            {provider.phone && (
              <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                <span>📞</span>
                <a
                  href={`tel:${provider.phone}`}
                  className="text-compass-600 hover:underline"
                >
                  {provider.phone}
                </a>
              </p>
            )}

            {provider.website && (
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-xs font-medium text-compass-600 hover:underline inline-flex items-center gap-1"
              >
                🌐 Visit website →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
