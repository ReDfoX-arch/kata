import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart2, Hash, Map, Award, AlertTriangle, Trophy } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';

export default function Stats() {
  const [stats, setStats] = useState({
    totalReviews: 0,
    totalRestaurants: 0,
    totalUsers: 0,
    globalAvg: '0.0',
    bestKebab: null as any,
    worstKebab: null as any,
    topUsers: [] as any[],
    uniqueCities: 0,
    uniqueCountries: 0,
    uniqueContinents: 0,
    allRestaurants: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('avgScore'); // 'avgScore' o 'reviewCount'

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const { data: rests } = await supabase.from('restaurants').select('*');
      const { data: revs } = await supabase.from('reviews').select('*');
      const { data: users } = await supabase.from('users').select('*');

      if (rests && revs && revs.length > 0) {
        // Calcolo punteggi per ristorante
        const calculatedRests = rests.map(r => {
          const rRevs = revs.filter(rev => rev.restaurant_id === r.id);
          const avg = rRevs.length > 0 ? rRevs.reduce((acc, curr) => acc + Number(curr.average_score), 0) / rRevs.length : 0;
          return { ...r, avgScore: avg, reviewCount: rRevs.length };
        }).filter(r => r.avgScore > 0);

        calculatedRests.sort((a, b) => b.avgScore - a.avgScore);
        
        // Media globale del sito
        const globalSum = revs.reduce((acc, curr) => acc + Number(curr.average_score), 0);
        
        // Calcolo Top 3 utenti per numero di recensioni
        const userStats = (users || []).map(u => ({
          ...u,
          reviewCount: revs.filter(r => r.user_id === u.secret_id).length
        })).filter(u => u.reviewCount > 0).sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 3);

        // Calcolo statistiche geografiche
        const uniqueCities = new Set(rests.map((r: any) => r.city)).size;
        const uniqueCountries = new Set(rests.map((r: any) => r.country)).size;
        
        // Mapping paesi a continenti (ampliato e corretto)
        const countryToContinent: Record<string, string> = {
          'Italia': 'Europa', 'Francia': 'Europa', 'Spagna': 'Europa', 'Germania': 'Europa', 'Portogallo': 'Europa',
          'Grecia': 'Europa', 'Polonia': 'Europa', 'Svizzera': 'Europa', 'Svezia': 'Europa', 'Norvegia': 'Europa',
          'Danimarca': 'Europa', 'Finlandia': 'Europa', 'Irlanda': 'Europa', 'Regno Unito': 'Europa', 'Paesi Bassi': 'Europa',
          'Belgio': 'Europa', 'Austria': 'Europa', 'Repubblica Ceca': 'Europa', 'Ungheria': 'Europa', 'Romania': 'Europa',
          'Bulgaria': 'Europa', 'Croazia': 'Europa', 'Serbia': 'Europa', 'Bosnia': 'Europa', 'Lituania': 'Europa',
          'Estonia': 'Europa', 'Lettonia': 'Europa', 'Slovenia': 'Europa', 'Slovacchia': 'Europa',
          'Giappone': 'Asia', 'Cina': 'Asia', 'India': 'Asia', 'Corea del Sud': 'Asia', 'Corea del Nord': 'Asia', 
          'Tailandia': 'Asia', 'Vietnam': 'Asia', 'Indonesia': 'Asia', 'Pakistan': 'Asia', 'Malesia': 'Asia', 
          'Singapore': 'Asia', 'Taiwan': 'Asia', 'Hong Kong': 'Asia', 'Filippine': 'Asia', 'Bangladesh': 'Asia', 
          'Laos': 'Asia', 'Myanmar': 'Asia', 'Cambogia': 'Asia', 'Nepal': 'Asia', 'Sri Lanka': 'Asia',
          'USA': 'Nord America', 'Canada': 'Nord America', 'Messico': 'Nord America',
          'Brasile': 'Sud America', 'Argentina': 'Sud America', 'Cile': 'Sud America', 'Peru': 'Sud America',
          'Colombia': 'Sud America', 'Venezuela': 'Sud America', 'Ecuador': 'Sud America', 'Bolivia': 'Sud America',
          'Australia': 'Oceania', 'Nuova Zelanda': 'Oceania',
          'Egitto': 'Africa', 'Sudafrica': 'Africa', 'Nigeria': 'Africa', 'Kenya': 'Africa', 'Marocco': 'Africa',
          'Tunisia': 'Africa', 'Etiopia': 'Africa', 'Tanzania': 'Africa'
        };

        const uniqueContinents = new Set(
          rests
            .map((r: any) => countryToContinent[r.country] || 'Sconosciuto')
            .filter((c: string) => c !== 'Sconosciuto')
        ).size;

        setStats({
          totalReviews: revs.length,
          totalRestaurants: calculatedRests.length,
          totalUsers: users ? users.length : 0,
          globalAvg: (globalSum / revs.length).toFixed(1),
          bestKebab: calculatedRests[0],
          worstKebab: calculatedRests[calculatedRests.length - 1],
          topUsers: userStats,
          uniqueCities,
          uniqueCountries,
          uniqueContinents,
          allRestaurants: calculatedRests
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <Trophy className="text-slate-400 mb-2" />
          <p className="text-3xl font-black text-slate-800">{stats.totalUsers}</p>
          <p className="text-xs font-bold text-slate-500 uppercase">Utenti Registrati</p>
        </div>
        <div className="bg-orange-600 p-5 rounded-xl shadow-md flex flex-col items-center justify-center text-center text-white">
          <span className="text-2xl mb-1">🌯</span>
          <p className="text-4xl font-black">{stats.globalAvg}</p>
          <p className="text-xs font-bold text-orange-200 uppercase mt-1">Media Globale KATA</p>
        </div>
      </div>

      {/* Statistiche Geografiche */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center">
          <p className="text-2xl font-black text-blue-600">{stats.uniqueCities}</p>
          <p className="text-xs font-bold text-blue-700 uppercase mt-1 tracking-wider">Città Visitate</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl text-center">
          <p className="text-2xl font-black text-purple-600">{stats.uniqueCountries}</p>
          <p className="text-xs font-bold text-purple-700 uppercase mt-1 tracking-wider">Paesi Visitati</p>
        </div>
        <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-center">
          <p className="text-2xl font-black text-green-600">{stats.uniqueContinents}</p>
          <p className="text-xs font-bold text-green-700 uppercase mt-1 tracking-wider">Continenti</p>
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

      {/* Kebab Kings - Top 3 Utenti */}
      {stats.topUsers.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-extrabold text-slate-800 mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={28}/> Kebab Kings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.topUsers.map((user, index) => (
              <div key={user.secret_id} className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm relative overflow-hidden flex flex-col items-center text-center">
                {index === 0 && <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg">👑 1°</div>}
                {index === 1 && <div className="absolute top-0 right-0 bg-slate-400 text-slate-50 text-xs font-bold px-3 py-1 rounded-bl-lg">🥈 2°</div>}
                {index === 2 && <div className="absolute top-0 right-0 bg-orange-400 text-orange-50 text-xs font-bold px-3 py-1 rounded-bl-lg">🥉 3°</div>}
                
                <UserAvatar userId={user.secret_id} username={user.username} size="lg" className="mb-4" />
                <h4 className="font-bold text-lg text-slate-800 mb-1">{user.username}</h4>
                <p className="text-3xl font-black text-orange-600 mb-2">{user.reviewCount}</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recensioni</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabella Ristoranti con Sorting */}
      {stats.allRestaurants.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-extrabold text-slate-800">Tutti i Locali</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('avgScore')}
                className={`px-4 py-2 rounded-lg text-sm font-bold uppercase transition ${
                  sortBy === 'avgScore'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                Per Valutazione
              </button>
              <button
                onClick={() => setSortBy('reviewCount')}
                className={`px-4 py-2 rounded-lg text-sm font-bold uppercase transition ${
                  sortBy === 'reviewCount'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                Per Numero Recensioni
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {stats.allRestaurants
              .sort((a, b) => (sortBy === 'avgScore' ? b.avgScore - a.avgScore : b.reviewCount - a.reviewCount))
              .map((restaurant) => (
                <div key={restaurant.id} className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm flex items-center justify-between hover:shadow-md transition">
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{restaurant.name}</p>
                    <p className="text-sm text-slate-600">{restaurant.city}</p>
                  </div>
                  <div className="flex gap-6 items-center">
                    <div className="text-center">
                      <p className="text-2xl font-black text-slate-800">{restaurant.avgScore.toFixed(1)}</p>
                      <p className="text-xs font-bold text-slate-500">Valutazione</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-orange-600">{restaurant.reviewCount}</p>
                      <p className="text-xs font-bold text-slate-500">Recensioni</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}