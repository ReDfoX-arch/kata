import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, MapPin, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';
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

// Componente invisibile che gestisce il cambio di coordinate dinamico sulla mappa
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

export default function MapPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRestaurants, setFilteredRestaurants] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Coordinate di default (Hinterland Milanese)
  const [mapCenter, setMapCenter] = useState<[number, number]>([45.51, 9.21]); 
  const [mapZoom, setMapZoom] = useState(11);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      const { data } = await supabase.from('restaurants').select('*');
      if (data) {
        const validRests = data.filter(r => !isNaN(Number(r.lat)) && !isNaN(Number(r.lng)));
        setRestaurants(validRests);
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

  // Gestione del click su un risultato della ricerca
  const handleSelectRestaurant = (rest: any) => {
    setMapCenter([Number(rest.lat), Number(rest.lng)]);
    setMapZoom(16); // Super zoom sul locale!
    setSearchTerm(rest.name);
    setIsDropdownOpen(false);
  };

  return (
    <div className="space-y-6 mb-20 md:mb-8 animate-fade-in relative h-[calc(100vh-160px)]">
      
      {/* Barra di Ricerca Mappa (stile Autocomplete) */}
      <div className="absolute top-4 left-4 right-4 z-[1000] max-w-md mx-auto">
        <div className="relative">
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

          {/* Tendina dei risultati */}
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
                  <Link 
                    to={`/restaurant/${restaurant.id}`} 
                    className="inline-block mt-3 bg-orange-400 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-orange-500 transition-colors shadow-sm w-full text-center"
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