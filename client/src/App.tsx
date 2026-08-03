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
      const response = await fetch('/api/generate', {
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
    <div className="app">
      <main>
        <h1>BotBuilder Pro</h1>
        <p>Build a Telegram bot like LEGO. Choose features, download the asset.</p>
        
        <div className="configurator">
          <select value={dbType} onChange={(e) => setDbType(e.target.value)}>
            <option value="sqlite">SQLite</option>
            <option value="postgresql">PostgreSQL</option>
          </select>

          <div className="modules">
            {['Admin Panel', 'Mass Mailing', 'User CRM'].map(mod => (
              <label key={mod}>
                <input type="checkbox" onChange={() => toggleModule(mod)} checked={modules.includes(mod)} />
                {mod}
              </label>
            ))}
          </div>

          <button onClick={() => setShowModal(true)}>Generate & Download</button>
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Get your code</h2>
            
            <div className="form-group">
              <label>Email Address (Required)</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="you@example.com"
              />
            </div>

            <div className="form-group">
              <label>Which Pro feature would you instantly pay $15-20 for?</label>
              <div className="radio-list">
                {['Ready-made Admin Panel with CRM', 'Stripe / CryptoPay Integrations', 'AI Assistant Module (OpenAI API)', 'Other...'].map(opt => (
                  <label key={opt}>
                    <input type="radio" name="proFeature" value={opt} onChange={e => setProFeatureVote(e.target.value)} /> {opt}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>How would you feel if this tool disappeared tomorrow?</label>
              <div className="radio-list">
                {['Very disappointed', 'Somewhat disappointed', 'Not disappointed'].map(opt => (
                  <label key={opt}>
                    <input type="radio" name="seanEllis" value={opt} onChange={e => setSeanEllisVote(e.target.value)} /> {opt}
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-buttons">
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button disabled={!isFormValid} onClick={handleDownload}>Download ZIP</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;