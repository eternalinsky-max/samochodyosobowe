'use client';

export default function FilterPills({ options = [], value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            className={`pill ${active ? 'pill-active' : ''}`}
            onClick={() => onChange(active ? null : opt.value)}
          >
            {opt.label}
            {active ? <span className="pill-x">×</span> : null}
          </button>
        );
      })}
    </div>
  );
}


