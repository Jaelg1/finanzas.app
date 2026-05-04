import { SignInWithGoogle } from "@/components/sign-in-with-google";

export default function LoginPage() {
  return (
    <main className="from-background via-background flex min-h-full flex-1 flex-col items-center justify-center bg-gradient-to-b to-emerald-950/20 px-6 py-16">
      <div className="border-foreground/10 bg-foreground/5 w-full max-w-sm rounded-2xl border p-8 shadow-lg backdrop-blur-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Mis finanzas</h1>
        <p className="text-foreground/70 mt-2 text-sm leading-relaxed">
          Un solo lugar para ingresos y gastos con concepto. Cada persona tiene
          su propio espacio.
        </p>
        <div className="mt-8">
          <SignInWithGoogle />
        </div>
      </div>
    </main>
  );
}
