import type { VistaVer } from "@/lib/finance";

const STORAGE_KEY = "finanzas-tabs-ocultas-v1";

/** Vistas que muestran pestañas de categoría */
export type VistaConTabs = Exclude<VistaVer, "todos">;

export function isVistaConTabs(v: VistaVer): v is VistaConTabs {
  return v !== "todos";
}

type HiddenMap = Partial<Record<VistaConTabs, string[]>>;

function parseHidden(raw: string | null): HiddenMap {
  if (!raw) return {};
  try {
    const o = JSON.parse(raw) as HiddenMap;
    return typeof o === "object" && o !== null ? o : {};
  } catch {
    return {};
  }
}

export function loadHiddenCategories(): HiddenMap {
  if (typeof window === "undefined") return {};
  return parseHidden(localStorage.getItem(STORAGE_KEY));
}

export function saveHiddenCategories(map: HiddenMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function hideCategoryForVista(ver: VistaConTabs, categoria: string) {
  const map = loadHiddenCategories();
  const set = new Set(map[ver] ?? []);
  set.add(categoria);
  map[ver] = [...set];
  saveHiddenCategories(map);
}

export function clearHiddenForVista(ver: VistaConTabs) {
  const map = loadHiddenCategories();
  delete map[ver];
  saveHiddenCategories(map);
}
