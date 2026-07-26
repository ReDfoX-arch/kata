import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, MapPin, Wallet, Leaf, Award} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Rankings() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'generale' | 'risparmio' | 'falafel' | 'locali'>('generale');
  const [selectedCity, setSelectedCity] = useState<string>('Milano');
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: rests } = await supabase.from('restaurants').select('*');
      const { data: revs } = await supabase.from('reviews').select('*');

      if (rests && revs) {
        setRestaurants(rests);
        setReviews(revs);
        
        // Estrai città uniche per il filtro
        const cities = Array.from(new Set(rests.map(r => r.city?.trim()))).filter(Boolean) as string[];
        
        // Aggiungiamo le città preferite in cima se esistono, embed naturale
        const defaultCities = ['Milano', 'Cinisello Balsamo', 'Cusano Milanino'];
        const sortedCities = cities.sort((a, b) => {
           if (defaultCities.includes(a) && !defaultCities.includes(b)) return -1;
           if (!defaultCities.includes(a) && defaultCities.includes(b)) return 1;
           return a.localeCompare(b);
        });
        
        setAvailableCities(sortedCities);
        if (sortedCities.length > 0 && !sortedCities.includes(selectedCity)) {
          setSelectedCity(sortedCities[0]);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-10 font-bold text-slate-500 animate-pulse">Calcolo delle classifiche in corso...</div>;

  // CALCOLO CLASSIFICHE DINAMICHE
  const getRanking = () => {
    let ranked = restaurants.map(r => {
      const restRevs = reviews.filter(rev => rev.restaurant_id === r.id);
      
      let validRevs = restRevs;
      if (activeTab === 'falafel') {
        validRevs = restRevs.filter(rev => rev.is_vegetarian);
      }

      const count = validRevs.length;
      if (count === 0) return null;

      let score = 0;
      if (activeTab === 'risparmio') {
        score = validRevs.reduce((acc, curr) => acc + Number(curr.score_bill), 0) / count;
      } else {
        score = validRevs.reduce((acc, curr) => acc + Number(curr.average_score), 0) / count;
      }

      return { ...r, score, reviewCount: count };
    }).filter(Boolean) as any[];

    if (activeTab === 'locali') {
      ranked = ranked.filter(r => r.city?.trim() === selectedCity);
    }

    return ranked.sort((a, b) => b.score - a.score).slice(0, 10); // Top 10
  };

  const currentRanking = getRanking();

  return (
    <div className="max-w-4xl mx-auto space-y-6 mb-20 md:mb-8 animate-fade-in">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-xl shadow-md text-white flex flex-col items-center text-center">
        <Trophy size={48} className="text-yellow-400 mb-4" />
        <h1 className="text-3xl font-black uppercase tracking-widest">Le Categorie d'Oro</h1>
        <p className="text-slate-400 mt-2 font-medium">I migliori kebab per ogni specialità.</p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
        <button onClick={() => setActiveTab('generale')} className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all ${activeTab === 'generale' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
          <Award size={18}/> Classifica Generale
        </button>
        <button onClick={() => setActiveTab('risparmio')} className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all ${activeTab === 'risparmio' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
          <Wallet size={18}/> Il Re del Risparmio
        </button>
        <button onClick={() => setActiveTab('falafel')} className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all ${activeTab === 'falafel' ? 'bg-[#5c7a52] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
          <Leaf size={18}/> Miglior Falafel
        </button>
        <button onClick={() => setActiveTab('locali')} className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all ${activeTab === 'locali' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
          <MapPin size={18}/> Campioni Locali
        </button>
      </div>

      {activeTab === 'locali' && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 animate-fade-in">
          <label className="font-bold text-slate-700">Seleziona Città:</label>
          <select 
            value={selectedCity} 
            onChange={(e) => setSelectedCity(e.target.value)}
            className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      )}

      {/* Lista Classifica */}
      <div className="space-y-4 mt-6">
        {currentRanking.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-slate-200 text-slate-500 font-bold">
            Nessun locale qualificato per questa categoria.
          </div>
        ) : (
          currentRanking.map((rest, index) => {
            let positionColor = 'text-slate-400';
            let positionBg = 'bg-slate-100';
            if (index === 0) { positionColor = 'text-yellow-600'; positionBg = 'bg-yellow-100 border border-yellow-300'; }
            else if (index === 1) { positionColor = 'text-slate-500'; positionBg = 'bg-slate-200 border border-slate-300'; }
            else if (index === 2) { positionColor = 'text-orange-700'; positionBg = 'bg-orange-100 border border-orange-300'; }

            return (
              <Link key={rest.id} to={`/restaurant/${rest.id}`} className="block bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-black text-xl ${positionBg} ${positionColor}`}>
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-slate-800 group-hover:text-orange-600 transition-colors truncate">{rest.name}</h2>
                    <p className="text-sm text-slate-500 flex items-center gap-1 truncate"><MapPin size={14}/> {rest.city}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-black text-slate-800">
                      {activeTab === 'falafel' ? '🧆' : '🌯'} {rest.score.toFixed(1)}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {rest.reviewCount} Recension{rest.reviewCount !== 1 ? 'i' : 'e'}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
