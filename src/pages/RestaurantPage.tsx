import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MapPin, ArrowLeft, User } from 'lucide-react';

export default function RestaurantPage() {
  const { id } = useParams(); // Prende l'ID dall'URL
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      setLoading(true);
      // Scarica dati ristorante
      const { data: restData } = await supabase.from('restaurants').select('*').eq('id', id).single();
      // Scarica recensioni per questo ristorante
      const { data: revsData } = await supabase.from('reviews').select('*').eq('restaurant_id', id).order('created_at', { ascending: false });

      if (restData) setRestaurant(restData);
      if (revsData) setReviews(revsData);
      setLoading(false);
    };
    fetchRestaurantData();
  }, [id]);

  if (loading) return <div className="py-10 text-center font-bold text-slate-500 animate-pulse">Caricamento locale...</div>;
  if (!restaurant) return <div className="py-10 text-center font-bold text-red-500">Ristorante non trovato.</div>;

  const avgScore = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + Number(curr.average_score), 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="max-w-3xl mx-auto space-y-6 mb-20 md:mb-8 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm">
        <ArrowLeft size={16} /> Torna indietro
      </button>

      {/* Intestazione Ristorante */}
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800">{restaurant.name}</h1>
          <p className="text-slate-500 flex items-center gap-1 mt-2">
            <MapPin size={16} /> {restaurant.city}, {restaurant.country}
          </p>
          <div className="text-xs text-slate-400 mt-1 font-mono">Coordinate: {restaurant.lat.toFixed(4)}, {restaurant.lng.toFixed(4)}</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center min-w-[120px]">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Media</p>
          <p className="text-4xl font-black text-slate-800">🌯 {avgScore}</p>
          <p className="text-xs font-bold text-slate-500 mt-1">{reviews.length} recensioni</p>
        </div>
      </div>

      {/* Lista Recensioni */}
      <h2 className="text-xl font-extrabold text-slate-800 mt-8 mb-4">Tutte le recensioni</h2>
      {reviews.length === 0 ? (
        <p className="text-slate-500">Nessuna recensione ancora presente.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3">
                <Link to={`/user/${rev.username}`} className="flex items-center gap-2 group cursor-pointer">
                  <div className="bg-orange-100 p-2 rounded-full text-orange-600 group-hover:bg-orange-200 transition-colors"><User size={20} /></div>
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">{rev.username}</h3>
                    <p className="text-xs text-slate-400">{new Date(rev.created_at).toLocaleDateString('it-IT')}</p>
                  </div>
                </Link>
                <div className="text-2xl font-black text-slate-800">
                  🌯 {rev.average_score}
                </div>
              </div>
              
              {/* Dettaglio Voti */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div className="bg-slate-50 p-2 rounded-lg text-center">
                  <p className="text-xs text-slate-500 font-bold uppercase">Location</p>
                  <p className="font-black text-slate-700">{rev.score_location}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg text-center">
                  <p className="text-xs text-slate-500 font-bold uppercase">Menù</p>
                  <p className="font-black text-slate-700">{rev.score_offer}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg text-center">
                  <p className="text-xs text-slate-500 font-bold uppercase">Conto</p>
                  <p className="font-black text-slate-700">{rev.score_bill}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg text-center">
                  <p className="text-xs text-slate-500 font-bold uppercase">Gusto</p>
                  <p className="font-black text-slate-700">{rev.score_menu}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}