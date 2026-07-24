import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, MapPin, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';

// Fix per le icone di Leaflet che spariscono con Webpack/Vite
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

export default function MapPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRestaurants, setFilteredRestaurants] = useState<any[]>([]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('restaurants')
        .select('*');

      if (data) {
        // Pulizia coordinate invalide prima di salvarle nello stato
        const validRests = data.filter(r => !isNaN(Number(r.lat)) && !isNaN(Number(r.lng)));
        setRestaurants(validRests);
        setFilteredRestaurants(validRests);
      }
      setLoading(false);
    };
    fetchRestaurants();
  }, []);

  useEffect(() => {
    // Filtro case-insensitive per nome locale e città
    const lowerSearch = searchTerm.toLowerCase().trim();
    if (lowerSearch === '') {
      setFilteredRestaurants(restaurants);
    } else {
      const filtered = restaurants.filter(r => 
        r.name.toLowerCase().includes(lowerSearch) || 
        r.city.toLowerCase().includes(lowerSearch)
      );
      setFilteredRestaurants(filtered);
    }
  }, [searchTerm, restaurants]);

  // Posizione centrale di default: Italia (Roma)
  const centerPosition: [number, number] = [41.9028, 12.4964];

  return (
    <div className="space-y-6 mb-20 md:mb-8 animate-fade-in relative h-[calc(100vh-160px)]">
      
      {/* Barra di Ricerca Mappa */}
      <div className="absolute top-4 left-4 right-4 z-[1000] max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cerca locale o città..."
            className="w-full text-lg p-4 pl-12 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-lg"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin text-orange-500" size={48} />
        </div>
      ) : (
        <MapContainer center={centerPosition} zoom={6} scrollWheelZoom={true} className="w-full h-full rounded-2xl shadow-inner z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {filteredRestaurants.map(restaurant => (
            <Marker key={restaurant.id} position={[Number(restaurant.lat), Number(restaurant.lng)]}>
              <Popup className="kata-map-popup">
                <div className="p-1 space-y-2">
                  
                  {/* AGGIUNTO IL LINK AL LOCALE DALLA MAPPA */}
                  <Link 
                    to={`/restaurant/${restaurant.id}`} 
                    className="font-extrabold text-xl text-slate-800 hover:text-orange-600 transition-colors block"
                  >
                    {restaurant.name}
                  </Link>
                  
                  <p className="text-slate-600 flex items-center gap-1.5 text-sm !mt-1">
                    <MapPin size={14} className="text-orange-600"/> {restaurant.city}, {restaurant.country}
                  </p>
                  
                  <Link 
                    to={`/restaurant/${restaurant.id}`} 
                    className="inline-block mt-2 bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-orange-700 transition-colors shadow"
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