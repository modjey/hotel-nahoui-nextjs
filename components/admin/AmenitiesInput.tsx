"use client";

import { useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

interface AmenitiesInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  /** Suggestions cliquables (optionnel) */
  suggestions?: string[];
}

export function AmenitiesInput({
  value,
  onChange,
  placeholder = "Ajouter un équipement et appuyer sur Entrée",
  suggestions = [],
}: AmenitiesInputProps) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (value.some((a) => a.toLowerCase() === v.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, v]);
    setDraft("");
  };

  const remove = (item: string) => {
    onChange(value.filter((a) => a !== item));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      // Supprime le dernier tag si l'input est vide
      onChange(value.slice(0, -1));
    }
  };

  const remainingSuggestions = suggestions.filter(
    (s) => !value.some((a) => a.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 min-h-[44px] rounded-md border border-input bg-background p-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {value.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground text-xs px-2.5 py-1"
          >
            {item}
            <button
              type="button"
              onClick={() => remove(item)}
              className="hover:text-destructive transition"
              aria-label={`Retirer ${item}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[160px] bg-transparent outline-none text-sm py-1"
        />
      </div>

      {remainingSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted-foreground self-center mr-1">Suggestions :</span>
          {remainingSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border text-xs px-2 py-0.5 text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition"
            >
              <Plus className="h-3 w-3" /> {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
