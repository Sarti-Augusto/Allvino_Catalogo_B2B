"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${configuredOrigin || window.location.origin}/admin/reset-password` },
      );

      if (resetError) {
        const message = resetError.message.toLowerCase();
        if (message.includes("rate limit") || message.includes("after 60 seconds")) {
          setCooldownSeconds(60);
          setError("Por segurança, aguarde 60 segundos antes de solicitar outro link.");
        } else if (message.includes("redirect") || message.includes("url")) {
          setError("A URL de recuperação ainda não está autorizada no Supabase. Fale com o administrador do projeto.");
        } else {
          setError("Não foi possível enviar o link agora. Verifique o e-mail e tente novamente em instantes.");
        }
      } else {
        setCooldownSeconds(60);
        setSent(true);
      }
    } catch {
      setError("Não foi possível enviar o link agora. Verifique o e-mail e tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-allvino-background px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-allvino-primary-container opacity-10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-allvino-secondary-container opacity-15 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-allvino-outline-variant/40 p-8 shadow-2xl glass-panel">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-2xl font-extrabold uppercase tracking-tight text-allvino-primary">
            Recuperar acesso
          </h1>
          <p className="mt-2 text-xs font-light text-allvino-on-surface-variant">
            Informe o e-mail do administrador para receber um link de redefinição.
          </p>
        </div>

        {sent ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha. Verifique também a pasta de spam.
            </div>
            <p className="text-center text-xs text-allvino-on-surface-variant">
              O link é temporário e só pode ser usado uma vez.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            ) : null}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-allvino-primary">
                E-mail do administrador
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-allvino-outline-variant bg-allvino-surface-container-low px-4 py-3 text-allvino-text placeholder-allvino-on-surface-variant/60 transition focus:border-allvino-primary focus:outline-none"
                placeholder="admin@empresa.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading || cooldownSeconds > 0}
              className="w-full rounded-lg bg-allvino-primary px-4 py-3.5 font-semibold tracking-wide text-white shadow-lg transition duration-200 hover:bg-allvino-primary-container hover:shadow-allvino-primary/20 disabled:opacity-50"
            >
              {loading
                ? "Enviando link..."
                : cooldownSeconds > 0
                  ? `Aguarde ${cooldownSeconds}s...`
                  : "Enviar link de redefinição"}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link href="/admin/login" className="text-xs text-allvino-on-surface-variant transition hover:text-allvino-primary">
            ← Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
