import { useState } from 'react';
import './App.css';

function App() {
  const [modules, setModules] = useState<string[]>([]);
  const [dbType, setDbType] = useState('sqlite');
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [proFeatureVote, setProFeatureVote] = useState('');
  const [seanEllisVote, setSeanEllisVote] = useState('');

  const isFormValid = email.includes('@') && proFeatureVote !== '' && seanEllisVote !== '';

  const toggleModule = (mod: string) => {
    setModules(prev => prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]);
  };

  const handleDownload = async () => {
    const payload = {
      email,
      db_type: dbType,
      modules,
      pro_feature_vote: proFeatureVote,
      sean_ellis_vote: seanEllisVote
    };

    try {
      // Тут заміни на своє посилання Render, якщо воно злетіло!
      const response = await fetch('https://ТВІЙ-СЕРВЕР-НА-RENDER.onrender.com/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bot_asset.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        setShowModal(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans p-8 flex flex-col items-center">
      <main className="max-w-3xl w-full mt-10 text-center">
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">BotBuilder Pro</h1>
        <p className="text-gray-400 mb-12 text-lg">Build a Telegram bot like LEGO. Choose features, download the asset.</p>
        
        <div className="bg-[#111] border border-gray-800 p-8 rounded-2xl shadow-xl text-left">
          <div className="mb-6">
            <label className="block text-gray-400 mb-2 font-medium">Database</label>
            <select 
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              value={dbType} 
              onChange={(e) => setDbType(e.target.value)}
            >
              <option value="sqlite">SQLite</option>
              <option value="postgresql">PostgreSQL</option>
            </select>
          </div>

          <div className="mb-8">
            <label className="block text-gray-400 mb-3 font-medium">Modules</label>
            <div className="flex flex-col gap-3">
              {['Admin Panel', 'Mass Mailing', 'User CRM'].map(mod => (
                <label key={mod} className="flex items-center gap-3 p-4 border border-gray-700 rounded-lg cursor-pointer hover:bg-[#1a1a1a] transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-blue-500 rounded bg-gray-800 border-gray-700"
                    onChange={() => toggleModule(mod)} 
                    checked={modules.includes(mod)} 
                  />
                  <span className="font-medium">{mod}</span>
                </label>
              ))}
            </div>
          </div>

          <button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
            onClick={() => setShowModal(true)}
          >
            Generate & Download
          </button>
        </div>
      </main>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-[#111] border border-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
            <h2 className="text-2xl font-bold mb-6 text-white">Get your code</h2>
            
            <div className="mb-5 text-left">
              <label className="block mb-2 font-medium text-gray-300 text-sm">Email Address (Required)</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="you@example.com"
                className="w-full p-3 rounded-lg border border-gray-700 bg-[#1a1a1a] text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="mb-5 text-left">
              <label className="block mb-3 font-medium text-gray-300 text-sm">Which Pro feature would you instantly pay $15-20 for?</label>
              <div className="flex flex-col gap-2">
                {['Ready-made Admin Panel with CRM', 'Stripe / CryptoPay Integrations', 'AI Assistant Module (OpenAI API)', 'Other...'].map(opt => (
                  <label key={opt} className="flex items-center gap-3 bg-[#1a1a1a] p-3 rounded-lg border border-gray-700 cursor-pointer hover:bg-[#222] transition-colors text-sm">
                    <input type="radio" name="proFeature" value={opt} onChange={e => setProFeatureVote(e.target.value)} className="accent-blue-500" /> 
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6 text-left">
              <label className="block mb-3 font-medium text-gray-300 text-sm">How would you feel if this tool disappeared tomorrow?</label>
              <div className="flex flex-col gap-2">
                {['Very disappointed', 'Somewhat disappointed', 'Not disappointed'].map(opt => (
                  <label key={opt} className="flex items-center gap-3 bg-[#1a1a1a] p-3 rounded-lg border border-gray-700 cursor-pointer hover:bg-[#222] transition-colors text-sm">
                    <input type="radio" name="seanEllis" value={opt} onChange={e => setSeanEllisVote(e.target.value)} className="accent-blue-500" /> 
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button 
                className="px-5 py-2.5 rounded-lg text-gray-400 hover:text-white transition-colors font-medium"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                disabled={!isFormValid} 
                className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/20"
                onClick={handleDownload}
              >
                Download ZIP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;