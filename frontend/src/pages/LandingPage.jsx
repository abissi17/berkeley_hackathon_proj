import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16 text-center">
      {/* Logo / title */}
      <div className="mb-6 text-6xl">🧭</div>
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        Compass
      </h1>
      <p className="mt-4 max-w-xl text-lg text-gray-600">
        AI-powered care navigation for families of children with
        developmental concerns. Get a personalized action plan in 5
        minutes — not 6 months.
      </p>

      {/* CTA cards */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2 max-w-lg w-full">
        <Link
          to="/intake"
          className="card text-left hover:shadow-md transition-shadow group"
        >
          <div className="text-3xl mb-2">👨‍👩‍👧</div>
          <h2 className="text-xl font-semibold text-gray-900 group-hover:text-compass-600">
            I'm a parent
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Fill out a quick intake form about your child and get a
            personalized roadmap, ready-to-send letters, local providers,
            and an AI assistant.
          </p>
          <span className="inline-block mt-4 text-sm font-medium text-compass-600">
            Get started →
          </span>
        </Link>

        <Link
          to="/clinic"
          className="card text-left hover:shadow-md transition-shadow group"
        >
          <div className="text-3xl mb-2">🏥</div>
          <h2 className="text-xl font-semibold text-gray-900 group-hover:text-compass-600">
            I'm a clinic
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Manage all your patients in one place. View roadmaps,
            letters, and provider recommendations for every child in
            your care.
          </p>
          <span className="inline-block mt-4 text-sm font-medium text-compass-600">
            Open dashboard →
          </span>
        </Link>
      </div>

      {/* Disclaimer */}
      <p className="mt-12 max-w-md text-xs text-gray-400">
        ⚠️ This tool does not provide medical diagnoses. Always consult a
        qualified healthcare provider about your child's development.
      </p>

      {/* Footer */}
      <p className="mt-6 text-xs text-gray-300">
        Built for the UC Berkeley AI Hackathon · June 2026
      </p>
    </div>
  );
}
