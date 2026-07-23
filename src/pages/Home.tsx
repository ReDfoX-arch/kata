import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Star, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [topRestaurants, setTopRestaurants] = useState<any[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const myProfile = JSON.parse(localStorage.getItem('kata_profile') || '{}');

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Scarichiamo tutti i ristoranti e tutte le recensioni
      const { data: rests } = await supabase.from('restaurants').select('*');
      const { data: revs } = await supabase.from('reviews').select('*, restaurants(name, city)').order('created_at', { ascending: false });

      if (!rests || !revs) return;

      // 2. Calcoliamo la media per ogni ristorante
      const stats = rests.map(r => {
        const rRevs = revs.filter(rev => rev.restaurant_id === r.id);
        const avg = rRevs.length > 0 
          ? rRevs.reduce((acc, curr) => acc + Number(curr.average_score), 0) / rRevs.length 
          : 0;
        return { ...r, avgScore: avg.toFixed(1), reviewCount: rRevs.length };
      }).filter(r => r.reviewCount > 0); // Mostriamo solo chi ha almeno un voto

      // Ordiniamo dal voto più alto al più basso
      stats.sort((a, b) => b.avgScore - a.avgScore);

      setTopRestaurants(stats.slice(0, 3)); // Prendiamo i primi 3
      setRecentReviews(revs.slice(0, 10)); // Prendiamo le ultime 10 recensioni

    } catch (error) {
      console.error("Errore nel caricamento:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Funzione per eliminare una recensione
  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Sei sicuro di voler eliminare questa recensione? L'azione è irreversibile.");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      
      alert("Recensione eliminata!");
      fetchData(); // Ricarichiamo i dati per aggiornare la classifica
    } catch (error) {
      console.error("Errore durante l'eliminazione:", error);
      alert("Impossibile eliminare la recensione.");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 font-bold text-slate-500 animate-pulse">Caricamento dati...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in mb-24 md:mb-8">
      {/* Sezione TOP 3 */}
      <section>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-4 flex items-center gap-2">
          <Trophy className="text-yellow-500" /> I Migliori 3 Kebab
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topRestaurants.length === 0 ? (
            <p className="text-slate-500">Nessuna recensione presente.</p>
          ) : (
            topRestaurants.map((rest, index) => (
              <div key={rest.id} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between">
                {index === 0 && <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg">1° POSTO</div>}
                <div>
                  <Link to={`/restaurant/${rest.id}`}>
                    <h3 className="font-bold text-lg text-slate-800 hover:text-orange-600 transition-colors">{rest.name}</h3>
                  </Link>
                  <p className="text-sm text-slate-500">{rest.city}, {rest.country}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{rest.reviewCount} Recensioni</span>
                  <div className="text-2xl font-black text-slate-800">
                    🌯 {rest.avgScore}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Sezione Ultime Recensioni & Eliminazione */}
      <section>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-4 flex items-center gap-2">
          <Star className="text-orange-500" /> Ultime Recensioni
        </h2>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
          {recentReviews.length === 0 ? (
            <p className="p-5 text-slate-500">Aggiungi la prima recensione!</p>
          ) : (
            recentReviews.map((rev) => (
              <div key={rev.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-800">{rev.restaurants.name} <span className="text-slate-400 font-normal text-sm">({rev.restaurants.city})</span></h4>
                  <p className="text-sm text-slate-500 mt-1">
                    Recensito da <span className="font-bold text-slate-700">{rev.username}</span>
                  </p>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  <div className="text-xl font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
                    🌯 {rev.average_score}
                  </div>

                  {rev.user_id === myProfile.userId && (
                    <button 
                    onClick={() => handleDelete(rev.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors flex items-center gap-1"
                      title="Elimina recensione"
                    >
                      <Trash2 size={18} />
                      <span className="text-sm font-bold sm:hidden">Elimina</span>
                    </button>
                  )}

                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}