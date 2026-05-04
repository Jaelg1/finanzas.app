import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-xl font-semibold">No se pudo iniciar sesión</h1>
      <p className="text-foreground/80 text-sm">
        El enlace de acceso expiró o es inválido. Volvé a intentar desde la
        pantalla de inicio.
      </p>
      <Link
        href="/login"
        className="bg-foreground text-background inline-flex w-fit rounded-lg px-4 py-2 text-sm font-medium"
      >
        Ir al inicio de sesión
      </Link>
    </main>
  );
}
