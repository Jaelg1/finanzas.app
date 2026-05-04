export type TransactionRow = {
  id: string;
  user_id: string;
  fecha: string;
  tipo: "Ingreso" | "Gasto";
  grupo: string;
  categoria: string;
  concepto: string;
  monto: number;
  /** Opcional: cuota actual (ej. 5 en 5/6) */
  cuota_actual?: number | null;
  /** Opcional: total de cuotas */
  cuota_total?: number | null;
  created_at: string;
};

export function currentYearMonth(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** `ym` formato YYYY-MM */
export function monthDateBounds(ym: string): { start: string; end: string } {
  const parts = ym.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  if (!y || !m || m < 1 || m > 12) {
    const fallback = currentYearMonth();
    return monthDateBounds(fallback);
  }
  const last = new Date(y, m, 0).getDate();
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const end = `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { start, end };
}

export function summarize(rows: TransactionRow[]) {
  let ingreso = 0;
  let fijo = 0;
  let servicios = 0;
  let diario = 0;
  for (const t of rows) {
    const n = Number(t.monto);
    if (t.tipo === "Ingreso") ingreso += n;
    else {
      if (t.grupo === "Fijo") fijo += n;
      else if (t.grupo === "Servicios") servicios += n;
      else diario += n;
    }
  }
  const gastos = fijo + servicios + diario;
  return { ingreso, fijo, servicios, diario, gastos, balance: ingreso - gastos };
}

export function formatArs(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

export function prevNextMonth(ym: string): { prev: string; next: string } {
  const [ys, ms] = ym.split("-").map(Number);
  const d = new Date(ys, ms - 1, 1);
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  const fmt = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
  return { prev: fmt(prev), next: fmt(next) };
}

/** Filtro de la lista según la tarjeta elegida */
export type VistaVer = "ingresos" | "fijo" | "servicios" | "diario" | "todos";

const VISTAS: VistaVer[] = [
  "ingresos",
  "fijo",
  "servicios",
  "diario",
  "todos",
];

export function parseVista(value: string | undefined): VistaVer | null {
  if (!value) return null;
  return VISTAS.includes(value as VistaVer) ? (value as VistaVer) : null;
}

export function filterByVista(
  rows: TransactionRow[],
  ver: VistaVer,
): TransactionRow[] {
  switch (ver) {
    case "ingresos":
      return rows.filter((t) => t.tipo === "Ingreso");
    case "fijo":
      return rows.filter((t) => t.tipo === "Gasto" && t.grupo === "Fijo");
    case "servicios":
      return rows.filter((t) => t.tipo === "Gasto" && t.grupo === "Servicios");
    case "diario":
      return rows.filter((t) => t.tipo === "Gasto" && t.grupo === "Diario");
    default:
      return [...rows];
  }
}

export function vistaEtiqueta(ver: VistaVer): string {
  const labels: Record<VistaVer, string> = {
    ingresos: "Ingresos",
    fijo: "Gastos fijos",
    servicios: "Servicios",
    diario: "Gasto diario",
    todos: "Todos los movimientos",
  };
  return labels[ver];
}

/** Filtra por categoría exacta cuando `cat` está definido (URL ?cat=) */
export function filterByCategoria(
  rows: TransactionRow[],
  cat: string | undefined,
): TransactionRow[] {
  const c = cat?.trim();
  if (!c) return rows;
  return rows.filter((t) => t.categoria === c);
}
