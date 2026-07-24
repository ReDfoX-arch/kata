import { Info as InfoIcon, Mail, GitCommit, Heart, ShieldAlert, Rocket, Code, Camera } from 'lucide-react';

export default function Info() {
  // Array statico per il Changelog. 
  // Aggiornalo tu manualmente con gli ultimi 10 commit quando fai un rilascio.
  const changelog = [
    { version: 'v1.3.0', date: '24/07/2026', message: 'Aggiunta pagina Info, crediti e logica versioning' },
    { version: 'v1.2.1', date: '24/07/2026', message: 'Risolto bug iframe mappa con URI encoding %2C' },
    { version: 'v1.2.0', date: '24/07/2026', message: 'Layout mobile mappa ristorante e hide controlli zoom' },
    { version: 'v1.1.5', date: '24/07/2026', message: 'Migliorata UI statistiche continenti visitati (x/7)' },
    { version: 'v1.1.0', date: '23/07/2026', message: 'Aggiunta ricerca case-insensitive e fix pulsante manuale' },
    { version: 'v1.0.5', date: '23/07/2026', message: 'Setup Supabase Storage per avatar pubblici globali' },
    { version: 'v1.0.1', date: '23/07/2026', message: 'Aggiunto Lazy Loading e Suspense per ottimizzazione chunk' },
    { version: 'v1.0.0', date: '22/07/2026', message: 'Primo rilascio KATA in produzione' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 mb-20 md:mb-8 animate-fade-in">
      <h2 className="text-3xl font-extrabold text-slate-800 flex items-center gap-2 mb-6">
        <InfoIcon className="text-blue-500" size={32} /> Info & Progetto
      </h2>

      {/* Descrizione Progetto */}
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-black text-slate-800 mb-3 flex items-center gap-2">
          <Rocket className="text-orange-600" size={24} /> Cos'è KATA?
        </h3>
        <p className="text-slate-600 leading-relaxed mb-4">
          <strong>KATA</strong> - Kebab Analizzati, Testati e Approvati nasce come l'hub definitivo per recensire, catalogare e scoprire i migliori locali. 
          Non è solo un'app di recensioni, ma uno strumento di analisi rigorosa basato su parametri chiari: Location, Menù, Conto e Gusto.
        </p>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-start gap-3">
          <ShieldAlert className="text-blue-500 shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-slate-500">
            Questa applicazione è in continuo sviluppo. La matematica dietro le medie e il sistema di ranking globale sono progettati per garantire la massima oggettività possibile nelle valutazioni.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Crediti & Contatti */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Heart className="text-red-500" size={20} /> Sviluppo & Crediti
          </h3>
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ideazione e Codice</p>
              <p className="font-black text-slate-800 text-lg">Marco Volpato</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Supporto Bug & Errori</p>
              <p className="text-sm text-slate-600 mb-2">
                Hai trovato un bug, la mappa non carica o hai un'idea geniale per una nuova feature? Scrivimi.
              </p>
              
              {/* MODIFICA QUI LA TUA MAIL */}
              <p className="font-mono text-sm text-slate-800 font-bold mb-3 select-all">
                mvolpato76@gmail.com
              </p>

              <a 
                href="mailto:mvolpato76@gmail.com?subject=Segnalazione%20Bug%20KATA" 
                className="inline-flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors"
              >
                <Mail size={16} /> Contatta lo sviluppatore
              </a>
            </div>
          </div>
        </div>

        {/* Prossimamente (Roadmap & Galleria) */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-md text-white flex flex-col">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Code size={20} /> In arrivo...
          </h3>
          <ul className="space-y-3 flex-1">
            <li className="flex items-center gap-2 text-sm font-medium">
              <div className="bg-white/20 p-1.5 rounded-md"><Camera size={16} /></div>
              Galleria fotografica ufficiale
            </li>
            <li className="flex items-center gap-2 text-sm font-medium">
              <div className="bg-white/20 p-1.5 rounded-md"><InfoIcon size={16} /></div>
              Sistema di Badges per i recensori
            </li>
            <li className="flex items-center gap-2 text-sm font-medium">
              <div className="bg-white/20 p-1.5 rounded-md"><Heart size={16} /></div>
              Salvataggio dei kebab preferiti
            </li>
          </ul>
          <p className="text-xs text-orange-200 mt-4 font-bold">Stay tuned.</p>
        </div>
      </div>

      {/* Changelog (Ultime 10 Versioni) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <GitCommit className="text-slate-500" size={20} /> Log Aggiornamenti
        </h3>
        <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
          {changelog.slice(0, 10).map((log, index) => (
            <div key={index} className="relative pl-6">
              {/* Pallino timeline */}
              <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${index === 0 ? 'bg-orange-500' : 'bg-slate-300'}`}></div>
              
              <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3 mb-1">
                <span className={`font-black ${index === 0 ? 'text-orange-600' : 'text-slate-700'}`}>
                  {log.version}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {log.date}
                </span>
              </div>
              <p className="text-sm text-slate-600">
                {log.message}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}