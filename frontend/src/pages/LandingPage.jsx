import { useNavigate } from 'react-router-dom'
import Disclaimer from '../components/Disclaimer'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Nav */}
      <nav className="px-8 py-5 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧭</span>
          <span className="text-xl font-bold text-compass-700 tracking-tight">Compass</span>
        </div>
        <span className="text-sm text-gray-400">AI-powered care navigation</span>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-compass-50 text-compass-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-compass-200">
          <span className="w-2 h-2 rounded-full bg-compass-500 animate-pulse"></span>
          Built for families navigating developmental care
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight max-w-3xl mb-6">
          From lost and overwhelmed to a <span className="text-compass-600">clear path forward</span>
        </h1>

        <p className="text-xl text-gray-500 max-w-2xl mb-4">
          When your child needs developmental support, the system is confusing, slow, and exhausting. Compass gives you a personalized roadmap, ready-to-send letters, local providers, and an AI guide — in under 5 minutes.
        </p>

        <p className="text-sm text-gray-400 mb-12">No account required. Free to use.</p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <button
            onClick={() => navigate('/intake')}
            className="flex-1 bg-compass-600 hover:bg-compass-700 active:bg-compass-800 text-white font-semibold py-4 px-8 rounded-2xl text-lg shadow-lg shadow-compass-200 transition-all duration-150 flex flex-col items-center gap-1"
          >
            <span>I'm a Parent</span>
            <span className="text-xs font-normal text-compass-200">Get my child's roadmap →</span>
          </button>
          <button
            onClick={() => navigate('/clinic')}
            className="flex-1 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-semibold py-4 px-8 rounded-2xl text-lg border-2 border-gray-200 transition-all duration-150 flex flex-col items-center gap-1"
          >
            <span>I'm a Clinic</span>
            <span className="text-xs font-normal text-gray-400">Case management dashboard →</span>
          </button>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl w-full">
          {[
            { icon: '🗺️', label: 'Personalized Roadmap', desc: 'Prioritized next steps for your child' },
            { icon: '✉️', label: 'Ready-to-Send Letters', desc: 'To schools, insurance, and regional centers' },
            { icon: '📍', label: 'Local Providers', desc: 'Therapy centers near your zip code' },
            { icon: '💬', label: 'AI Care Guide', desc: 'Context-aware answers to your questions' },
          ].map((f) => (
            <div key={f.label} className="bg-gray-50 rounded-2xl p-5 text-left border border-gray-100">
              <div className="text-3xl mb-3">{f.icon}</div>
              <div className="font-semibold text-gray-800 text-sm mb-1">{f.label}</div>
              <div className="text-xs text-gray-400">{f.desc}</div>
            </div>
          ))}
        </div>
      </main>

      <Disclaimer />
    </div>
  )
}
