import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabase';
import { MapPin } from 'lucide-react';

// Risoluzione bug icone Leaflet in React
const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MapPage() {
  const [markers, setMarkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const { data: rests } = await supabase.from('restaurants').select('*');
        const { data: revs } = await supabase.from('reviews').select('*');

        if (rests && revs) {
          const mapData = rests.map(r => {
            const rRevs = revs.filter(rev => rev.restaurant_id === r.id);
            const avg = rRevs.length > 0 
              ? rRevs.reduce((acc, curr) => acc + Number(curr.average_score), 0) / rRevs.length 
              : 0;
            return { ...r, avgScore: avg.toFixed(1), reviewCount: rRevs.length };
          }).filter(r => r.reviewCount > 0); // BUG FIX: Nasconde i locali senza recensioni
          
          setMarkers(mapData);
        }
      } catch (error) {
        console.error("Errore mappa:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMapData();
  }, []);

  return (
    <div className="h-[calc(100vh-140px)] w-full rounded-xl overflow-hidden shadow-sm border border-slate-200 relative mb-20 md:mb-0">
      
      {/* Intestazione mobile sovrapposta */}
      <div className="absolute top-4 left-4 right-4 z-[400] bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md flex justify-between items-center md:hidden">
        <h2 className="font-extrabold flex items-center gap-2"><MapPin className="text-orange-600" size={20}/> Mappa Kebab</h2>
        <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded-full">{markers.length} Locali</span>
      </div>

      {loading ? (
        <div className="w-full h-full bg-slate-100 flex justify-center items-center font-bold text-slate-500 animate-pulse">
          Caricamento Mappa...
        </div>
      ) : (
        <MapContainer 
          center={[45.556, 9.218]} 
          zoom={12} 
          scrollWheelZoom={true} 
          className="w-full h-full z-10"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {markers.map((marker) => (
            <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={customIcon}>
              <Popup className="rounded-xl font-sans">
                <div className="text-center p-1">
                  <h3 className="font-extrabold text-sm text-slate-800 mb-1">{marker.name}</h3>
                  <p className="text-xs text-slate-500 mb-2">{marker.city}</p>
                  <div className="bg-orange-50 border border-orange-100 text-orange-800 rounded-lg py-1 px-3 inline-block font-black text-lg">
                    🌯 {marker.avgScore}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">
                    Basato su {marker.reviewCount} voti
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}