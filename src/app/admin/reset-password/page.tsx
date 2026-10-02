"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const prepareRecoverySession = async () => {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError && mounted) {
          setError("Este link expirou ou já foi utilizado. Solicite um novo link.");
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (mounted && data.session) setReady(true);
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted && (event === "PASSWORD_RECOVERY" || session)) setReady(true);
    });

    void prepareRecoverySession();
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("Não foi possível atualizar a senha. Solicite um novo link e tente novamente.");
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setUpdated(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-allvino-background px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-allvino-primary-container opacity-10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-allvino-secondary-container opacity-15 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-allvino-outline-variant/40 p-8 shadow-2xl glass-panel">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-2xl font-extrabold uppercase tracking-tight text-allvino-primary">
            Nova senha
          </h1>
          <p className="mt-2 text-xs font-light text-allvino-on-surface-variant">
            Defina uma nova senha para acessar o painel administrativo.
          </p>
        </div>

        {updated ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Senha atualizada com sucesso. Você já pode entrar no painel com a nova senha.
            </div>
            <Link href="/admin/login" className="block w-full rounded-lg bg-allvino-primary px-4 py-3.5 text-center font-semibold text-white transition hover:bg-allvino-primary-container">
              Ir para o login
            </Link>
          </div>
        ) : !ready ? (
          <div className="space-y-4 text-center">
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {error || "Validando o link de recuperação..."}
            </p>
            {error ? (
              <Link href="/admin/forgot-password" className="text-xs font-semibold text-allvino-primary hover:text-allvino-primary-container">
                Solicitar novo link
              </Link>
            ) : null}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
            ) : null}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-allvino-primary">
                Nova senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-lg border border-allvino-outline-variant bg-allvino-surface-container-low px-4 py-3 text-allvino-text transition focus:border-allvino-primary focus:outline-none"
                placeholder="Mínimo de 8 caracteres"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-allvino-primary">
                Confirmar nova senha
              </label>
              <input
                type="password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-lg border border-allvino-outline-variant bg-allvino-surface-container-low px-4 py-3 text-allvino-text transition focus:border-allvino-primary focus:outline-none"
                placeholder="Repita a nova senha"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-allvino-primary px-4 py-3.5 font-semibold tracking-wide text-white shadow-lg transition duration-200 hover:bg-allvino-primary-container hover:shadow-allvino-primary/20 disabled:opacity-50"
            >
              {loading ? "Atualizando..." : "Atualizar senha"}
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
