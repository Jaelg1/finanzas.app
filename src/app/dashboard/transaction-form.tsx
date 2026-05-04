"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { addTransaction, updateTransaction } from "@/app/actions";
import {
  CATEGORIA_OTRA,
  CATEGORIAS_INGRESO,
  categoriasPorGrupo,
  isGrupoGasto,
  type GrupoGasto,
} from "@/lib/categories";
import type { TransactionRow, VistaVer } from "@/lib/finance";

function SubmitLabel({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  if (pending) return <>Guardando…</>;
  return <>{editing ? "Guardar cambios" : "Agregar movimiento"}</>;
}

async function submitAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const tid = String(formData.get("transaction_id") ?? "").trim();
  const result = tid
    ? await updateTransaction(formData)
    : await addTransaction(formData);
  if ("error" in result && result.error) return { error: result.error };
  return null;
}

export type TransactionFormProps = {
  mes: string;
  ver: VistaVer;
  editing: TransactionRow | null;
  /** Categoría activa en la URL (tabs), para cancelar / redirect */
  cat?: string | null;
};

export function TransactionForm({
  mes,
  ver,
  editing,
  cat,
}: TransactionFormProps) {
  const [tipo, setTipo] = useState<"Ingreso" | "Gasto">(
    () => editing?.tipo ?? "Gasto",
  );
  const [grupo, setGrupo] = useState<GrupoGasto>(() =>
    editing?.tipo === "Gasto" && isGrupoGasto(editing.grupo)
      ? editing.grupo
      : "Diario",
  );

  const presets = categoriasPorGrupo(grupo);

  const [catPreset, setCatPreset] = useState<string>(() => {
    if (!editing || editing.tipo !== "Gasto") return categoriasPorGrupo("Diario")[0];
    const g = isGrupoGasto(editing.grupo) ? editing.grupo : "Diario";
    const list = categoriasPorGrupo(g);
    return list.includes(editing.categoria)
      ? editing.categoria
      : CATEGORIA_OTRA;
  });

  const [catCustom, setCatCustom] = useState(() => {
    if (!editing || editing.tipo !== "Gasto") return "";
    const g = isGrupoGasto(editing.grupo) ? editing.grupo : "Diario";
    const list = categoriasPorGrupo(g);
    return list.includes(editing.categoria) ? "" : editing.categoria;
  });

  const [incomePreset, setIncomePreset] = useState<string>(() => {
    if (editing?.tipo !== "Ingreso") return CATEGORIAS_INGRESO[0];
    return CATEGORIAS_INGRESO.includes(editing.categoria)
      ? editing.categoria
      : CATEGORIA_OTRA;
  });

  const [incomeCustom, setIncomeCustom] = useState(() => {
    if (editing?.tipo !== "Ingreso") return "";
    return CATEGORIAS_INGRESO.includes(editing.categoria)
      ? ""
      : editing.categoria;
  });

  const prevGrupo = useRef(grupo);
  useEffect(() => {
    if (prevGrupo.current === grupo) return;
    prevGrupo.current = grupo;
    const list = categoriasPorGrupo(grupo);
    setCatPreset(list[0]);
    setCatCustom("");
  }, [grupo]);

  const [state, formAction] = useActionState(submitAction, null);
  const today = new Date().toISOString().slice(0, 10);

  const fechaDefault = editing?.fecha ?? today;
  const conceptoDefault = editing?.concepto ?? "";
  const montoDefault = editing != null ? String(editing.monto) : "";

  const categoriaResolved =
    tipo === "Ingreso"
      ? incomePreset === CATEGORIA_OTRA
        ? incomeCustom.trim()
        : incomePreset
      : catPreset === CATEGORIA_OTRA
        ? catCustom.trim()
        : catPreset;

  const cancelHref = `/dashboard?mes=${encodeURIComponent(mes)}&ver=${ver}${cat ? `&cat=${encodeURIComponent(cat)}` : ""}`;
  const isEditing = editing != null;

  return (
    <form
      action={formAction}
      className="border-foreground/10 bg-foreground/5 space-y-4 rounded-xl border p-5"
    >
      <input type="hidden" name="ctx_mes" value={mes} />
      <input type="hidden" name="ctx_ver" value={ver} />
      {cat ? <input type="hidden" name="ctx_cat" value={cat} /> : null}
      {isEditing ? (
        <input type="hidden" name="transaction_id" value={editing.id} />
      ) : null}
      <input type="hidden" name="categoria" value={categoriaResolved} />

      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80">
          {isEditing ? "Editar movimiento" : "Nuevo movimiento"}
        </h2>
        {isEditing ? (
          <Link
            href={cancelHref}
            className="text-foreground/60 hover:text-foreground shrink-0 text-xs underline"
          >
            Cancelar
          </Link>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-foreground/70">Fecha</span>
          <input
            required
            type="date"
            name="fecha"
            defaultValue={fechaDefault}
            className="border-foreground/15 bg-background rounded-lg border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-foreground/70">Tipo</span>
          <select
            name="tipo_ui"
            value={tipo}
            onChange={(e) =>
              setTipo(e.target.value as "Ingreso" | "Gasto")
            }
            className="border-foreground/15 bg-background rounded-lg border px-3 py-2"
          >
            <option value="Gasto">Gasto</option>
            <option value="Ingreso">Ingreso</option>
          </select>
        </label>
      </div>

      <input type="hidden" name="tipo" value={tipo} />

      {tipo === "Gasto" ? (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-foreground/70">Grupo</span>
          <select
            name="grupo"
            required
            value={grupo}
            onChange={(e) => setGrupo(e.target.value as GrupoGasto)}
            className="border-foreground/15 bg-background rounded-lg border px-3 py-2"
          >
            <option value="Fijo">Gasto fijo</option>
            <option value="Servicios">Servicios</option>
            <option value="Diario">Gasto diario</option>
          </select>
        </label>
      ) : null}

      {tipo === "Ingreso" ? (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-foreground/70">Origen / categoría</span>
          <select
            value={incomePreset}
            onChange={(e) => setIncomePreset(e.target.value)}
            className="border-foreground/15 bg-background rounded-lg border px-3 py-2"
          >
            {CATEGORIAS_INGRESO.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={CATEGORIA_OTRA}>Otra…</option>
          </select>
          {incomePreset === CATEGORIA_OTRA ? (
            <input
              value={incomeCustom}
              onChange={(e) => setIncomeCustom(e.target.value)}
              placeholder="Nombre del origen"
              className="border-foreground/15 bg-background mt-2 rounded-lg border px-3 py-2"
            />
          ) : null}
        </label>
      ) : (
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-foreground/70">Categoría</span>
          <select
            value={catPreset}
            onChange={(e) => setCatPreset(e.target.value)}
            className="border-foreground/15 bg-background rounded-lg border px-3 py-2"
          >
            {presets.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={CATEGORIA_OTRA}>Otra…</option>
          </select>
          {catPreset === CATEGORIA_OTRA ? (
            <input
              value={catCustom}
              onChange={(e) => setCatCustom(e.target.value)}
              placeholder="Nombre de la categoría"
              className="border-foreground/15 bg-background mt-2 rounded-lg border px-3 py-2"
            />
          ) : null}
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-foreground/70">Concepto (detalle)</span>
        <input
          name="concepto"
          defaultValue={conceptoDefault}
          placeholder="Ej.: monitor, cena con amigos"
          className="border-foreground/15 bg-background rounded-lg border px-3 py-2"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-foreground/70">Monto</span>
          <input
            required
            name="monto"
            inputMode="decimal"
            defaultValue={montoDefault}
            placeholder="0"
            className="border-foreground/15 bg-background rounded-lg border px-3 py-2"
          />
        </label>
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-foreground/70">
            Cuota <span className="text-foreground/45 font-normal">(opcional)</span>
          </span>
          <div className="flex items-center gap-2">
            <input
              name="cuota_actual"
              type="number"
              min={1}
              step={1}
              placeholder="Nº"
              defaultValue={
                editing?.cuota_actual != null ? editing.cuota_actual : ""
              }
              className="border-foreground/15 bg-background w-full min-w-0 rounded-lg border px-3 py-2"
            />
            <span className="text-foreground/45 shrink-0 text-xs">de</span>
            <input
              name="cuota_total"
              type="number"
              min={1}
              step={1}
              placeholder="Total"
              defaultValue={
                editing?.cuota_total != null ? editing.cuota_total : ""
              }
              className="border-foreground/15 bg-background w-full min-w-0 rounded-lg border px-3 py-2"
            />
          </div>
          <span className="text-foreground/40 text-[11px]">
            Ej.: cuota 5 de 6 — dejá vacío si no aplica
          </span>
        </div>
      </div>

      {state?.error ? (
        <p className="text-red-400 text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        className="bg-emerald-600 hover:bg-emerald-500 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition sm:w-auto"
      >
        <SubmitLabel editing={isEditing} />
      </button>
    </form>
  );
}
