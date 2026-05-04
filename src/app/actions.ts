"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentYearMonth, parseVista } from "@/lib/finance";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function addTransaction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const fecha = String(formData.get("fecha") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "").trim();
  const grupo = String(formData.get("grupo") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const concepto = String(formData.get("concepto") ?? "").trim();
  const montoRaw = String(formData.get("monto") ?? "").trim().replace(",", ".");

  if (!fecha || (tipo !== "Ingreso" && tipo !== "Gasto")) {
    return { error: "Fecha o tipo inválidos" };
  }
  const monto = Number(montoRaw);
  if (!Number.isFinite(monto) || monto < 0) {
    return { error: "Monto inválido" };
  }
  if (!categoria) {
    return { error: "La categoría es obligatoria" };
  }

  const grupoFinal =
    tipo === "Ingreso" ? "Ingreso" : grupo || "Diario";

  if (tipo === "Gasto" && !["Fijo", "Servicios", "Diario"].includes(grupoFinal)) {
    return { error: "Grupo de gasto inválido" };
  }

  const cuota = parseCuotaFields(formData);
  if ("error" in cuota) return cuota;

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    fecha,
    tipo,
    grupo: grupoFinal,
    categoria,
    concepto,
    monto,
    cuota_actual: cuota.actual,
    cuota_total: cuota.total,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateTransaction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const id = String(formData.get("transaction_id") ?? "").trim();
  if (!id) return { error: "Movimiento no válido" };

  const fecha = String(formData.get("fecha") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "").trim();
  const grupo = String(formData.get("grupo") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const concepto = String(formData.get("concepto") ?? "").trim();
  const montoRaw = String(formData.get("monto") ?? "").trim().replace(",", ".");

  if (!fecha || (tipo !== "Ingreso" && tipo !== "Gasto")) {
    return { error: "Fecha o tipo inválidos" };
  }
  const monto = Number(montoRaw);
  if (!Number.isFinite(monto) || monto < 0) {
    return { error: "Monto inválido" };
  }
  if (!categoria) {
    return { error: "La categoría es obligatoria" };
  }

  const grupoFinal =
    tipo === "Ingreso" ? "Ingreso" : grupo || "Diario";

  if (tipo === "Gasto" && !["Fijo", "Servicios", "Diario"].includes(grupoFinal)) {
    return { error: "Grupo de gasto inválido" };
  }

  const cuota = parseCuotaFields(formData);
  if ("error" in cuota) return cuota;

  const { error } = await supabase
    .from("transactions")
    .update({
      fecha,
      tipo,
      grupo: grupoFinal,
      categoria,
      concepto,
      monto,
      cuota_actual: cuota.actual,
      cuota_total: cuota.total,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");

  const rawMes = String(formData.get("ctx_mes") ?? "").trim();
  const mes = rawMes || currentYearMonth();
  const rawVer = String(formData.get("ctx_ver") ?? "").trim();
  const ver = parseVista(rawVer) ?? "diario";

  const rawCtxCat = String(formData.get("ctx_cat") ?? "").trim();
  const catQs =
    rawCtxCat !== ""
      ? `&cat=${encodeURIComponent(rawCtxCat)}`
      : "";

  redirect(
    `/dashboard?mes=${encodeURIComponent(mes)}&ver=${encodeURIComponent(ver)}${catQs}`,
  );
}

function parseCuotaFields(formData: FormData):
  | { actual: number | null; total: number | null }
  | { error: string } {
  const a = String(formData.get("cuota_actual") ?? "").trim();
  const t = String(formData.get("cuota_total") ?? "").trim();
  if (a === "" && t === "") {
    return { actual: null, total: null };
  }
  if (a === "" || t === "") {
    return {
      error:
        "Cuota: completá el número actual y el total, o dejá ambos vacíos",
    };
  }
  const na = Number(a);
  const nt = Number(t);
  if (
    !Number.isFinite(na) ||
    !Number.isFinite(nt) ||
    !Number.isInteger(na) ||
    !Number.isInteger(nt) ||
    na < 1 ||
    nt < 1
  ) {
    return { error: "Cuota: usá números enteros mayores a 0" };
  }
  if (na > nt) {
    return { error: "La cuota actual no puede ser mayor al total" };
  }
  return { actual: na, total: nt };
}

export async function deleteTransaction(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}
