// Row of seven day-letter buttons (M T W TH F SA SU) used by /plates.
// `selected` is the 0..6 day index, or null when no day has been chosen yet.

"use client";

import { DAY_PICKER } from "@/app/_lib/meals";

interface Props {
  selected: number | null;
  onSelect: (i: number) => void;
}

export function DayPicker({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {DAY_PICKER.map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => onSelect(i)}
          className={`fh-pill ${selected === i ? "fh-pill-active" : ""}`}
          aria-pressed={selected === i}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
