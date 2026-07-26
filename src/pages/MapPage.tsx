import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, MapPin, Search, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link, useNavigate } from 'react-router-dom';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

// Funzione matematica per calcolare la distanza in KM (Haversine)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Raggio della terra in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

export default function MapPage() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRestaurants, setFilteredRestaurants] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [mapCenter, setMapCenter] = useState<[number, number]>([45.51, 9.21]); 
  const [mapZoom, setMapZoom] = useState(11);
  const [findingKebab, setFindingKebab] = useState(false);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      const { data: rests } = await supabase.from('restaurants').select('*');
      const { data: revs } = await supabase.from('reviews').select('restaurant_id, average_score');
      
      if (rests) {
        const calculatedRests = rests.map(r => {
          const rRevs = revs?.filter(rev => rev.restaurant_id === r.id) || [];
          const avg = rRevs.length > 0 ? rRevs.reduce((acc, curr) => acc + Number(curr.average_score), 0) / rRevs.length : 0;
          return { ...r, avgScore: avg, validCoords: !isNaN(Number(r.lat)) && !isNaN(Number(r.lng)) };
        }).filter(r => r.validCoords);
        
        setRestaurants(calculatedRests);
      }
      setLoading(false);
    };
    fetchRestaurants();
  }, []);

  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase().trim();
    if (lowerSearch === '') {
      setFilteredRestaurants([]);
    } else {
      const filtered = restaurants.filter(r => 
        r.name.toLowerCase().includes(lowerSearch) || 
        r.city.toLowerCase().includes(lowerSearch)
      );
      setFilteredRestaurants(filtered);
    }
  }, [searchTerm, restaurants]);

  const handleSelectRestaurant = (rest: any) => {
    setMapCenter([Number(rest.lat), Number(rest.lng)]);
    setMapZoom(16);
    setSearchTerm(rest.name);
    setIsDropdownOpen(false);
  };

  const handleCapoHoFame = () => {
    if (!navigator.geolocation) {
      alert("Il tuo browser non supporta la geolocalizzazione.");
      return;
    }
    setFindingKebab(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        // Trova i ristoranti nel raggio di 15km con voto > 7
        const nearby = restaurants.map(r => {
          const dist = getDistanceFromLatLonInKm(userLat, userLng, Number(r.lat), Number(r.lng));
          return { ...r, distance: dist };
        }).filter(r => r.distance <= 15 && r.avgScore >= 7);

        if (nearby.length === 0) {
          alert("Nessun kebab raccomandato (voto >= 7) trovato nel raggio di 15km! 😭");
          setFindingKebab(false);
          return;
        }

        // Ordina per rapporto distanza/voto (più vicino e più alto è meglio)
        nearby.sort((a, b) => a.distance - b.distance);
        const bestChoice = nearby[0];

        setMapCenter([Number(bestChoice.lat), Number(bestChoice.lng)]);
        setMapZoom(17);
        setFindingKebab(false);
        
        // Popup custom
        if(window.confirm(`🔥 TROVATO! Il kebab più vicino e buono è ${bestChoice.name} (Voto: ${bestChoice.avgScore.toFixed(1)}) a soli ${bestChoice.distance.toFixed(1)} km da te! Vuoi aprire la pagina del ristorante?`)) {
           navigate(`/restaurant/${bestChoice.id}`);
        }

      },
      (error) => {
        console.error(error);
        alert("Impossibile ottenere la posizione. Assicurati di aver dato i permessi al browser.");
        setFindingKebab(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-6 mb-20 md:mb-8 animate-fade-in relative h-[calc(100vh-160px)]">
      
      {/* Barra di Ricerca Mappa */}
      <div className="absolute top-4 left-4 right-4 z-[1000] max-w-md mx-auto flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Cerca locale o città..."
            className="w-full text-lg p-4 pl-12 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-lg"
          />

          {isDropdownOpen && filteredRestaurants.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
              {filteredRestaurants.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleSelectRestaurant(r)}
                  className="w-full text-left p-3 hover:bg-orange-50 border-b border-slate-100 last:border-0 flex flex-col transition-colors"
                >
                  <span className="font-bold text-slate-800 truncate">{r.name}</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12}/> {r.city}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BOTTONE MAGICO: CAPO HO FAME */}
      <button 
        onClick={handleCapoHoFame}
        disabled={findingKebab}
        className="absolute bottom-6 right-4 z-[1000] bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-4 rounded-full font-black shadow-[0_8px_30px_rgb(234,88,12,0.4)] hover:shadow-[0_8px_30px_rgb(234,88,12,0.6)] hover:scale-105 transition-all flex items-center gap-3 border-2 border-white/20 disabled:opacity-50"
      >
        {findingKebab ? <Loader2 className="animate-spin" size={24} /> : <Navigation size={24} />}
        <span className="uppercase tracking-widest text-sm">{findingKebab ? 'Cerco...' : 'Capo, ho fame!'}</span>
      </button>

      {loading ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin text-orange-500" size={48} />
        </div>
      ) : (
        <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={true} className="w-full h-full rounded-2xl shadow-inner z-0">
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={mapCenter} zoom={mapZoom} />
          
          {restaurants.map(restaurant => (
            <Marker key={restaurant.id} position={[Number(restaurant.lat), Number(restaurant.lng)]}>
              <Popup className="kata-map-popup">
                <div className="p-1 space-y-2 text-center md:text-left">
                  <Link 
                    to={`/restaurant/${restaurant.id}`} 
                    className="font-extrabold text-xl text-slate-800 hover:text-orange-600 transition-colors block"
                  >
                    {restaurant.name}
                  </Link>
                  <p className="text-slate-600 flex items-center justify-center md:justify-start gap-1.5 text-sm !mt-1">
                    <MapPin size={14} className="text-orange-600"/> {restaurant.city}, {restaurant.country}
                  </p>
                  {restaurant.avgScore > 0 && (
                     <p className="text-xs font-bold text-slate-500 mt-1">Voto: 🌯 {restaurant.avgScore.toFixed(1)}</p>
                  )}
                  <Link 
                    to={`/restaurant/${restaurant.id}`} 
                    className="inline-block mt-3 bg-orange-600 !text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors shadow-sm w-full text-center"
                  >
                    Vedi Recensioni
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}
