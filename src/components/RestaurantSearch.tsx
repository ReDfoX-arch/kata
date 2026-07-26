import { useState, useEffect } from 'react';
import { Search, MapPin, Plus, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RestaurantSearchProps {
  onSelect: (restaurant: { name: string; city: string; country: string; lat: number; lng: number; closing_time?: string }) => void;
}

export default function RestaurantSearch({ onSelect }: RestaurantSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dbResults, setDbResults] = useState<any[]>([]);
  
  // Questa è la variabile che causava l'errore. Ora la usiamo per la rotellina!
  const [isSearchingDB, setIsSearchingDB] = useState(false);
  
  const [selectedRest, setSelectedRest] = useState<any>(null);

  const [isManual, setIsManual] = useState(false);
  const [manualName, setManualName] = useState('');
  
  const [cityQuery, setCityQuery] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const [manualCoords, setManualCoords] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchTerm.trim().length < 2 || isManual || selectedRest?.name === searchTerm) {
      setDbResults([]);
      setIsSearchingDB(false);
      return;
    }

    const searchDB = async () => {
      setIsSearchingDB(true);
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .limit(5);
      
      if (data) setDbResults(data);
      setIsSearchingDB(false);
    };

    const delay = setTimeout(searchDB, 300);
    return () => clearTimeout(delay);
  }, [searchTerm, isManual, selectedRest]);

  useEffect(() => {
    if (!isManual || cityQuery.trim().length < 3 || cityQuery === selectedCity) {
      setCitySuggestions([]);
      return;
    }

    const searchCities = async () => {
      setIsSearchingCity(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityQuery)}&format=json&addressdetails=1&accept-language=en&featuretype=settlement`);
        const data = await res.json();
        
        const uniqueCities: any[] = [];
        const seen = new Set();
        
        for (const item of data) {
          const city = item.address.city || item.address.town || item.address.village || item.address.municipality || item.name;
          const country = item.address.country;
          
          if (city && country) {
            const key = `${city}-${country}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueCities.push({ city, country });
            }
          }
        }
        setCitySuggestions(uniqueCities);
        setShowCityDropdown(true);
      } catch (err) {
        console.error("Errore ricerca città:", err);
      } finally {
        setIsSearchingCity(false);
      }
    };

    const delay = setTimeout(searchCities, 400);
    return () => clearTimeout(delay);
  }, [cityQuery, isManual, selectedCity]);

  const handleSelectDbRest = (rest: any) => {
    setSelectedRest(rest);
    setSearchTerm(rest.name);
    setDbResults([]);
    onSelect(rest);
  };

  const handleSelectCity = (city: string, country: string) => {
    setSelectedCity(city);
    setSelectedCountry(country);
    setCityQuery(city);
    setShowCityDropdown(false);
  };

  const handleAddManual = () => {
    setError('');
    
    if (!manualName.trim() || !selectedCity || !selectedCountry || !manualCoords.trim()) {
      setError('Compila tutti i campi e seleziona la città dai suggerimenti.');
      return;
    }

    const coordsMatch = manualCoords.match(/(-?\d+\.\d+)[\s,;]+(-?\d+\.\d+)/);

    if (!coordsMatch) {
      setError('Formato coordinate errato. Copia e incolla da Google Maps (es. 45.557, 9.214).');
      return;
    }

    const lat = parseFloat(coordsMatch[1]);
    const lng = parseFloat(coordsMatch[2]);

    if (isNaN(lat) || isNaN(lng)) {
      setError('Le coordinate non sono numericamente valide.');
      return;
    }

    const newRest = {
      name: manualName.trim(),
      city: selectedCity,
      country: selectedCountry,
      lat,
      lng
    };

    setSelectedRest(newRest);
    setSearchTerm(newRest.name);
    setIsManual(false);
    onSelect(newRest);
  };

  const resetSearch = () => {
    setSearchTerm('');
    setSelectedRest(null);
    setDbResults([]);
    setIsManual(false);
    setManualName('');
    setCityQuery('');
    setSelectedCity('');
    setSelectedCountry('');
    setManualCoords('');
  };

  return (
    <div className="w-full space-y-4">
      <label className="flex items-center gap-2 font-bold text-slate-700 uppercase tracking-wide text-sm mb-2">
        <MapPin size={16} className="text-orange-500" /> Cerca il Kebabbaro
      </label>

      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (selectedRest) setSelectedRest(null);
              }}
              placeholder="Es. Magdy2 Sesto San Giovanni..."
              /* Aggiunto pr-12 per non far accavallare il testo con lo spinner */
              className="w-full text-lg p-4 pl-12 pr-12 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all shadow-sm disabled:bg-slate-50"
              disabled={isManual || selectedRest !== null}
            />
            {/* FIX: Usiamo finalmente la variabile per mostrare la rotellina! */}
            {isSearchingDB && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-orange-500" size={20} />
            )}
          </div>
          {selectedRest && (
            <button onClick={resetSearch} className="p-4 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl border border-slate-200 transition-colors font-bold">
              Cambia
            </button>
          )}
        </div>

        {!isManual && !selectedRest && dbResults.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            {dbResults.map((rest) => (
              <button
                key={rest.id}
                type="button"
                onClick={() => handleSelectDbRest(rest)}
                className="w-full text-left p-4 hover:bg-orange-50 border-b border-slate-100 last:border-0 flex flex-col transition-colors"
              >
                <span className="font-bold text-slate-800">{rest.name}</span>
                <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin size={12} /> {rest.city}, {rest.country}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!isManual && !selectedRest && searchTerm.length >= 2 && dbResults.length === 0 && !isSearchingDB && (
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <p className="text-sm text-orange-800 font-medium">Non trovi il locale? Aggiungilo tu al database KATA.</p>
          <button
            type="button"
            onClick={() => setIsManual(true)}
            className="shrink-0 flex items-center gap-2 bg-white text-orange-600 px-4 py-2 rounded-lg font-bold border border-orange-200 hover:bg-orange-600 hover:text-white transition-colors"
          >
            <Plus size={16} /> Aggiungi Manualmente
          </button>
        </div>
      )}

      {isManual && (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4 animate-fade-in">
          <h3 className="font-extrabold text-slate-800 mb-4 flex items-center gap-2">
            <Plus size={20} className="text-orange-600"/> Aggiungi luogo manualmente
          </h3>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg flex items-center gap-2 border border-red-200">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Nome Locale</label>
              <input
                type="text"
                placeholder="Es. MAVI Istanbul"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Città</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Inizia a scrivere... (Es. Mila)"
                    value={cityQuery}
                    onChange={(e) => {
                      setCityQuery(e.target.value);
                      setShowCityDropdown(true);
                      if (selectedCity) { setSelectedCity(''); setSelectedCountry(''); }
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none pr-10 ${selectedCity ? 'bg-green-50 border-green-200 text-green-800 font-bold' : 'bg-white border-slate-200'}`}
                  />
                  {isSearchingCity && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" size={16} />}
                </div>

                {showCityDropdown && citySuggestions.length > 0 && (
                  <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                    {citySuggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectCity(sug.city, sug.country)}
                        className="w-full text-left p-3 hover:bg-orange-50 border-b border-slate-100 last:border-0"
                      >
                        <span className="font-bold text-slate-800">{sug.city}</span>
                        <span className="text-xs text-slate-500 block">{sug.country}</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-slate-500 mt-1">Seleziona la città dal menu a tendina.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Paese</label>
                <input
                  type="text"
                  placeholder="Seleziona la città prima"
                  value={selectedCountry}
                  readOnly
                  className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Coordinate Geografiche</label>
              <input
                type="text"
                placeholder="Es. 45.5576999, 9.2149159"
                value={manualCoords}
                onChange={(e) => setManualCoords(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                Copia e incolla da Google Maps. <br/>
                <span className="text-orange-600 font-bold">Formato richiesto:</span> Latitudine, Longitudine. Usa la <span className="font-bold border-b border-orange-300">VIRGOLA</span> per separare le due coordinate, e il <span className="font-bold border-b border-orange-300">PUNTO</span> per i decimali.
              </p>
            </div>

          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleAddManual}
              className="flex-1 bg-orange-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-orange-700 transition-colors shadow-sm"
            >
              Conferma e Seleziona
            </button>
            <button
              type="button"
              onClick={() => setIsManual(false)}
              className="px-6 py-3 rounded-lg font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {selectedRest && !isManual && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center justify-between animate-fade-in">
          <div>
            <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Locale Selezionato</p>
            <p className="font-black text-green-900 text-lg">{selectedRest.name}</p>
            <p className="text-sm text-green-700 flex items-center gap-1"><MapPin size={14}/> {selectedRest.city}, {selectedRest.country}</p>
          </div>
        </div>
      )}
    </div>
  );
}