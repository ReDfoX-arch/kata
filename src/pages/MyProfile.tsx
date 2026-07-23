import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Edit3, User as UserIcon } from 'lucide-react';

type Profile = {
  username: string;
  userId: string;
  avatar?: string | null;
};

export default function MyProfile() {
  // Rendiamo il profile stabile (state) per evitare che il componente ricarichi ripetutamente
  const [profile, setProfile] = useState<Profile | null>(() => {
    try {
      return JSON.parse(localStorage.getItem('kata_profile') || 'null');
    } catch {
      return null;
    }
  });
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(profile?.avatar || null);
  const [savingName, setSavingName] = useState(false);
  const [pinConfirm, setPinConfirm] = useState('');
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    // Pre-fill il campo nickname quando il profile è disponibile
    if (profile && profile.username) setNewName(profile.username);
  }, [profile]);

  useEffect(() => {
    if (!profile || !profile.userId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const fetchMyReviews = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('reviews')
        .select('*, restaurants(id, name, city)')
        .eq('user_id', profile.userId)
        .order('created_at', { ascending: false });

      if (mounted && data) setReviews(data);
      if (mounted) setLoading(false);
    };

    fetchMyReviews();

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

  const handleAvatarChange = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Scegli un file immagine valido.');
      return;
    }
    if (file.size > 2_000_000) {
      setError('L\'immagine deve essere inferiore a 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setAvatar(result);
        if (profile) {
          const updatedProfile = { ...profile, avatar: result };
          localStorage.setItem('kata_profile', JSON.stringify(updatedProfile));
          setProfile(updatedProfile);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChangeName = async () => {
    const trimmed = newName.trim();
    if (trimmed.length < 2) {
      setError('Il nome deve avere almeno 2 caratteri.');
      return;
    }

    const upper = trimmed.toUpperCase();
    setSavingName(true);
    setError('');

    try {
      // Controlla se esiste un altro utente con lo stesso username
      const { data: existing } = await supabase
        .from('users')
        .select('secret_id')
        .eq('username', upper)
        .maybeSingle();

      if (existing && existing.secret_id !== profile.userId) {
        setError('Questo nickname è già in uso da un altro utente.');
        setSavingName(false);
        return;
      }

      // Aggiorna la tabella users
      const { error: updateUserError } = await supabase
        .from('users')
        .update({ username: upper })
        .eq('secret_id', profile.userId);

      if (updateUserError) throw updateUserError;

      // Aggiorna localStorage
      const newProfile = { ...profile, username: upper };
      localStorage.setItem('kata_profile', JSON.stringify(newProfile));
      setSavingName(false);
      alert('Nickname aggiornato con successo.');
      // Aggiorna pagina per riflettere il nuovo username
      window.location.reload();

    } catch (err: any) {
      console.error(err);
      setError('Errore durante l\'aggiornamento del nome.');
      setSavingName(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!confirm('Sei sicuro di voler eliminare il profilo? Questa operazione rimuoverà tutte le tue recensioni e non è reversibile.')) return;

    if (pinConfirm.length === 0) {
      setError('Inserisci il PIN per confermare la cancellazione.');
      return;
    }

    setError('');

    try {
      // Verifica PIN
      const { data: u } = await supabase
        .from('users')
        .select('pin_code')
        .eq('secret_id', profile.userId)
        .maybeSingle();

      if (!u || u.pin_code !== pinConfirm) {
        setError('PIN non corretto.');
        return;
      }

      // Elimina recensioni
      const { error: delReviewsErr } = await supabase
        .from('reviews')
        .delete()
        .eq('user_id', profile.userId);

      if (delReviewsErr) throw delReviewsErr;

      // Elimina utente
      const { error: delUserErr } = await supabase
        .from('users')
        .delete()
        .eq('secret_id', profile.userId);

      if (delUserErr) throw delUserErr;

      // Pulisci localStorage e ricarica per far apparire il setup
      localStorage.removeItem('kata_profile');
      alert('Profilo eliminato. Tornerai alla configurazione iniziale.');
      window.location.reload();

    } catch (err: any) {
      console.error(err);
      setError('Errore durante la cancellazione del profilo.');
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa recensione?')) return;
    setDeletingId(id);
    setError('');
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReviews(prev => prev.filter(r => r.id !== id));
      alert('Recensione eliminata.');
    } catch (err: any) {
      console.error(err);
      setError("Errore durante l'eliminazione della recensione.");
    } finally {
      setDeletingId(null);
    }
  };

  const avgGiven = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + Number(curr.average_score), 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="max-w-3xl mx-auto space-y-6 mb-20 md:mb-8 animate-fade-in">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-xl shadow-md text-white flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div className="flex items-center gap-4">
          <label className="cursor-pointer">
            {avatar ? (
              <img src={avatar} alt="Avatar profilo" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" />
            ) : (
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <UserIcon size={40} className="text-white" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleAvatarChange(e.target.files?.[0] || null)}
            />
          </label>
          <div>
            <h1 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1">Il mio Profilo</h1>
            <h2 className="text-3xl font-black">{profile.username}</h2>
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

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Edit3 size={16} /> Cambia Nickname</h3>
        {error && <p className="text-sm text-red-600 mb-2 font-bold">{error}</p>}
        <div className="flex gap-3">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nuovo nickname" className="flex-1 p-3 border border-slate-200 rounded-lg" />
          <button onClick={handleChangeName} disabled={savingName} className="px-4 py-3 bg-orange-600 text-white rounded-lg font-bold">{savingName ? 'Salvando...' : 'Cambia'}</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Trash2 size={16} /> Elimina Profilo</h3>
        <p className="text-slate-500 text-sm mb-3">Eliminando il profilo verranno rimosse tutte le tue recensioni e il nickname tornerà disponibile per altri utenti.</p>
        <div className="flex gap-3 items-center">
          <input value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value)} placeholder="Inserisci PIN per confermare" className="flex-1 p-3 border border-slate-200 rounded-lg" />
          <button onClick={handleDeleteProfile} className="px-4 py-3 bg-red-600 text-white rounded-lg font-bold">Elimina</button>
        </div>
      </div>

      <h2 className="text-xl font-extrabold text-slate-800 mt-8 mb-4">Le mie recensioni</h2>
      {loading ? (
        <div className="py-10 text-center font-bold text-slate-500 animate-pulse">Caricamento...</div>
      ) : reviews.length === 0 ? (
        <p className="text-slate-500">Non hai ancora scritto recensioni.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-slate-800">{rev.restaurants.name}</h3>
                  <p className="text-xs text-slate-500">{rev.restaurants.city}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-slate-50 px-2 py-1 rounded font-black text-slate-800">🌯 {rev.average_score}</div>
                  <button
                    onClick={() => handleDeleteReview(rev.id)}
                    className="text-red-600 hover:text-red-800 p-2 rounded-md"
                    title="Elimina recensione"
                    disabled={deletingId === rev.id}
                  >
                    {deletingId === rev.id ? '...' : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-3">{new Date(rev.created_at).toLocaleDateString('it-IT')}</p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
