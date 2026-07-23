import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Map as MapIcon, Home as HomeIcon, Trophy, BarChart2, PlusCircle } from 'lucide-react';
import { useState } from 'react';

import ProfileSetup from './components/ProfileSetup';
import Home from './pages/Home';
import MapPage from './pages/MapPage';
import AddReview from './pages/AddReview';
import Rankings from './pages/Rankings';
import Stats from './pages/Stats';
import RestaurantPage from './pages/RestaurantPage';
import UserPage from './pages/UserPage';

function App() {
  const [hasProfile, setHasProfile] = useState(
    localStorage.getItem('kata_profile') !== null
  );

  if (!hasProfile) {
    return <ProfileSetup onComplete={() => setHasProfile(true)} />;
  }
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 md:pb-0">
        
        {/* Header Desktop */}
        <header className="bg-white shadow-sm hidden md:block sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <img src="/pwa-192x192.png" alt="KATA Logo" className="w-14 h-14 rounded-lg shadow-sm" />
              <div className="flex flex-col justify-center">
                {/* Titolo principale (nota il leading-none per stringere lo spazio col sottotitolo) */}
                <h1 className="font-extrabold text-3xl tracking-tight text-orange-600 leading-none">
                  KATA
                </h1>
                {/* Sottotitolo: piccolo, maiuscolo, spaziato e grigio per un look elegante e tecnico */}
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  KATA - Kebab Analizzati, Testati e Approvati
                </span>
              </div>
            </Link>
            <nav className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 hover:text-orange-600 font-medium transition-colors"><HomeIcon size={20} /> Home</Link>
              <Link to="/map" className="flex items-center gap-2 hover:text-orange-600 font-medium transition-colors"><MapIcon size={20} /> Mappa</Link>
              <Link to="/rankings" className="flex items-center gap-2 hover:text-orange-600 font-medium transition-colors"><Trophy size={20} /> Classifica</Link>
              <Link to="/stats" className="flex items-center gap-2 hover:text-orange-600 font-medium transition-colors"><BarChart2 size={20} /> Statistiche</Link>
              
              {/* NUOVO PULSANTE DESKTOP QUI */}
              <Link to="/add" className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-700 transition-colors flex items-center gap-2 shadow-sm">
                <PlusCircle size={18} /> Nuova
              </Link>
            </nav>
          </div>
        </header>
        {/* Header Mobile */}
        <header className="bg-white shadow-sm md:hidden sticky top-0 z-50">
          <div className="px-4 h-16 flex items-center justify-center">
            <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img src="/pwa-192x192.png" alt="KATA Logo" className="w-10 h-10 rounded-lg shadow-sm" />
              <div className="flex flex-col justify-center">
                <h1 className="font-extrabold text-2xl tracking-tight text-orange-600 leading-none">
                  KATA
                </h1>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                  Kebab Analizzati, Testati e Approvati
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Contenuto Principale */}
        <main className="max-w-5xl mx-auto w-full p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/add" element={<AddReview />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/restaurant/:id" element={<RestaurantPage />} />
            <Route path="/user/:username" element={<UserPage />} />
          </Routes>
        </main>

        {/* Pulsante Aggiungi Mobile (Galleggiante) */}
        <div className="md:hidden fixed bottom-20 right-4 z-50">
          <Link to="/add">
            <button className="bg-orange-600 text-white p-4 rounded-full shadow-lg hover:bg-orange-700 transition-colors">
              <PlusCircle size={28} />
            </button>
          </Link>
        </div>

        {/* Navbar Mobile */}
        <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around items-center h-16 z-50 pb-safe">
          <Link to="/" className="flex flex-col items-center text-slate-500 hover:text-orange-600"><HomeIcon size={24} /><span className="text-[10px] mt-1 font-medium">Home</span></Link>
          <Link to="/map" className="flex flex-col items-center text-slate-500 hover:text-orange-600"><MapIcon size={24} /><span className="text-[10px] mt-1 font-medium">Mappa</span></Link>
          <Link to="/rankings" className="flex flex-col items-center text-slate-500 hover:text-orange-600"><Trophy size={24} /><span className="text-[10px] mt-1 font-medium">Top</span></Link>
          <Link to="/stats" className="flex flex-col items-center text-slate-500 hover:text-orange-600"><BarChart2 size={24} /><span className="text-[10px] mt-1 font-medium">Stats</span></Link>
        </nav>

      </div>
    </Router>
  );
}

export default App;