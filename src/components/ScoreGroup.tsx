interface ScoreGroupProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export default function ScoreGroup({ label, value, onChange }: ScoreGroupProps) {
  // Generiamo un array di numeri da 1 a 10
  const scores = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-end mb-2">
        <label className="font-bold text-slate-700 uppercase tracking-wide text-sm">{label}</label>
        <span className="text-orange-600 font-extrabold text-lg">{value > 0 ? value : '-'}</span>
      </div>
      <div className="flex justify-between gap-1 sm:gap-2">
        {scores.map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`
              flex-1 py-3 rounded-md font-bold text-sm sm:text-base transition-all active:scale-95
              ${value === score 
                ? 'bg-orange-600 text-white shadow-md transform -translate-y-1' 
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}
            `}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}