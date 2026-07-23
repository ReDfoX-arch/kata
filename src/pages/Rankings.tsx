import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy } from 'lucide-react';
import ClickableRestaurant from '../components/ClickableRestaurant';

export default function Rankings() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMethod, setSortMethod] = useState<'best' | 'worst' | 'alpha'>('best');

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      const { data: rests } = await supabase.from('restaurants').select('*');
      const { data: revs } = await supabase.from('reviews').select('*');

      if (rests && revs) {
        const stats = rests.map(r => {
          const rRevs = revs.filter(rev => rev.restaurant_id === r.id);
          const avg = rRevs.length > 0 ? rRevs.reduce((acc, curr) => acc + Number(curr.average_score), 0) / rRevs.length : 0;
          return { ...r, avgScore: Number(avg.toFixed(1)), reviewCount: rRevs.length };
        }).filter(r => r.reviewCount > 0);
        
        setRestaurants(stats);
      }
      setLoading(false);
    };
    fetchRankings();
  }, []);

  // Ordina i risultati in base al metodo selezionato
  const sortedRestaurants = [...restaurants].sort((a, b) => {
    if (sortMethod === 'best') return b.avgScore - a.avgScore;
    if (sortMethod === 'worst') return a.avgScore - b.avgScore;
    return a.name.localeCompare(b.name); // 'alpha'
  });

  return (
    <div className="space-y-6 mb-20 md:mb-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-extrabold text-slate-800 flex items-center gap-2">
          <Trophy className="text-orange-500" size={32}/> Classifica Completa
        </h2>
        
        <select 
          value={sortMethod} 
          onChange={(e) => setSortMethod(e.target.value as any)}
          className="bg-white border border-slate-300 text-slate-700 py-2 px-4 rounded-lg font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="best">Più Votati (Voto Alto)</option>
          <option value="worst">Meno Votati (Voto Basso)</option>
          <option value="alpha">Ordine Alfabetico (A-Z)</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center font-bold text-slate-400 py-10 animate-pulse">Calcolo classifica in corso...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {sortedRestaurants.map((rest, index) => (
            <div key={rest.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="font-black text-2xl text-slate-300 w-8 text-center">
                  {sortMethod === 'best' ? index + 1 : '-'}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">
                    <ClickableRestaurant restaurantId={rest.id} restaurantName={rest.name} className="text-lg" />
                  </h3>
                  <p className="text-sm text-slate-500">{rest.city}, {rest.country}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-slate-800">
                  🌯 {rest.avgScore.toFixed(1)}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase">{rest.reviewCount} voti</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}