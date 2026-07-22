import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart2, Hash, Map, Award, AlertTriangle } from 'lucide-react';

export default function Stats() {
  const [stats, setStats] = useState({
    totalReviews: 0,
    totalRestaurants: 0,
    globalAvg: '0.0',
    bestKebab: null as any,
    worstKebab: null as any
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const { data: rests } = await supabase.from('restaurants').select('*');
      const { data: revs } = await supabase.from('reviews').select('*');

      if (rests && revs && revs.length > 0) {
        // Calcolo punteggi per ristorante
        const calculatedRests = rests.map(r => {
          const rRevs = revs.filter(rev => rev.restaurant_id === r.id);
          const avg = rRevs.length > 0 ? rRevs.reduce((acc, curr) => acc + Number(curr.average_score), 0) / rRevs.length : 0;
          return { ...r, avgScore: avg };
        }).filter(r => r.avgScore > 0); // Solo chi ha voti

        calculatedRests.sort((a, b) => b.avgScore - a.avgScore);
        
        // Media globale del sito
        const globalSum = revs.reduce((acc, curr) => acc + Number(curr.average_score), 0);
        
        setStats({
          totalReviews: revs.length,
          totalRestaurants: calculatedRests.length,
          globalAvg: (globalSum / revs.length).toFixed(1),
          bestKebab: calculatedRests[0],
          worstKebab: calculatedRests[calculatedRests.length - 1]
        });
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-center font-bold text-slate-400 py-10 animate-pulse">Analisi dati in corso...</div>;

  return (
    <div className="space-y-8 mb-20 md:mb-8 animate-fade-in">
      <h2 className="text-3xl font-extrabold text-slate-800 flex items-center gap-2 mb-6">
        <BarChart2 className="text-blue-500" size={32} /> Statistiche
      </h2>

      {/* Numeri Globali */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <Hash className="text-slate-400 mb-2" />
          <p className="text-3xl font-black text-slate-800">{stats.totalReviews}</p>
          <p className="text-xs font-bold text-slate-500 uppercase">Recensioni Totali</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <Map className="text-slate-400 mb-2" />
          <p className="text-3xl font-black text-slate-800">{stats.totalRestaurants}</p>
          <p className="text-xs font-bold text-slate-500 uppercase">Locali Esplorati</p>
        </div>
        <div className="bg-orange-600 p-5 rounded-xl shadow-md flex flex-col items-center justify-center text-center text-white col-span-2 md:col-span-1">
          <span className="text-2xl mb-1">🌯</span>
          <p className="text-4xl font-black">{stats.globalAvg}</p>
          <p className="text-xs font-bold text-orange-200 uppercase mt-1">Media Globale KATA</p>
        </div>
      </div>

      {/* Migliore e Peggiore */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.bestKebab && (
          <div className="bg-green-50 border border-green-200 p-6 rounded-xl flex flex-col justify-center">
            <h3 className="text-green-800 font-extrabold flex items-center gap-2 mb-2 uppercase text-sm tracking-wider">
              <Award size={18}/> Kebab d'Oro
            </h3>
            <p className="text-2xl font-black text-slate-800">{stats.bestKebab.name}</p>
            <p className="text-slate-600">{stats.bestKebab.city}</p>
            <p className="text-3xl font-black text-green-700 mt-4">🌯 {stats.bestKebab.avgScore.toFixed(1)}</p>
          </div>
        )}
        
        {stats.worstKebab && stats.bestKebab !== stats.worstKebab && (
          <div className="bg-red-50 border border-red-200 p-6 rounded-xl flex flex-col justify-center">
            <h3 className="text-red-800 font-extrabold flex items-center gap-2 mb-2 uppercase text-sm tracking-wider">
              <AlertTriangle size={18}/> Kebab Marcio
            </h3>
            <p className="text-2xl font-black text-slate-800">{stats.worstKebab.name}</p>
            <p className="text-slate-600">{stats.worstKebab.city}</p>
            <p className="text-3xl font-black text-red-700 mt-4">🌯 {stats.worstKebab.avgScore.toFixed(1)}</p>
          </div>
        )}
      </div>
    </div>
  );
}