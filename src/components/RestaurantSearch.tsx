import { useState, useEffect } from 'react';
import { Search, MapPin, Plus, Loader2, AlertCircle, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix per le icone di Leaflet
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Sottocomponente per catturare i click sulla mappa
function LocationPicker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Sottocomponente per spostare la mappa se l'utente incolla le coordinate
function MapCenterUpdater({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 16); // Vola sul punto con un bello zoom
    }
  }, [center, map]);
  return null;
}

interface RestaurantSearchProps {
  onSelect: (restaurant: { name: string; city: string; country: string; lat: number; lng: number; closing_time?: string }) => void;
}

export default function RestaurantSearch({ onSelect }: RestaurantSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const [dbResults, setDbResults] = useState<any[]>([]);
  const [isSearchingDB, setIsSearchingDB] = useState(false);
  
  const [externalResults, setExternalResults] = useState<any[]>([]);
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  
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
    const term = searchTerm.trim();
    if (term.length < 2 || isManual || selectedRest?.name === term) {
      setDbResults([]);
      setExternalResults([]);
      setIsSearchingDB(false);
      setIsSearchingExternal(false);
      return;
    }

    const performSearch = async () => {
      setIsSearchingDB(true);
      const { data: localData } = await supabase
        .from('restaurants')
        .select('*')
        .ilike('name', `%${term}%`)
        .limit(5);
      
      if (localData) setDbResults(localData);
      setIsSearchingDB(false);

      if (term.length >= 3) {
        setIsSearchingExternal(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(term)}&format=json&addressdetails=1&accept-language=en&limit=5`);
          const extData = await res.json();
          
          const formattedExt = extData
            .filter((item: any) => item.name)
            .map((item: any) => ({
              id: `ext-${item.place_id}`,
              name: item.name,
              city: item.address?.city || item.address?.town || item.address?.village || item.address?.municipality || item.address?.county || 'Sconosciuta',
              country: item.address?.country || 'Sconosciuto',
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              isExternal: true
            }));
            
          setExternalResults(formattedExt);
        } catch (err) {
          console.error("Errore ricerca mappe esterne:", err);
        } finally {
          setIsSearchingExternal(false);
        }
      } else {
        setExternalResults([]);
      }
    };

    const delay = setTimeout(performSearch, 500);
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

  const handleSelectRest = (rest: any) => {
    setSelectedRest(rest);
    setSearchTerm(rest.name);
    setDbResults([]);
    setExternalResults([]);
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
      setError('Formato coordinate errato. Clicca sulla mappa o incolla da Google Maps.');
      return;
    }
    const lat = parseFloat(coordsMatch[1]);
    const lng = parseFloat(coordsMatch[2]);
    if (isNaN(lat) || isNaN(lng)) {
      setError('Le coordinate non sono numericamente valide.');
      return;
    }

    const newRest = { name: manualName.trim(), city: selectedCity, country: selectedCountry, lat, lng };
    setSelectedRest(newRest);
    setSearchTerm(newRest.name);
    setIsManual(false);
    onSelect(newRest);
  };

  const resetSearch = () => {
    setSearchTerm('');
    setSelectedRest(null);
    setDbResults([]);
    setExternalResults([]);
    setIsManual(false);
    setManualName('');
    setCityQuery('');
    setSelectedCity('');
    setSelectedCountry('');
    setManualCoords('');
  };

  const isSearching = isSearchingDB || isSearchingExternal;
  const hasResults = dbResults.length > 0 || externalResults.length > 0;

  // Estrazione coordinate per visualizzare il PIN sulla mappa manuale
  let markerPos: [number, number] | null = null;
  if (manualCoords) {
    const coordsMatch = manualCoords.match(/(-?\d+\.\d+)[\s,;]+(-?\d+\.\d+)/);
    if (coordsMatch) {
      markerPos = [parseFloat(coordsMatch[1]), parseFloat(coordsMatch[2])];
    }
  }

  // Centro default (Hinterland Milanese / Cusano Milanino)
  const defaultMapCenter: [number, number] = [45.55, 9.18];

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
              className="w-full text-lg p-4 pl-12 pr-12 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all shadow-sm disabled:bg-slate-50"
              disabled={isManual || selectedRest !== null}
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-orange-500" size={20} />
            )}
          </div>
          {selectedRest && (
            <button onClick={resetSearch} className="p-4 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl border border-slate-200 transition-colors font-bold">
              Cambia
            </button>
          )}
        </div>

        {!isManual && !selectedRest && hasResults && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-80 overflow-y-auto">
            {dbResults.length > 0 && (
              <div className="bg-orange-50/50">
                <div className="px-4 py-2 text-[10px] font-bold text-orange-600 uppercase tracking-wider bg-orange-100/50">Dal database KATA</div>
                {dbResults.map((rest) => (
                  <button
                    key={rest.id}
                    type="button"
                    onClick={() => handleSelectRest(rest)}
                    className="w-full text-left p-4 hover:bg-orange-50 border-b border-slate-100 last:border-0 flex flex-col transition-colors"
                  >
                    <span className="font-bold text-slate-800">{rest.name}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-orange-500" /> {rest.city}, {rest.country}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {externalResults.length > 0 && (
              <div>
                <div className="px-4 py-2 text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50">Da OpenStreetMap</div>
                {externalResults.map((rest) => (
                  <button
                    key={rest.id}
                    type="button"
                    onClick={() => handleSelectRest(rest)}
                    className="w-full text-left p-4 hover:bg-blue-50 border-b border-slate-100 last:border-0 flex flex-col transition-colors"
                  >
                    <span className="font-bold text-slate-800">{rest.name}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Globe size={12} className="text-blue-500" /> {rest.city}, {rest.country}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pulsante per inserimento manuale SEMPRE VISIBILE finché non c'è un locale selezionato */}
      {!isManual && !selectedRest && (
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in mt-4">
          <p className="text-sm text-orange-800 font-medium">Vuoi inserire un locale che non compare nella ricerca?</p>
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

            {/* SEZIONE COORDINATE UNIFICATE + MAPPA INTERATTIVA */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Coordinate Geografiche</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="flex flex-col justify-center">
                  <input
                    type="text"
                    placeholder="Es. 45.557699, 9.214915"
                    value={manualCoords}
                    onChange={(e) => setManualCoords(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white"
                  />
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                    Puoi incollare qui le coordinate di Google Maps, oppure molto più semplicemente... <br/>
                    <span className="font-bold text-orange-600">📍 Clicca sulla mappa qui a fianco</span> per posizionare il pin ed estrarle in automatico!
                  </p>
                </div>

                <div className="h-48 w-full rounded-xl overflow-hidden border border-slate-300 shadow-inner relative z-0">
                  <MapContainer center={markerPos || defaultMapCenter} zoom={13} scrollWheelZoom={true} className="w-full h-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPicker onLocationSelect={(lat, lng) => setManualCoords(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)} />
                    <MapCenterUpdater center={markerPos} />
                    {markerPos && <Marker position={markerPos} />}
                  </MapContainer>
                </div>

              </div>
            </div>

          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-200 mt-2">
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