"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  clearHiddenForVista,
  hideCategoryForVista,
  isVistaConTabs,
  loadHiddenCategories,
} from "@/lib/hidden-categories";
import type { TransactionRow, VistaVer } from "@/lib/finance";

type Props = {
  mes: string;
  ver: VistaVer;
  activeCat: string | undefined;
  presets: readonly string[];
  rowsInVista: TransactionRow[];
};

export function CategoryTabs({
  mes,
  ver,
  activeCat,
  presets,
  rowsInVista,
}: Props) {
  const router = useRouter();
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    if (!isVistaConTabs(ver)) return;
    setHidden(loadHiddenCategories()[ver] ?? []);
  }, [ver]);

  const extraSorted = useMemo(() => {
    const extra = new Set<string>();
    for (const t of rowsInVista) {
      if (!presets.includes(t.categoria)) {
        extra.add(t.categoria);
      }
    }
    return [...extra].sort((a, b) => a.localeCompare(b, "es"));
  }, [rowsInVista, presets]);

  const visiblePresets = useMemo(
    () => presets.filter((p) => !hidden.includes(p)),
    [presets, hidden],
  );
  const visibleExtras = useMemo(
    () => extraSorted.filter((p) => !hidden.includes(p)),
    [extraSorted, hidden],
  );

  const base = `/dashboard?mes=${encodeURIComponent(mes)}&ver=${ver}`;
  const tabClass = (on: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-medium transition ${
      on
        ? "bg-emerald-600 text-white"
        : "bg-foreground/10 text-foreground/70 hover:bg-foreground/15"
    }`;

  function removeTab(e: React.MouseEvent, name: string) {
    e.preventDefault();
    e.stopPropagation();
    if (
      !confirm(
        `¿Quitar "${name}" de las pestañas?\n\nLos movimientos siguen apareciendo en "Todos". Podés volver a mostrarlas con "Restablecer pestañas".`,
      )
    ) {
      return;
    }
    if (!isVistaConTabs(ver)) return;
    hideCategoryForVista(ver, name);
    setHidden((h) => [...new Set([...h, name])]);
    if (activeCat === name) {
      router.replace(base);
    }
  }

  function restoreTabs() {
    if (!isVistaConTabs(ver)) return;
    clearHiddenForVista(ver);
    setHidden([]);
  }

  const canDismiss = isVistaConTabs(ver);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-foreground/45 mr-1 text-[11px] uppercase">
          Categoría
        </span>
        <Link href={base} prefetch className={tabClass(!activeCat)}>
          Todos
        </Link>
        {visiblePresets.map((p) => (
          <span key={p} className="inline-flex items-center gap-0.5">
            <Link
              href={`${base}&cat=${encodeURIComponent(p)}`}
              prefetch
              className={tabClass(activeCat === p)}
            >
              {p}
            </Link>
            {canDismiss ? (
              <button
                type="button"
                title={`Quitar "${p}" de las pestañas`}
                aria-label={`Quitar pestaña ${p}`}
                className="text-foreground/35 hover:bg-red-500/15 hover:text-red-400 rounded p-0.5 leading-none"
                onClick={(e) => removeTab(e, p)}
              >
                ×
              </button>
            ) : null}
          </span>
        ))}
        {visibleExtras.map((p) => (
          <span key={`x-${p}`} className="inline-flex items-center gap-0.5">
            <Link
              href={`${base}&cat=${encodeURIComponent(p)}`}
              prefetch
              className={tabClass(activeCat === p)}
            >
              {p}
            </Link>
            {canDismiss ? (
              <button
                type="button"
                title={`Quitar "${p}" de las pestañas`}
                aria-label={`Quitar pestaña ${p}`}
                className="text-foreground/35 hover:bg-red-500/15 hover:text-red-400 rounded p-0.5 leading-none"
                onClick={(e) => removeTab(e, p)}
              >
                ×
              </button>
            ) : null}
          </span>
        ))}
      </div>
      {canDismiss && hidden.length > 0 ? (
        <button
          type="button"
          onClick={restoreTabs}
          className="text-foreground/50 hover:text-foreground text-[11px] underline"
        >
          Restablecer pestañas ({hidden.length} ocultas)
        </button>
      ) : null}
    </div>
  );
}
