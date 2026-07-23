import { useState } from 'react';
import { UserCircle } from 'lucide-react';

export default function ProfileSetup({ onComplete }: { onComplete: () => void }) {
  const [name, setName] = useState('');

  const handleSave = () => {
    if (name.trim().length < 2) return;
    
    // Generiamo l'ID segreto e salviamo tutto nella memoria del telefono
    const userProfile = {
      username: name.toUpperCase(),
      userId: crypto.randomUUID()
    };
    
    localStorage.setItem('kata_profile', JSON.stringify(userProfile));
    onComplete(); // Chiude la schermata e fa partire l'app
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
          <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Benvenuto in KATA! 🌯</h1>
          <p className="text-slate-500">Crea il tuo profilo veloce. Niente password o email, ti basterà scegliere un nome.</p>
        </div>

        <div className="space-y-4 text-left">
          <label className="block font-bold text-slate-700 uppercase tracking-wide text-sm">
            Il tuo Nome / Nickname
          </label>
          <input 
            type="text" 
            placeholder="Es. GIGI LO SFIZIOSO"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-lg p-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase transition-all"
            autoFocus
          />
        </div>

        <button 
          onClick={handleSave}
          disabled={name.trim().length < 2}
          className="w-full py-4 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 transition-all text-lg shadow-md"
        >
          Entra in KATA
        </button>
      </div>
    </div>
  );
}