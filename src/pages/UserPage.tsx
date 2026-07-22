import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, User as UserIcon } from 'lucide-react';

export default function UserPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      // Scarica tutte le recensioni dell'utente, includendo i dati del ristorante associato
      const { data } = await supabase
        .from('reviews')
        .select('*, restaurants(id, name, city)')
        .eq('username', username)
        .order('created_at', { ascending: false });

      if (data) setReviews(data);
      setLoading(false);
    };
    fetchUserData();
  }, [username]);

  if (loading) return <div className="py-10 text-center font-bold text-slate-500 animate-pulse">Caricamento profilo...</div>;

  const avgGiven = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + Number(curr.average_score), 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="max-w-3xl mx-auto space-y-6 mb-20 md:mb-8 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm">
        <ArrowLeft size={16} /> Torna indietro
      </button>

      {/* Intestazione Utente */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-xl shadow-md text-white flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
            <UserIcon size={40} className="text-white" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1">Profilo Critico</h1>
            <h2 className="text-3xl font-black">{username}</h2>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white/10 border border-white/20 p-4 rounded-xl text-center min-w-[100px] backdrop-blur-sm">
            <p className="text-xs font-bold text-slate-300 uppercase mb-1">Voti Dati</p>
            <p className="text-2xl font-black">{reviews.length}</p>
          </div>
          <div className="bg-white/10 border border-white/20 p-4 rounded-xl text-center min-w-[100px] backdrop-blur-sm">
            <p className="text-xs font-bold text-slate-300 uppercase mb-1">Media Data</p>
            <p className="text-2xl font-black">🌯 {avgGiven}</p>
          </div>
        </div>
      </div>

      {/* Lista Recensioni dell'Utente */}
      <h2 className="text-xl font-extrabold text-slate-800 mt-8 mb-4">Storico Recensioni</h2>
      {reviews.length === 0 ? (
        <p className="text-slate-500">Questo utente non ha ancora recensito nulla.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <Link 
              to={`/restaurant/${rev.restaurants.id}`} 
              key={rev.id} 
              className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all group block"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">{rev.restaurants.name}</h3>
                  <p className="text-xs text-slate-500">{rev.restaurants.city}</p>
                </div>
                <div className="bg-slate-50 px-2 py-1 rounded font-black text-slate-800">
                  🌯 {rev.average_score}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-3">
                {new Date(rev.created_at).toLocaleDateString('it-IT')}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}