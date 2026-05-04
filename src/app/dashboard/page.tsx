import Link from "next/link";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { deleteTransaction, signOut } from "@/app/actions";
import { presetsParaVista } from "@/lib/categories";
import {
  currentYearMonth,
  filterByCategoria,
  filterByVista,
  formatArs,
  monthDateBounds,
  parseVista,
  prevNextMonth,
  summarize,
  vistaEtiqueta,
  type TransactionRow,
  type VistaVer,
} from "@/lib/finance";
import { CategoryTabs } from "./category-tabs";
import { IconPencil, IconTrash } from "@/components/transaction-icons";
import { createClient } from "@/lib/supabase/server";
import { TransactionForm } from "./transaction-form";

function displayName(user: User) {
  const meta = user.user_metadata as Record<string, string | undefined>;
  return meta.full_name ?? meta.name ?? user.email ?? "Usuario";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    mes?: string;
    ver?: string;
    edit?: string;
    cat?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const mes = sp.mes ?? currentYearMonth();
  const verParsed = parseVista(sp.ver);
  if (!verParsed) {
    redirect(`/dashboard?mes=${mes}&ver=diario`);
  }
  const ver: VistaVer = verParsed;
  const { start, end } = monthDateBounds(mes);

  const { data: raw, error } = await supabase
    .from("transactions")
    .select("*")
    .gte("fecha", start)
    .lte("fecha", end)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-red-400 text-sm">
          Error al cargar movimientos: {error.message}. ¿Creaste la tabla{" "}
          <code className="bg-foreground/10 rounded px-1">transactions</code>{" "}
          en Supabase?
        </p>
      </main>
    );
  }

  const transactions = (raw ?? []) as TransactionRow[];
  const s = summarize(transactions);
  const filtered = filterByVista(transactions, ver);

  const activeCatRaw = typeof sp.cat === "string" ? sp.cat.trim() : "";
  const activeCat = activeCatRaw !== "" ? activeCatRaw : undefined;

  const categoryPresets = presetsParaVista(ver);
  const listRows = filterByCategoria(filtered, activeCat);

  const editId = typeof sp.edit === "string" ? sp.edit.trim() : "";
  let editing: TransactionRow | null = null;
  if (editId) {
    const fromMonth = transactions.find((t) => t.id === editId);
    if (fromMonth) editing = fromMonth;
    else {
      const { data: row } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", editId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (row) editing = row as TransactionRow;
    }
  }
  const { prev, next } = prevNextMonth(mes);
  const catQs = activeCat
    ? `&cat=${encodeURIComponent(activeCat)}`
    : "";

  const hrefMes = (ym: string) =>
    `/dashboard?mes=${encodeURIComponent(ym)}&ver=${ver}${catQs}`;
  const hrefEdit = (id: string) =>
    `/dashboard?mes=${encodeURIComponent(mes)}&ver=${ver}${catQs}&edit=${encodeURIComponent(id)}`;
  const [y, m] = mes.split("-");
  const monthTitle = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(
    "es-AR",
    { month: "long", year: "numeric" },
  );

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-foreground/60 text-sm">Hola,</p>
          <h1 className="text-xl font-semibold tracking-tight">
            {displayName(user)}
          </h1>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="border-foreground/20 hover:bg-foreground/5 rounded-lg border px-4 py-2 text-sm"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            href={hrefMes(prev)}
            className="border-foreground/15 hover:bg-foreground/5 rounded-lg border px-3 py-2 text-sm"
            prefetch
          >
            ← Mes anterior
          </Link>
          <Link
            href={hrefMes(next)}
            className="border-foreground/15 hover:bg-foreground/5 rounded-lg border px-3 py-2 text-sm"
            prefetch
          >
            Mes siguiente →
          </Link>
        </div>
        <p className="text-foreground/80 text-sm capitalize">{monthTitle}</p>
        <Link
          href={`/dashboard?mes=${currentYearMonth()}&ver=${ver}${catQs}`}
          className="text-emerald-500 text-sm hover:underline"
        >
          Ir a este mes
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCardLink
          href={`/dashboard?mes=${mes}&ver=ingresos`}
          active={ver === "ingresos"}
          label="Ingresos"
          value={s.ingreso}
          tone="in"
        />
        <SummaryCardLink
          href={`/dashboard?mes=${mes}&ver=fijo`}
          active={ver === "fijo"}
          label="Fijos"
          value={s.fijo}
        />
        <SummaryCardLink
          href={`/dashboard?mes=${mes}&ver=servicios`}
          active={ver === "servicios"}
          label="Servicios"
          value={s.servicios}
        />
        <SummaryCardLink
          href={`/dashboard?mes=${mes}&ver=diario`}
          active={ver === "diario"}
          label="Diario"
          value={s.diario}
        />
        <SummaryCardLink
          href={`/dashboard?mes=${mes}&ver=todos`}
          active={ver === "todos"}
          label="Balance"
          value={s.balance}
          tone="bal"
          subtitle="Ver todo"
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-3">
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80">
              Movimientos
            </h2>
            <p className="text-foreground/55 mt-1 text-sm">
              Mostrando:{" "}
              <span className="text-foreground font-medium">
                {vistaEtiqueta(ver)}
              </span>
              {activeCat ? (
                <>
                  {" "}
                  · <span className="text-foreground">{activeCat}</span>
                </>
              ) : null}
              {" · "}
              tocá otra tarjeta para cambiar
            </p>
          </div>
          {categoryPresets ? (
            <CategoryTabs
              mes={mes}
              ver={ver}
              activeCat={activeCat}
              presets={categoryPresets}
              rowsInVista={filtered}
            />
          ) : null}
          {transactions.length === 0 ? (
            <p className="text-foreground/60 text-sm">
              No hay movimientos en este mes. Agregá el primero con el
              formulario.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-foreground/60 text-sm">
              No hay movimientos en{" "}
              <span className="text-foreground/90">
                {vistaEtiqueta(ver).toLowerCase()}
              </span>{" "}
              este mes.
            </p>
          ) : listRows.length === 0 ? (
            <p className="text-foreground/60 text-sm">
              No hay movimientos en la categoría{" "}
              <span className="text-foreground/90">{activeCat}</span> este mes.
            </p>
          ) : (
            <ul className="divide-foreground/10 border-foreground/10 divide-y overflow-hidden rounded-xl border">
              {listRows.map((t) => (
                <li
                  key={t.id}
                  className="bg-foreground/[0.02] flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {t.categoria}
                      {t.concepto ? (
                        <span className="text-foreground/60 font-normal">
                          {" "}
                          — {t.concepto}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-foreground/50 text-xs">
                      {t.fecha} · {t.tipo}
                      {t.tipo === "Gasto" ? ` · ${t.grupo}` : ""}
                      {t.cuota_actual != null &&
                      t.cuota_total != null &&
                      t.cuota_actual > 0 &&
                      t.cuota_total > 0 ? (
                        <>
                          {" "}
                          · Cuota {t.cuota_actual}/{t.cuota_total}
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={
                        t.tipo === "Ingreso"
                          ? "text-emerald-500 font-medium tabular-nums"
                          : "text-foreground font-medium tabular-nums"
                      }
                    >
                      {t.tipo === "Ingreso" ? "+" : "−"}
                      {formatArs(Number(t.monto))}
                    </span>
                    <div className="inline-flex items-center gap-0.5">
                      <Link
                        href={hrefEdit(t.id)}
                        title="Editar"
                        aria-label="Editar movimiento"
                        className="text-foreground/45 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md p-1.5 transition"
                      >
                        <IconPencil className="size-4" />
                      </Link>
                      <form
                        action={deleteTransaction.bind(null, t.id)}
                        className="inline"
                      >
                        <button
                          type="submit"
                          title="Eliminar"
                          aria-label="Eliminar movimiento"
                          className="text-foreground/45 hover:text-red-400 hover:bg-red-500/10 rounded-md p-1.5 transition"
                        >
                          <IconTrash className="size-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <TransactionForm
          key={editing?.id ?? "nuevo"}
          mes={mes}
          ver={ver}
          editing={editing}
          cat={activeCat}
        />
      </div>
    </div>
  );
}

function SummaryCardLink({
  href,
  active,
  label,
  value,
  tone,
  subtitle,
}: {
  href: string;
  active: boolean;
  label: string;
  value: number;
  tone?: "in" | "bal";
  subtitle?: string;
}) {
  const color =
    tone === "in"
      ? "text-emerald-500"
      : tone === "bal"
        ? value >= 0
          ? "text-emerald-400"
          : "text-red-400"
        : "";
  return (
    <Link
      href={href}
      prefetch
      className={`border-foreground/10 bg-foreground/5 block rounded-xl border px-4 py-3 text-left transition outline-none ${
        active
          ? "ring-emerald-500/80 bg-emerald-950/20 ring-2"
          : "hover:bg-foreground/10"
      }`}
    >
      <p className="text-foreground/60 text-xs font-medium uppercase">
        {label}
      </p>
      {subtitle ? (
        <p className="text-foreground/45 mt-0.5 text-[11px]">{subtitle}</p>
      ) : null}
      <p className={`mt-1 text-lg font-semibold tabular-nums ${color}`}>
        {formatArs(value)}
      </p>
    </Link>
  );
}
