import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, MapPin, PlusCircle, AlertCircle, Calendar } from 'lucide-react';

// Se hai un componente ScoreGroup separato, assicurati che sia importato correttamente, 
// o se era definito qui dentro, mantienilo. Assumo che ScoreGroup sia nello stesso file o in components.
import ScoreGroup from '../components/ScoreGroup'; 

export default function AddReview() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  
  const [username, setUsername] = useState('');
  // NUOVO: Stato per la data, impostato di base su oggi (formato YYYY-MM-DD)
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [scores, setScores] = useState({
    location: 0,
    offer: 0,
    bill: 0,
    menu: 0
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchRestaurants = async () => {
      const { data } = await supabase.from('restaurants').select('*');
      if (data) setRestaurants(data);
    };
    fetchRestaurants();
  }, []);

  const filteredRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const finalScore = (
    (scores.location + scores.offer + scores.bill + scores.menu) / 4
  ).toFixed(1);

  const handleSave = async () => {
    if (!username.trim()) {
      setError('Inserisci il tuo username!');
      return;
    }
    if (!selectedRestaurant) {
      setError('Seleziona un locale!');
      return;
    }
    if (Object.values(scores).some(s => s === 0)) {
      setError('Dai un voto a tutte le categorie!');
      return;
    }

    setSaving(true);
    setError('');

    // Inseriamo la recensione forzando la data selezionata (created_at)
    const { error: reviewError } = await supabase.from('reviews').insert([{
      restaurant_id: selectedRestaurant,
      username: username.toUpperCase(),
      score_location: scores.location,
      score_offer: scores.offer,
      score_bill: scores.bill,
      score_menu: scores.menu,
      average_score: Number(finalScore),
      created_at: new Date(reviewDate).toISOString() // NUOVO: Passiamo la data custom
    }]);

    if (reviewError) {
      setError('Errore di connessione col database.');
      setSaving(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 mb-20 animate-fade-in">
      <h2 className="text-3xl font-extrabold text-slate-800 flex items-center gap-2 mb-8">
        ✍️ Nuova Recensione
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2 font-bold animate-shake">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* Dati Utente e Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Username */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Il tuo Username</label>
          <input 
            type="text" 
            placeholder="Es. MARCO"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-3 px-4 rounded-lg font-bold uppercase focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Selezione Data */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-2">
            <Calendar size={16} className="text-orange-500"/> Data Visita
          </label>
          <input 
            type="date" 
            value={reviewDate}
            onChange={(e) => setReviewDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-3 px-4 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Selezione Ristorante */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-2">
          <MapPin size={16} className="text-orange-500"/> Cerca il Locale
        </label>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Es. Istanbul Kebap Cinisello..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-colors"
          />
        </div>
        
        <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {filteredRestaurants.map(r => (
            <div 
              key={r.id} 
              onClick={() => setSelectedRestaurant(r.id)}
              className={`p-3 rounded-lg cursor-pointer border-2 transition-all ${selectedRestaurant === r.id ? 'border-orange-500 bg-orange-50' : 'border-transparent hover:bg-slate-50'}`}
            >
              <div className="font-bold text-slate-800">{r.name}</div>
              <div className="text-xs text-slate-500">{r.city}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Voti */}
      <div className="space-y-4">
        <ScoreGroup label="Location" value={scores.location} onChange={(v) => setScores({...scores, location: v})} />
        <ScoreGroup label="Offerta" value={scores.offer} onChange={(v) => setScores({...scores, offer: v})} />
        <ScoreGroup label="Conto" value={scores.bill} onChange={(v) => setScores({...scores, bill: v})} />
        <ScoreGroup label="Menù" value={scores.menu} onChange={(v) => setScores({...scores, menu: v})} />
      </div>

      {/* Footer Fissato con Punteggio */}
      <div className="bg-slate-100 p-6 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-20 md:bottom-4 z-40">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Punteggio Finale</span>
          <div className="text-4xl font-black text-slate-800 flex items-baseline gap-2">
            🌯 {finalScore} <span className="text-lg text-slate-400 font-bold">/ 10</span>
          </div>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-lg font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors w-full sm:w-auto"
          >
            Annulla
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className={`px-8 py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 w-full sm:w-auto transition-all ${saving ? 'bg-slate-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 shadow-md hover:shadow-lg'}`}
          >
            {saving ? 'Salvataggio...' : <><PlusCircle size={20} /> Salva Recensione</>}
          </button>
        </div>
      </div>
    </div>
  );
}