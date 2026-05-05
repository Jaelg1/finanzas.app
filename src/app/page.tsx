import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** OAuth envía ?code= a / a veces; la página debe ejecutarse en el servidor, no como HTML estático */
export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;

function oauthCallbackRedirect(sp: Search) {
  const code = sp.code;
  const codeStr = Array.isArray(code) ? code[0] : code;
  if (!codeStr) return null;

  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(sp)) {
    if (val === undefined) continue;
    if (typeof val === "string") q.append(key, val);
    else if (Array.isArray(val)) val.forEach((v) => q.append(key, v));
  }
  return `/auth/callback?${q.toString()}`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const toCallback = oauthCallbackRedirect(sp);
  if (toCallback) redirect(toCallback);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  redirect("/login");
}
