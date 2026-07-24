import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MapPin, ArrowLeft } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';

export default function RestaurantPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      setLoading(true);
      const { data: restData } = await supabase.from('restaurants').select('*').eq('id', id).single();
      const { data: revsData } = await supabase.from('reviews').select('*').eq('restaurant_id', id).order('created_at', { ascending: false });

      if (restData) {
        setRestaurant(restData);
      }

      if (revsData) {
        const userIds = Array.from(new Set(revsData.map((r: any) => r.user_id).filter(Boolean)));
        let usersMap: Record<string, string> = {};
        if (userIds.length > 0) {
          const { data: users } = await supabase.from('users').select('username, secret_id').in('secret_id', userIds);
          if (users) {
            usersMap = users.reduce((acc: any, u: any) => ({ ...acc, [u.secret_id]: u.username }), {});
          }
        }

        const mapped = revsData.map((r: any) => ({ ...r, display_username: usersMap[r.user_id] || r.username }));
        setReviews(mapped);
      }

      setLoading(false);
    };
    fetchRestaurantData();
  }, [id]);

  if (loading) return <div className="py-10 text-center font-bold text-slate-500 animate-pulse">Caricamento locale...</div>;
  if (!restaurant) return <div className="py-10 text-center font-bold text-red-500">Ristorante non trovato.</div>;

  const avgScore = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + Number(curr.average_score), 0) / reviews.length).toFixed(1)
    : '0.0';

  const lat = parseFloat(restaurant.lat);
  const lng = parseFloat(restaurant.lng);
  
  let mapSrc = '';
  if (!isNaN(lat) && !isNaN(lng)) {
    const offset = 0.005;
    const minLng = (lng - offset).toFixed(4);
    const minLat = (lat - offset).toFixed(4);
    const maxLng = (lng + offset).toFixed(4);
    const maxLat = (lat + offset).toFixed(4);
    
    const bbox = `${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}`;
    const marker = `${lat}%2C${lng}`;
    mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 mb-20 md:mb-8 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm">
        <ArrowLeft size={16} /> Torna indietro
      </button>

      {/* Intestazione Ristorante */}
      <div className="relative bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row justify-between md:items-center min-h-[220px]">
        
        {/* Sfondo Decorativo Mappa */}
        <div className="absolute inset-0 z-0 pointer-events-none rounded-xl overflow-hidden">
          
          {/* Wrapper Mappa (In basso su Mobile, a destra su PC) */}
          <div className="absolute right-0 bottom-0 top-[40%] md:top-0 left-0 md:left-[30%] overflow-hidden">
            
            {/* Iframe ingrandito oltre i bordi per nascondere i tasti +/- e il logo */}
            {mapSrc && (
              <iframe 
                src={mapSrc}
                className="absolute -top-16 -bottom-16 -left-16 -right-16 w-[calc(100%+8rem)] h-[calc(100%+8rem)] opacity-50 grayscale-[30%] object-cover pointer-events-none"
                frameBorder="0" 
                scrolling="no" 
                title="Mappa Sfondo"
              ></iframe>
            )}
          </div>

          {/* Gradiente: Su mobile scende dall'alto (bianco) verso il basso (trasparente). Su PC da sinistra a destra. */}
          <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-white via-white/95 to-transparent md:via-white/90 z-10 pointer-events-none"></div>
        </div>

        {/* Contenuto Testuale */}
        <div className="relative z-20 p-6 md:p-8 flex-1">
          <h1 className="text-3xl font-black text-slate-800">{restaurant.name}</h1>
          <p className="text-slate-600 font-medium flex items-center gap-1 mt-2">
            <MapPin size={16} className="text-orange-600" /> {restaurant.city}, {restaurant.country}
          </p>
          <div className="text-xs text-slate-400 mt-1 font-mono font-medium">Coordinate: {lat.toFixed(4)}, {lng.toFixed(4)}</div>
        </div>

        {/* Statistiche e Azioni */}
        <div className="relative z-20 p-6 md:p-8 pt-0 md:pt-8 flex flex-col items-start md:items-end gap-3 mt-auto md:mt-0">
          <div className="bg-white/80 backdrop-blur-md border border-slate-100 shadow-sm p-4 rounded-xl text-center min-w-[120px]">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Media</p>
            <p className="text-4xl font-black text-slate-800">🌯 {avgScore}</p>
            <p className="text-xs font-bold text-slate-600 mt-1">{reviews.length} recensioni</p>
          </div>

          <button
            onClick={() => navigate('/add', { state: { restaurant } })}
            className="bg-orange-600 text-white px-4 py-2 flex-1 md:flex-none w-full text-center rounded-lg font-bold hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg"
          >
            Scrivi recensione
          </button>
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
                <Link to={`/user/${(rev.display_username || rev.username)}`} className="flex items-center gap-2 group cursor-pointer flex-1">
                  <UserAvatar userId={rev.user_id} username={rev.display_username} size="md" />
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">{rev.display_username || rev.username}</h3>
                    <p className="text-xs text-slate-400">{new Date(rev.created_at).toLocaleDateString('it-IT')}</p>
                  </div>
                </Link>
                <div className="text-2xl font-black text-slate-800">
                  🌯 {rev.average_score}
                </div>
              </div>
              
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