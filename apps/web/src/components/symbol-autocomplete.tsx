"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/change-value";

export type SymbolResult = { symbol: string; name: string; exchange: string };

const SYMBOL_SEARCH_DEBOUNCE_MS = 300;

/**
 * Symbol text input with a debounced /symbols/search suggestion list (Story 10.2).
 * Shared by the simulation order form and the portfolio transaction form; picking a
 * suggestion hands back symbol, name and exchange together.
 */
export function SymbolAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  placeholder,
  searchingLabel,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: SymbolResult) => void;
  placeholder: string;
  searchingLabel: string;
}) {
  const [suggestions, setSuggestions] = useState<SymbolResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/symbols/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Search request failed");
        const data: { results: SymbolResult[] } = await response.json();
        setSuggestions(data.results);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, SYMBOL_SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [value]);

  function select(result: SymbolResult) {
    onSelect(result);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <>
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next);
          setOpen(true);
          if (!next.trim()) setSuggestions([]);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
        required
      />
      {searching && <p className="absolute top-full mt-1 text-xs text-text-tertiary">{searchingLabel}</p>}
      {open && suggestions.length > 0 && (
        <ul className="absolute top-full z-10 mt-1 flex w-full max-w-xs flex-col divide-y divide-border-subtle overflow-hidden rounded-md border border-border-default bg-surface-elevated shadow-xl shadow-black/40">
          {suggestions.map((result) => (
            <li key={`${result.exchange}-${result.symbol}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(result)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover"
              >
                <Badge>{result.exchange}</Badge>
                <strong className="font-semibold text-text-primary">{result.symbol}</strong>
                <span className="truncate text-text-secondary">{result.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
