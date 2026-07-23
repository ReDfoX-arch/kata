import React, { useState } from 'react';
import { Search, MapPin, Loader2, PlusCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RestaurantSearchProps {
  onSelect: (restaurant: { name: string; city: string; country: string; lat: number; lng: number }) => void;
}

export default function RestaurantSearch({ onSelect }: RestaurantSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState({ name: '', city: '', country: '', lat: '', lng: '' });
  const [error, setError] = useState('');

  const normalize = (s: string) => s ? s.trim().toLowerCase() : '';

  const handleSearch = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      // 1) Cerca nei ristoranti custom già salvati nel DB (case-insensitive, partial match)
      const { data: localMatches } = await supabase
        .from('restaurants')
        .select('id,name,city,country,lat,lng')
        .ilike('name', `%${query}%`)
        .limit(10);

      const mappedLocal = (localMatches || []).map((r: any) => ({
        source: 'local',
        id: r.id,
        properties: { name: r.name, city: r.city, country: r.country },
        geometry: { coordinates: [r.lng, r.lat] }
      }));

      // 2) Chiamata API gratuita a Photon (OpenStreetMap) con limite più ampio
      let remoteResults: any[] = [];
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10`);
        const data = await res.json();
        remoteResults = data.features || [];
      } catch (err) {
        console.warn('Photon search failed', err);
      }

      // 3) Unisci e deduplica per nome+coords
      const combined = [...mappedLocal, ...remoteResults];
      const seen = new Set<string>();
      const final: any[] = [];
      for (const item of combined) {
        const name = item.properties?.name || item.properties?.name || 'Senza Nome';
        const coords = item.geometry?.coordinates || [0,0];
        const key = `${normalize(name)}|${coords[0]||0}|${coords[1]||0}`;
        if (!seen.has(key)) {
          seen.add(key);
          final.push(item);
        }
      }

      setResults(final);

      // Se non troviamo nulla, apri possibilità di aggiunta manuale
      if (final.length === 0) setManualOpen(true);

    } catch (error) {
      console.error('Errore di ricerca:', error);
      setError('Errore durante la ricerca. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (place: any) => {
    // Estrapoliamo i dati dal risultato della mappa o dal DB
    const name = place.properties?.name || 'Locale Senza Nome';
    const city = place.properties?.city || place.properties?.town || place.properties?.village || 'Città non specificata';
    const country = place.properties?.country || 'Nazione non specificata';
    const lat = place.geometry.coordinates[1];
    const lng = place.geometry.coordinates[0];

    setSelected(name);
    setResults([]); // Nascondiamo la lista dei risultati
    setManualOpen(false);
    onSelect({ name, city, country, lat, lng });
  };

  const handleManualSubmit = async () => {
    setError('');
    const name = manual.name.trim();
    if (!name) { setError('Inserisci un nome.'); return; }
    const lat = parseFloat(manual.lat);
    const lng = parseFloat(manual.lng);
    if (isNaN(lat) || isNaN(lng)) { setError('Coordinate non valide. Usa valori numerici per lat e lng.'); return; }

    try {
      // Inseriamo il ristorante nel DB e lo selezioniamo
      const { data: newRest, error: insertErr } = await supabase
        .from('restaurants')
        .insert({ name: manual.name, city: manual.city || '', country: manual.country || '', lat, lng })
        .select('id,name,city,country,lat,lng')
        .single();

      if (insertErr) throw insertErr;

      // Costruiamo un oggetto simile al risultato map e selezioniamo
      const obj = {
        source: 'local',
        id: newRest.id,
        properties: { name: newRest.name, city: newRest.city, country: newRest.country },
        geometry: { coordinates: [newRest.lng, newRest.lat] }
      };

      handleSelect(obj);

    } catch (err: any) {
      console.error('Errore inserimento manuale:', err);
      setError('Errore durante l\'aggiunta manuale. Riprova.');
    }
  };

  return (
    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
      <label className="block font-bold text-slate-700 uppercase tracking-wide text-sm mb-3 flex items-center gap-2">
        <MapPin size={18} className="text-orange-600" /> Cerca il Kebabbaro
      </label>
      
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
          placeholder="Es. Magdy2 Sesto San Giovanni..."
          className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-800"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="bg-slate-800 text-white px-5 rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
        </button>
      </div>

      {selected && (
        <div className="mt-4 flex items-center gap-2 text-green-800 bg-green-50 p-3 rounded-lg text-sm font-medium border border-green-200">
          <span>✅</span> Selezionato: {selected}
        </div>
      )}

      {results.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden bg-white shadow-md">
          {results.map((r, i) => (
            <li
              key={i}
              onClick={() => handleSelect(r)}
              className="p-4 hover:bg-slate-50 cursor-pointer transition-colors text-sm group"
            >
              <div className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                {r.properties.name || 'Senza Nome'}
              </div>
              <div className="text-slate-500 text-xs mt-1">
                {r.properties.street && `${r.properties.street}, `}
                {r.properties.city || r.properties.town || r.properties.village}, {r.properties.country}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal / Form aggiunta manuale */}
      {manualOpen && (
        <div className="mt-4 border border-slate-100 rounded-lg p-4 bg-slate-50">
          <h4 className="font-bold mb-2">Aggiungi luogo manualmente</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input placeholder="Nome" value={manual.name} onChange={(e)=>setManual({...manual, name: e.target.value})} className="p-2 border rounded" />
            <input placeholder="Città" value={manual.city} onChange={(e)=>setManual({...manual, city: e.target.value})} className="p-2 border rounded" />
            <input placeholder="Paese" value={manual.country} onChange={(e)=>setManual({...manual, country: e.target.value})} className="p-2 border rounded" />
            <input placeholder="Latitudine" value={manual.lat} onChange={(e)=>setManual({...manual, lat: e.target.value})} className="p-2 border rounded" />
            <input placeholder="Longitudine" value={manual.lng} onChange={(e)=>setManual({...manual, lng: e.target.value})} className="p-2 border rounded" />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleManualSubmit} className="bg-orange-600 text-white px-4 py-2 rounded">Aggiungi e Seleziona</button>
            <button onClick={() => setManualOpen(false)} className="px-4 py-2 rounded border">Annulla</button>
          </div>
        </div>
      )}
    </div>
  );
}