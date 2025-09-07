import React from "react";

type Mode = "cheapest" | "fastest" | "easiest";

interface PlanningModeToggleProps {
  value: Mode;
  onChange: (mode: Mode) => void;
  className?: string;
}

export default function PlanningModeToggle({
  value,
  onChange,
  className = ""
}: PlanningModeToggleProps) {
  const modes: {key: Mode; label: string; hint: string; icon: string}[] = [
    { 
      key: "cheapest", 
      label: "Cheapest", 
      hint: "Save the most money",
      icon: "💰"
    },
    { 
      key: "fastest",  
      label: "Fastest",  
      hint: "Min time in transit",
      icon: "⚡"
    },
    { 
      key: "easiest",  
      label: "Easiest",  
      hint: "Lowest hassle",
      icon: "😌"
    }
  ];

  return (
    <div className={`flex gap-2 rounded-xl p-1 bg-neutral-100 ${className}`}>
      {modes.map(m => {
        const active = value === m.key;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onChange(m.key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm transition-all duration-200
              ${active 
                ? "bg-purple-100 shadow-sm font-semibold text-purple-800 border border-purple-200" 
                : "opacity-70 hover:opacity-90 text-gray-600"
              }`}
            aria-pressed={active}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-base">{m.icon}</span>
              <span>{m.label}</span>
            </div>
            <div className="text-xs opacity-70">{m.hint}</div>
          </button>
        );
      })}
    </div>
  );
}
