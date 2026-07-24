import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Trash2, User as UserIcon, LogOut, Loader2, Camera, X, Heart, MapPin } from 'lucide-react';

type Profile = {
  username: string;
  userId: string;
  avatar?: string | null;
  isAdmin?: boolean;
};

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

export default function MyProfile() {
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<Profile | null>(() => {
    try { return JSON.parse(localStorage.getItem('kata_profile') || 'null'); } 
    catch { return null; }
  });
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(profile?.avatar || null);
  const [pinConfirm, setPinConfirm] = useState('');
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [zoomedAvatar, setZoomedAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || !profile.userId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      const { data: revs } = await supabase.from('reviews').select('*, restaurants(id, name, city)').eq('user_id', profile.userId).order('created_at', { ascending: false });
      if (mounted && revs) setReviews(revs);
      const { data: favs } = await supabase.from('user_favorites').select('restaurant_id, restaurants(*)').eq('user_id', profile.userId).order('created_at', { ascending: false });
      if (mounted && favs) setFavorites(favs.map(f => f.restaurants));
      if (mounted) setLoading(false);
    };

    fetchData();
    return () => { mounted = false; };
  }, [profile]);

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <p className="text-slate-600 font-bold">Nessun profilo trovato sul dispositivo.</p>
        <p className="text-slate-500 mt-2">Crea un profilo per iniziare a recensire e gestire le tue recensioni.</p>
      </div>
    );
  }

  const handleAvatarChange = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Scegli un file immagine valido.');
    if (file.size > 5_000_000) return setError('L\'immagine deve essere inferiore a 5 MB.');

    try {
      setUploadingAvatar(true);
      setError('');
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.userId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = publicUrlData.publicUrl;
      const { error: updateError } = await supabase.from('users').update({ avatar: publicUrl }).eq('secret_id', profile.userId);
      if (updateError) throw updateError;

      setAvatar(publicUrl);
      const updatedProfile = { ...profile, avatar: publicUrl };
      localStorage.setItem('kata_profile', JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
    } catch (err: any) {
      console.error(err);
      setError('Errore durante il caricamento della foto profilo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!confirm('Sei sicuro di voler eliminare il profilo? Questa operazione rimuoverà tutte le tue recensioni e non è reversibile.')) return;
    if (pinConfirm.length === 0) return setError('Inserisci il PIN per confermare la cancellazione.');

    setError('');
    try {
      const { data: u } = await supabase.from('users').select('pin_code').eq('secret_id', profile.userId).maybeSingle();
      if (!u || u.pin_code !== pinConfirm) return setError('PIN non corretto.');

      await supabase.from('reviews').delete().eq('user_id', profile.userId);
      await supabase.from('users').delete().eq('secret_id', profile.userId);
      localStorage.removeItem('kata_profile');
      alert('Profilo eliminato. Tornerai alla configurazione iniziale.');
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setError('Errore durante la cancellazione del profilo.');
    }
  };

  const handleLogout = () => {
    if (!confirm('Sei sicuro di voler effettuare il logout? Potrai accedere di nuovo con il tuo nickname e PIN.')) return;
    localStorage.removeItem('kata_profile');
    navigate('/');
    window.location.reload();
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa recensione?')) return;
    setDeletingId(id);
    setError('');
    try {
      await supabase.from('reviews').delete().eq('id', id);
      setReviews(prev => prev.filter(r => r.id !== id));
      alert('Recensione eliminata.');
    } catch (err: any) {
      console.error(err);
      setError("Errore durante l'eliminazione della recensione.");
    } finally {
      setDeletingId(null);
    }
  };

  const avgGiven = reviews.length > 0 ? (reviews.reduce((acc, curr) => acc + Number(curr.average_score), 0) / reviews.length).toFixed(1) : '0.0';
  const vegCount = reviews.filter(r => r.is_vegetarian).length;
  const meatCount = reviews.length - vegCount;
  const vegPerc = reviews.length > 0 ? Math.round((vegCount / reviews.length) * 100) : 0;
  const meatPerc = reviews.length > 0 ? Math.round((meatCount / reviews.length) * 100) : 0;
  
  const userBadge = getBadgeInfo(reviews.length);

  return (
    <div className="max-w-3xl mx-auto space-y-6 mb-20 md:mb-8 animate-fade-in">
      {zoomedAvatar && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setZoomedAvatar(null)}>
          <button className="absolute top-6 right-6 text-white hover:text-orange-500 bg-black/50 p-2 rounded-full transition-colors"><X size={32} /></button>
          <img src={zoomedAvatar} alt="Ingrandimento Avatar" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-md text-white flex flex-col overflow-hidden">
        
        <div className="p-8 flex flex-col md:flex-row justify-between md:items-start gap-6">
          <div className="flex items-start gap-4">
            {/* FIX: shrink-0 per impedire lo schiacciamento */}
            <div className="relative shrink-0">
              <div className={`w-20 h-20 rounded-full bg-slate-700 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden ${avatar && !uploadingAvatar ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`} onClick={() => { if (avatar && !uploadingAvatar) setZoomedAvatar(avatar); }}>
                {uploadingAvatar ? <Loader2 size={32} className="text-white animate-spin" /> : avatar ? <img src={avatar} alt="Avatar profilo" className="w-full h-full object-cover aspect-square bg-white" /> : <UserIcon size={40} className="text-white/50" />}
              </div>
              <label className="absolute bottom-0 right-0 bg-orange-500 hover:bg-orange-600 transition-colors p-2 rounded-full border-2 border-slate-900 cursor-pointer shadow-lg z-10">
                <Camera size={14} className="text-white" />
                <input type="file" accept="image/*" className="hidden" disabled={uploadingAvatar} onChange={(e) => handleAvatarChange(e.target.files?.[0] || null)} />
              </label>
            </div>
            {/* FIX: min-w-0 e break-words per far andare a capo i testi lunghi */}
            <div className="min-w-0">
              <h1 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1">Il mio Profilo</h1>
              <h2 className="text-3xl font-black break-words leading-tight">{profile.username}</h2>
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

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm font-bold">{error}</div>}

      <h2 className="text-xl font-extrabold text-slate-800 mt-8 mb-4 flex items-center gap-2">
        <Heart className="text-red-500" size={24} /> Locali Preferiti
      </h2>
      {favorites.length === 0 ? (
        <p className="text-slate-500 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">Non hai ancora salvato nessun locale. Apri la pagina di un ristorante e clicca sul cuore per aggiungerlo qui!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map(rest => (
            <div key={rest.id} onClick={() => navigate(`/restaurant/${rest.id}`)} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition group flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors text-lg">{rest.name}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><MapPin size={14}/> {rest.city}, {rest.country}</p>
              </div>
              <Heart className="text-red-500 fill-red-500 opacity-50 group-hover:opacity-100 transition-opacity" size={20} />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Trash2 size={16} /> Elimina Profilo</h3>
          <p className="text-slate-500 text-sm mb-3">Eliminando il profilo verranno rimosse tutte le tue recensioni e il nickname tornerà disponibile per altri utenti.</p>
          <div className="flex gap-3 items-center">
            <input value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value)} placeholder="Inserisci PIN" className="flex-1 p-3 border border-slate-200 rounded-lg" />
            <button onClick={handleDeleteProfile} className="px-4 py-3 bg-red-600 text-white rounded-lg font-bold">Elimina</button>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><LogOut size={16} /> Logout</h3>
          <p className="text-slate-500 text-sm mb-3">Esci dal tuo account su questo dispositivo. Il profilo rimarrà salvato nel database.</p>
          <button onClick={handleLogout} className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg font-bold hover:bg-slate-700">Logout</button>
        </div>
      </div>

      <h2 className="text-xl font-extrabold text-slate-800 mt-8 mb-4">Le mie recensioni</h2>
      {loading ? <div className="py-10 text-center font-bold text-slate-500 animate-pulse">Caricamento...</div> : reviews.length === 0 ? (
        <p className="text-slate-500 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">Non hai ancora scritto recensioni.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-2">
                <div className="min-w-0 pr-4">
                  <Link to={`/restaurant/${rev.restaurants.id}`} className="font-bold text-slate-800 hover:text-orange-600 transition-colors block text-lg truncate">
                    {rev.restaurants.name}
                  </Link>
                  <p className="text-xs text-slate-500 truncate">{rev.restaurants.city}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="bg-slate-50 px-2 py-1 rounded font-black text-slate-800">{rev.is_vegetarian ? '🧆' : '🥙'} {rev.average_score}</div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-3">{new Date(rev.created_at).toLocaleDateString('it-IT')}</p>
              
              {rev.comment && (
                <div className={`mt-4 pt-3 border-t text-sm font-medium italic ${rev.is_vegetarian ? 'border-[#dce6d8] text-[#5c7a52]' : 'border-slate-100 text-slate-600'}`}>
                  « {rev.comment} »
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button onClick={() => navigate(`/edit/${rev.id}`)} className="flex-1 text-blue-600 hover:text-blue-800 p-2 rounded-md border border-blue-300 hover:bg-blue-50 text-sm font-bold">✏️ Modifica</button>
                <button onClick={() => handleDeleteReview(rev.id)} className="text-red-600 hover:text-red-800 p-2 rounded-md" disabled={deletingId === rev.id}>
                  {deletingId === rev.id ? '...' : <Trash2 size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}