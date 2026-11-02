"use client";

export type OptionValueRow = { value: string; stock: number };

export function OptionValuesEditor({
  rows,
  onChange,
  valuePlaceholder,
}: {
  rows: OptionValueRow[];
  onChange: (rows: OptionValueRow[]) => void;
  valuePlaceholder?: string;
}) {
  function updateRow(index: number, patch: Partial<OptionValueRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function moveRow(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addRow() {
    onChange([...rows, { value: "", stock: 0 }]);
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex shrink-0 flex-col gap-0.5">
            <button
              type="button"
              disabled={i === 0}
              onClick={() => moveRow(i, -1)}
              aria-label="Monter"
              className="flex h-4 w-5 items-center justify-center rounded border border-white/10 text-[10px] leading-none text-neutral-300 hover:border-accent hover:text-accent disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              disabled={i === rows.length - 1}
              onClick={() => moveRow(i, 1)}
              aria-label="Descendre"
              className="flex h-4 w-5 items-center justify-center rounded border border-white/10 text-[10px] leading-none text-neutral-300 hover:border-accent hover:text-accent disabled:opacity-30"
            >
              ↓
            </button>
          </div>
          <input
            value={row.value}
            onChange={(e) => updateRow(i, { value: e.target.value })}
            placeholder={valuePlaceholder ?? "Valeur"}
            className="flex-1 rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
          />
          <input
            type="number"
            min={0}
            step={1}
            value={row.stock}
            onChange={(e) => updateRow(i, { stock: Number(e.target.value) })}
            placeholder="Stock"
            className="w-20 rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={() => removeRow(i)}
            aria-label="Retirer cette valeur"
            className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-xs text-neutral-400 hover:border-red-400 hover:text-red-400"
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" onClick={addRow} className="text-xs font-semibold text-accent hover:underline">
        + Ajouter une valeur
      </button>
    </div>
  );
}
