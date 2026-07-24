import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ScoreGroup from '../components/ScoreGroup';
import RestaurantSearch from '../components/RestaurantSearch';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';

export default function AddReview() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditMode = !!editId;
  
  const profile = JSON.parse(localStorage.getItem('kata_profile') || '{}');
  const location = useLocation();
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().split('T')[0]);
  const [restaurant, setRestaurant] = useState<{name: string; city: string; country: string; lat: number; lng: number} | null>(null);
  const [scores, setScores] = useState({
    location: 0,
    offer: 0,
    bill: 0,
    menu: 0
  });
  
  // NUOVI STATI: Commento e Opzione Vegetariana
  const [comment, setComment] = useState('');
  const [isVegetarian, setIsVegetarian] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      if (!isEditMode && (location as any)?.state?.restaurant) {
        const r = (location as any).state.restaurant;
        if (r) {
          setRestaurant({ name: r.name, city: r.city || '', country: r.country || '', lat: Number(r.lat), lng: Number(r.lng) });
        }
      }
    } catch (e) {
      console.warn('No prefilled restaurant');
    }
  }, [isEditMode, location]);

  useEffect(() => {
    if (!isEditMode) return;
    
    const fetchReview = async () => {
      try {
        const { data: review } = await supabase
          .from('reviews')
          .select('*, restaurants(*)')
          .eq('id', editId)
          .maybeSingle();

        if (!review) {
          setError('Recensione non trovata.');
          setLoading(false);
          return;
        }

        if (review.user_id !== profile.userId) {
          setError('Non puoi modificare una recensione che non è tua.');
          setLoading(false);
          return;
        }

        setReviewDate(review.created_at.split('T')[0]);
        setRestaurant({
          name: review.restaurants.name,
          city: review.restaurants.city,
          country: review.restaurants.country,
          lat: review.restaurants.lat,
          lng: review.restaurants.lng
        });
        setScores({
          location: review.score_location,
          offer: review.score_offer,
          bill: review.score_bill,
          menu: review.score_menu
        });
        // Popola i nuovi campi
        setComment(review.comment || '');
        setIsVegetarian(review.is_vegetarian || false);
        
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError('Errore nel caricamento della recensione.');
        setLoading(false);
      }
    };

    fetchReview();
  }, [editId, profile.userId]);

  const values = Object.values(scores);
  const isAllVoted = values.every(v => v > 0);
  const average = isAllVoted ? (values.reduce((a, b) => a + b, 0) / 4).toFixed(1) : '0.0';

  const handleScoreChange = (category: keyof typeof scores, value: number) => {
    setScores(prev => ({ ...prev, [category]: value }));
  };

  const validateScores = (): boolean => {
    const allMin = Object.values(scores).every(v => v === 1);
    const allMax = Object.values(scores).every(v => v === 10);

    if (allMin) {
      setError('Capo, stiamo parlando di un Kebab, cosa ti aspettavi?');
      return false;
    }
    if (allMax) {
      setError('Capo... Chi ti ha pagato?');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllVoted || !restaurant) {
      alert("Compila tutti i campi: Ristorante e tutti i 4 voti!");
      return;
    }

    if (!validateScores()) return;

    setIsSubmitting(true);
    setError('');

    try {
      if (!profile?.userId || !profile?.username) {
        setError('Profilo utente non valido. Effettua nuovamente il login.');
        setIsSubmitting(false);
        return;
      }

      const upperUsername = profile.username;
      let restaurantId = null;

      const { data: existingRest, error: searchRestError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('name', restaurant.name)
        .eq('lat', restaurant.lat)
        .maybeSingle();

      if (searchRestError) throw searchRestError;

      if (existingRest) {
        restaurantId = existingRest.id;
      } else {
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

      let dateToSave = new Date().toISOString();
      if (reviewDate) {
        const parsedDate = new Date(reviewDate);
        if (!isNaN(parsedDate.getTime())) {
          const now = new Date();
          parsedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
          dateToSave = parsedDate.toISOString();
        }
      }

      const reviewData = {
        restaurant_id: restaurantId,
        username: upperUsername,
        user_id: profile.userId,
        score_location: scores.location,
        score_offer: scores.offer,
        score_bill: scores.bill,
        score_menu: scores.menu,
        created_at: dateToSave,
        comment: comment.trim() || null, // Salva il commento
        is_vegetarian: isVegetarian      // Salva il flag veg
      };

      if (isEditMode) {
        const { error: updateError } = await supabase
          .from('reviews')
          .update(reviewData)
          .eq('id', editId)
          .eq('user_id', profile.userId);

        if (updateError) throw updateError;
        alert('✅ Recensione aggiornata con successo!');
      } else {
        const { error: reviewError } = await supabase
          .from('reviews')
          .insert(reviewData);

        if (reviewError) throw reviewError;
        alert('✅ Recensione salvata con successo!');
      }

      navigate('/');

    } catch (error: any) {
      console.error("Errore durante il salvataggio:", error);
      setError(`Si è verificato un errore: ${error.message || "Errore sconosciuto"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="py-10 text-center font-bold text-slate-500 animate-pulse">Caricamento...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-100 mt-4 mb-20 md:mb-4">
      {isEditMode && (
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm mb-4">
          <ArrowLeft size={16} /> Torna indietro
        </button>
      )}
      
      <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
        <span>{isEditMode ? '✏️' : '✍️'}</span> {isEditMode ? 'Modifica Recensione' : 'Capo dimmi tutto...'}
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <div className="pt-4 pb-2 border-t border-slate-100">
          <RestaurantSearch onSelect={setRestaurant} />
        </div>

        {/* NUOVA SEZIONE: Dettagli Extra (Vegetariano e Commento) */}
        <div className="pt-4 pb-2 border-t border-slate-100 space-y-6">
          {/* Toggle Vegetariano */}
          <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${isVegetarian ? 'bg-[#f4f7f3] border-[#d5e0d3]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
            <input 
              type="checkbox" 
              checked={isVegetarian} 
              onChange={(e) => setIsVegetarian(e.target.checked)} 
              className="w-5 h-5 text-[#5c7a52] rounded focus:ring-[#5c7a52]" 
            />
            <div>
              <p className={`font-bold flex items-center gap-2 ${isVegetarian ? 'text-[#3f5737]' : 'text-slate-700'}`}>
                🧆 Opzione Vegetariana (Falafel)
              </p>
              <p className={`text-xs ${isVegetarian ? 'text-[#5c7a52]' : 'text-slate-500'}`}>Contrassegna questa recensione come pasto vegetariano.</p>
            </div>
          </label>

          {/* Area Commento */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wide text-sm mb-2">
              Nota / Commento (Opzionale)
            </label>
            <textarea 
              rows={3} 
              placeholder="Es. Il pane era croccante e la salsa yogurt eccellente, ma troppa cipolla..." 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" 
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <ScoreGroup label="Location" value={scores.location} onChange={(v) => handleScoreChange('location', v)} />
          <ScoreGroup label="Menù" value={scores.offer} onChange={(v) => handleScoreChange('offer', v)} />
          <ScoreGroup label="Prezzo" value={scores.bill} onChange={(v) => handleScoreChange('bill', v)} />
          <ScoreGroup label="Gusto" value={scores.menu} onChange={(v) => handleScoreChange('menu', v)} />
        </div>

        <div className="bg-slate-50 p-6 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-200">
          <div className="text-center sm:text-left">
            <p className="text-slate-500 font-bold uppercase text-xs tracking-wider mb-1">Punteggio Finale</p>
            <p className="text-4xl font-black text-slate-800">
              {isVegetarian ? '🧆' : '🌯'} {average} <span className="text-xl text-slate-400 font-medium">/ 10</span>
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
                ${isAllVoted && restaurant && !isSubmitting ? 'bg-orange-600 hover:bg-orange-700 hover:shadow-lg' : 'bg-slate-300 cursor-not-allowed'}
              `}
              disabled={!isAllVoted || !restaurant || isSubmitting}
            >
              {isSubmitting ? 'Salvataggio...' : isEditMode ? 'Aggiorna Voto' : 'Salva Voto'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}