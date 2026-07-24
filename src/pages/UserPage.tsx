import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';

const BADGE_LEVELS = [
  { min: 30, title: 'Sultano del Sacro Spiedo', color: 'text-yellow-400' },
  { min: 20, title: 'Gran Visir del Döner', color: 'text-fuchsia-400' },
  { min: 15, title: 'Califfo dello Shawarma', color: 'text-cyan-400' },
  { min: 10, title: 'Pascià del Piccante', color: 'text-red-400' },
  { min: 5,  title: 'Emiro del Dürüm', color: 'text-emerald-400' },
  { min: 0,  title: 'Beduino della Notte', color: 'text-slate-300' }
];

const getBadgeInfo = (count: number) => {
  const total = BADGE_LEVELS.length;
  for (let i = 0; i < total; i++) {
    if (count >= BADGE_LEVELS[i].min) {
      return {
        title: BADGE_LEVELS[i].title,
        color: BADGE_LEVELS[i].color,
        current: total - i,
        total: total
      };
    }
  }
  return { title: 'Beduino della Notte', color: 'text-slate-300', current: 1, total };
};

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (userData) {
        setUser(userData);
        const { data: revs } = await supabase
          .from('reviews')
          .select('*, restaurants(id, name, city)')
          .eq('user_id', userData.secret_id)
          .order('created_at', { ascending: false });

        if (revs) setReviews(revs);
      }
      setLoading(false);
    };
    fetchUserData();
  }, [username]);

  if (loading) return <div className="py-10 text-center font-bold text-slate-500 animate-pulse">Caricamento profilo...</div>;
  if (!user) return <div className="py-10 text-center font-bold text-red-500">Utente non trovato.</div>;

  const avgGiven = reviews.length > 0 ? (reviews.reduce((acc, curr) => acc + Number(curr.average_score), 0) / reviews.length).toFixed(1) : '0.0';
  const vegCount = reviews.filter(r => r.is_vegetarian).length;
  const meatCount = reviews.length - vegCount;
  const vegPerc = reviews.length > 0 ? Math.round((vegCount / reviews.length) * 100) : 0;
  const meatPerc = reviews.length > 0 ? Math.round((meatCount / reviews.length) * 100) : 0;

  const userBadge = getBadgeInfo(reviews.length);

  return (
    <div className="max-w-3xl mx-auto space-y-6 mb-20 md:mb-8 animate-fade-in">
      
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm">
        <ArrowLeft size={16} /> Torna indietro
      </button>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-md text-white flex flex-col overflow-hidden">
        
        <div className="p-8 flex flex-col md:flex-row justify-between md:items-start gap-6">
          <div className="flex items-start gap-4">
            {/* FIX: shrink-0 per impedire lo schiacciamento */}
            <div className="shrink-0">
              <UserAvatar userId={user.secret_id} username={user.username} size="lg" className="w-20 h-20 shadow-lg aspect-square" />
            </div>
            {/* FIX: min-w-0 e break-words per far andare a capo i testi lunghi */}
            <div className="min-w-0">
              <h1 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1">Profilo Utente</h1>
              <h2 className="text-3xl font-black break-words leading-tight">{user.username}</h2>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap md:justify-end">
            <div className="bg-white/10 border border-white/20 px-4 py-3 rounded-xl text-center min-w-[80px] backdrop-blur-sm flex-1 flex flex-col items-center justify-center">
              <p className="text-[10px] font-bold text-slate-300 uppercase mb-1">Recensioni</p>
              <p className="text-xl font-black">{reviews.length}</p>
            </div>
            <div className="bg-white/10 border border-white/20 px-4 py-3 rounded-xl text-center min-w-[80px] backdrop-blur-sm flex-1 flex flex-col items-center justify-center">
              <p className="text-[10px] font-bold text-slate-300 uppercase mb-1">Media</p>
              <p className="text-xl font-black">🌯 {avgGiven}</p>
            </div>
            <div className="bg-white/10 border border-white/20 px-4 py-3 rounded-xl text-center min-w-[100px] backdrop-blur-sm flex-1 flex flex-col items-center justify-center">
              <p className="text-[10px] font-bold text-slate-300 uppercase mb-1">Stile</p>
              <div className="flex justify-center gap-3 text-lg font-black mt-0.5">
                <span className="text-orange-200" title="Kebab di Carne">🥙 {meatPerc}%</span>
                <span className="text-green-300" title="Falafel / Veg">🧆 {vegPerc}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/20 px-8 py-4 border-t border-white/5 flex items-center justify-between gap-4">
          <span className={`text-base sm:text-lg font-black tracking-wide italic truncate ${userBadge.color}`}>
            « {userBadge.title} »
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-400 bg-white/5 px-3 py-1 rounded-full shrink-0">
            {userBadge.current} / {userBadge.total}
          </span>
        </div>

      </div>

      <h2 className="text-xl font-extrabold text-slate-800 mt-8 mb-4">Recensioni di {user.username}</h2>
      
      {reviews.length === 0 ? (
        <p className="text-slate-500 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">Nessuna recensione scritta da questo utente.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => {
            const isVeg = rev.is_vegetarian;
            const cardBg = isVeg ? 'bg-[#f4f7f3] border-[#dce6d8]' : 'bg-white border-slate-200';
            
            return (
              <div key={rev.id} className={`p-5 rounded-xl shadow-sm border ${cardBg}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 pr-4">
                    <Link to={`/restaurant/${rev.restaurants.id}`} className="font-bold text-slate-800 hover:text-orange-600 transition-colors block text-lg truncate">
                      {rev.restaurants.name}
                    </Link>
                    <p className="text-xs text-slate-500 truncate">{rev.restaurants.city}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="bg-slate-50 px-2 py-1 rounded font-black text-slate-800 border border-slate-200/60">
                      {isVeg ? '🧆' : '🥙'} {rev.average_score}
                    </div>
                  </div>
                </div>
                
                <p className={`text-[10px] font-bold mt-3 ${isVeg ? 'text-[#6b8a61]' : 'text-slate-400'}`}>
                  {new Date(rev.created_at).toLocaleDateString('it-IT')}
                </p>
                
                {rev.comment && (
                  <div className={`mt-4 pt-3 border-t text-sm font-medium italic ${isVeg ? 'border-[#dce6d8] text-[#5c7a52]' : 'border-slate-100 text-slate-600'}`}>
                    « {rev.comment} »
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}