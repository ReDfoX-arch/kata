import { useState } from 'react';
import { UserCircle, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase'; // Assicurati che il percorso sia corretto

export default function ProfileSetup({ onComplete }: { onComplete: () => void }) {
  const [mode, setMode] = useState<'new' | 'login'>('new');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [avatar, setAvatar] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Scegli un file immagine valido.');
      return;
    }
    if (file.size > 2_000_000) {
      setError("L'immagine deve essere inferiore a 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setAvatar(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (name.trim().length < 2) {
      setError("Il nome deve avere almeno 2 caratteri.");
      return;
    }
    if (pin.length < 4) {
      setError("Inserisci un PIN di almeno 4 numeri/caratteri.");
      return;
    }
    
    setLoading(true);
    setError('');
    const upperUsername = name.toUpperCase().trim();

    try {
      if (mode === 'new') {
        // 1. Controlla se il nome è già stato preso
        const { data: existingUser } = await supabase
          .from('users')
          .select('username')
          .eq('username', upperUsername)
          .maybeSingle();

        if (existingUser) {
          setError("⚠️ Questo nome è già in uso! Scegline un altro o fai l'accesso se è il tuo.");
          setLoading(false);
          return;
        }

        // 2. Se è libero, creiamo l'account e l'ID Segreto
        const newSecretId = crypto.randomUUID();
        const { error: insertError } = await supabase
          .from('users')
          .insert({ 
            username: upperUsername, 
            pin_code: pin, 
            secret_id: newSecretId,
            avatar: avatar || null
          });

        if (insertError) throw insertError;

        // 3. Salviamo nel telefono
        localStorage.setItem('kata_profile', JSON.stringify({
          username: upperUsername,
          userId: newSecretId,
          avatar: avatar || null
        }));
        onComplete();

      } else {
        // --- MODALITÀ ACCESSO (LOGIN DA ALTRO DISPOSITIVO) ---
        const { data: user, error: loginError } = await supabase
          .from('users')
          .select('secret_id, avatar')
          .eq('username', upperUsername)
          .eq('pin_code', pin)
          .maybeSingle();

        if (loginError) throw loginError;

        if (!user) {
          setError("❌ Nome o PIN errati. Riprova.");
          setLoading(false);
          return;
        }

        // Se nuovo avatar caricato, aggiorna il database
        if (avatar) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ avatar })
            .eq('secret_id', user.secret_id);
          
          if (updateError) throw updateError;
        }

        // Se corretto, scarichiamo l'ID segreto e lo salviamo nel nuovo dispositivo
        localStorage.setItem('kata_profile', JSON.stringify({
          username: upperUsername,
          userId: user.secret_id,
          avatar: avatar || user.avatar || null
        }));
        onComplete();
      }
    } catch (err: any) {
      console.error(err);
      setError("Si è verificato un errore col database.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 fixed inset-0 z-[100]">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-orange-100 p-4 rounded-full">
            <UserCircle size={48} className="text-orange-600" />
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 mb-2">
            {mode === 'new' ? 'Benvenuto in KATA!' : 'Ciao Capo!'}
          </h1>
          <p className="text-slate-500 text-sm">
            {mode === 'new' 
              ? 'Scegli un Nickname unico e un PIN per proteggere le tue recensioni.' 
              : 'Inserisci il tuo Nickname e il tuo PIN per sincronizzare questo dispositivo.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm text-left font-bold">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 text-left">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wide text-xs mb-1">
              Foto profilo (dalla galleria)
            </label>
            <label className="w-full cursor-pointer">
              <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-orange-500 transition-colors bg-slate-50">
                {avatar ? (
                  <img src={avatar} alt="Anteprima avatar" className="mx-auto h-28 w-28 rounded-full object-cover" />
                ) : (
                  <p className="text-slate-500">Tocca per scegliere un'immagine dal tuo dispositivo</p>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarChange(e.target.files?.[0] || null)}
              />
            </label>
            <p className="text-xs text-slate-400 mt-2">Scegli una foto dal cellulare o dal computer. Max 2MB.</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wide text-xs mb-1">
              Il tuo Nickname
            </label>
            <input 
              type="text" 
              placeholder="Es. KebabLover69"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wide text-xs mb-1 flex items-center gap-1">
              <Lock size={14} /> PIN di Sicurezza
            </label>
            <input 
              type="password" 
              maxLength={4}
              placeholder="Es. 1234"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold tracking-widest text-center text-xl"
            />
          </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={loading || name.trim().length < 2 || pin.length < 4}
          className="w-full py-4 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 transition-all text-lg shadow-md flex items-center justify-center gap-2"
        >
          {loading ? 'Attendere...' : (mode === 'new' ? 'Crea Profilo' : 'Accedi')}
        </button>

        {/* Pulsante per cambiare tra Registrazione e Accesso */}
        <button 
          onClick={() => {
            setMode(mode === 'new' ? 'login' : 'new');
            setError('');
            setPin('');
          }}
          className="text-sm font-bold text-slate-500 hover:text-orange-600 transition-colors"
        >
          {mode === 'new' 
            ? 'Hai già un profilo? Clicca qui per accedere.' 
            : 'Non hai un profilo? Creane uno nuovo.'}
        </button>
      </div>
    </div>
  );
}