/** Sentinel para “Otra categoría” en formularios (no guardar en DB) */
export const CATEGORIA_OTRA = "__OTRA__";

export type GrupoGasto = "Fijo" | "Servicios" | "Diario";

export const CATEGORIAS_FIJO: readonly string[] = [
  "Jorojos",
  "Mercado Pago",
  "Cochera",
  "Spotify",
  "Lentes",
  "Aire AC",
  "One Drive",
  "Cursor",
  "Depi definitiva",
  "ChatGPT",
  "Gimnasio",
  "Cordobesa",
  "Ahorro",
];

export const CATEGORIAS_SERVICIOS: readonly string[] = [
  "Alquiler",
  "Gas",
  "Luz",
  "Internet",
];

export const CATEGORIAS_DIARIO: readonly string[] = [
  "Verdulería",
  "Pollería",
  "Súper",
  "Kiosco",
  "Extras",
  "Comilona",
];

/** Origen habitual de ingresos */
export const CATEGORIAS_INGRESO: readonly string[] = [
  "Estudio Rocha",
  "Beca",
  "Mes anterior",
];

export function categoriasPorGrupo(grupo: GrupoGasto): readonly string[] {
  switch (grupo) {
    case "Fijo":
      return CATEGORIAS_FIJO;
    case "Servicios":
      return CATEGORIAS_SERVICIOS;
    case "Diario":
      return CATEGORIAS_DIARIO;
    default:
      return CATEGORIAS_DIARIO;
  }
}

export function isGrupoGasto(g: string): g is GrupoGasto {
  return g === "Fijo" || g === "Servicios" || g === "Diario";
}

export function presetsParaVista(
  ver: "ingresos" | "fijo" | "servicios" | "diario" | "todos",
): readonly string[] | null {
  switch (ver) {
    case "ingresos":
      return CATEGORIAS_INGRESO;
    case "fijo":
      return CATEGORIAS_FIJO;
    case "servicios":
      return CATEGORIAS_SERVICIOS;
    case "diario":
      return CATEGORIAS_DIARIO;
    default:
      return null;
  }
}
