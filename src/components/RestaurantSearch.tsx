import React, { useState } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

interface RestaurantSearchProps {
  onSelect: (restaurant: { name: string; city: string; country: string; lat: number; lng: number }) => void;
}

export default function RestaurantSearch({ onSelect }: RestaurantSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      // Chiamata API gratuita a Photon (OpenStreetMap)
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setResults(data.features || []);
    } catch (error) {
      console.error("Errore di ricerca:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (place: any) => {
    // Estrapoliamo i dati dal risultato della mappa
    const name = place.properties.name || 'Locale Senza Nome';
    const city = place.properties.city || place.properties.town || place.properties.village || 'Città non specificata';
    const country = place.properties.country || 'Nazione non specificata';
    const lat = place.geometry.coordinates[1];
    const lng = place.geometry.coordinates[0];

    setSelected(name);
    setResults([]); // Nascondiamo la lista dei risultati
    onSelect({ name, city, country, lat, lng });
  };

  return (
    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
      <label className="block font-bold text-slate-700 uppercase tracking-wide text-sm mb-3 flex items-center gap-2">
        <MapPin size={18} className="text-orange-600" /> Cerca il Locale
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
    </div>
  );
}