import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScoreGroup from '../components/ScoreGroup';
import RestaurantSearch from '../components/RestaurantSearch';
import { supabase } from '../lib/supabase';

export default function AddReview() {
  const navigate = useNavigate();
  
  // Stati per memorizzare i dati inseriti dall'utente
  const [username, setUsername] = useState('');
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().split('T')[0]); // NUOVO: Stato per la data
  const [restaurant, setRestaurant] = useState<{name: string; city: string; country: string; lat: number; lng: number} | null>(null);
  const [scores, setScores] = useState({
    location: 0,
    offer: 0,
    bill: 0,
    menu: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcolo automatico della media
  const values = Object.values(scores);
  const isAllVoted = values.every(v => v > 0);
  const average = isAllVoted ? (values.reduce((a, b) => a + b, 0) / 4).toFixed(1) : '0.0';

  const handleScoreChange = (category: keyof typeof scores, value: number) => {
    setScores(prev => ({ ...prev, [category]: value }));
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Forza il testo in MAIUSCOLO
    setUsername(e.target.value.toUpperCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!username || !isAllVoted || !restaurant) {
        alert("Compila tutti i campi: Username, Ristorante e tutti i 4 voti!");
        return;
      }

      setIsSubmitting(true);

      try {
        const upperUsername = username.toUpperCase();

        // 1. Salviamo o confermiamo l'utente (Upsert: aggiorna se esiste, inserisce se non esiste)
        const { error: userError } = await supabase
          .from('users')
          .upsert({ username: upperUsername }, { onConflict: 'username' });
        
        if (userError) throw userError;

        // 2. Cerchiamo se il ristorante è già nel database (per evitare duplicati)
        let restaurantId = null;
        const { data: existingRest, error: searchRestError } = await supabase
          .from('restaurants')
          .select('id')
          .eq('name', restaurant.name)
          .eq('lat', restaurant.lat)
          .maybeSingle(); // maybeSingle non dà errore se non trova nulla

        if (searchRestError) throw searchRestError;

        if (existingRest) {
          restaurantId = existingRest.id;
        } else {
          // Se è un nuovo locale, lo aggiungiamo
          const { data: newRest, error: insertRestError } = await supabase
            .from('restaurants')
            .insert({
              name: restaurant.name,
              city: restaurant.city,
              country: restaurant.country,
              lat: restaurant.lat,
              lng: restaurant.lng
            })
            .select('id')
            .single();

          if (insertRestError) throw insertRestError;
          restaurantId = newRest.id;
        }

        // Formattazione sicura per la data da inviare al database
        let dateToSave = new Date().toISOString();
        if (reviewDate) {
          const parsedDate = new Date(reviewDate);
          if (!isNaN(parsedDate.getTime())) {
            const now = new Date();
            parsedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
            dateToSave = parsedDate.toISOString();
          }
        }

        // 3. Inseriamo la recensione effettiva
        const { error: reviewError } = await supabase
          .from('reviews')
          .insert({
            restaurant_id: restaurantId,
            username: upperUsername,
            score_location: scores.location,
            score_offer: scores.offer,
            score_bill: scores.bill,
            score_menu: scores.menu,
            created_at: dateToSave // NUOVO: Salvataggio data custom
          });

        if (reviewError) throw reviewError;

        alert(`✅ Recensione salvata con successo!`);
        
        // Riporta l'utente alla Home Page
        navigate('/');

      } catch (error: any) {
        console.error("Errore durante il salvataggio:", error);
        alert(`Si è verificato un errore col database: ${error.message || "Errore sconosciuto"}`);
      } finally {
        setIsSubmitting(false);
      }
    };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-100 mt-4 mb-20 md:mb-4">
      <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
        <span>✍️</span> Capo dimmi tutto...
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Sezione Username e Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wide text-sm mb-2">
              Il tuo Username
            </label>
            <input 
              type="text" 
              placeholder="Es. GUGLIELMO SCUOTIPERA"
              value={username}
              onChange={handleUsernameChange}
              className="w-full text-lg p-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all uppercase placeholder:normal-case"
              required
            />
            <p className="text-xs text-slate-500 mt-2">Scegli un nome. Sarà visibile pubblicamente.</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wide text-sm mb-2">
              Data Visita
            </label>
            <input 
              type="date" 
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
              className="w-full text-lg p-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              required
            />
            <p className="text-xs text-slate-500 mt-2">Quando hai provato questo kebab?</p>
          </div>
        </div>

        {/* Qui andrà il componente per cercare/selezionare il ristorante */}
        <div className="pt-4 pb-2 border-t border-slate-100">
          <RestaurantSearch onSelect={setRestaurant} />
        </div>

        {/* Sezione Voti */}
        <div className="pt-4 border-t border-slate-100">
          <ScoreGroup label="Location" value={scores.location} onChange={(v) => handleScoreChange('location', v)} />
          <ScoreGroup label="Menù" value={scores.offer} onChange={(v) => handleScoreChange('offer', v)} />
          <ScoreGroup label="Prezzo" value={scores.bill} onChange={(v) => handleScoreChange('bill', v)} />
          <ScoreGroup label="Gusto" value={scores.menu} onChange={(v) => handleScoreChange('menu', v)} />
        </div>

        {/* Sezione Risultato e Invio */}
        <div className="bg-slate-50 p-6 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-200">
          <div className="text-center sm:text-left">
            <p className="text-slate-500 font-bold uppercase text-xs tracking-wider mb-1">Punteggio Finale</p>
            <p className="text-4xl font-black text-slate-800">
              🌯 {average} <span className="text-xl text-slate-400 font-medium">/ 10</span>
            </p>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 sm:flex-none px-6 py-3 rounded-lg font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Annulla
            </button>
            <button 
              type="submit"
              className={`flex-1 sm:flex-none px-8 py-3 rounded-lg font-bold text-white transition-all shadow-md
                ${username && isAllVoted && restaurant && !isSubmitting ? 'bg-orange-600 hover:bg-orange-700 hover:shadow-lg' : 'bg-slate-300 cursor-not-allowed'}
              `}
              disabled={!username || !isAllVoted || !restaurant || isSubmitting}
            >
              {isSubmitting ? 'Salvataggio...' : 'Salva Voto'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}