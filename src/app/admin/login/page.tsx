"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error || "E-mail ou senha incorretos.");
        setLoading(false);
      } else {
        router.push("/admin/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Ocorreu um erro no servidor. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-allvino-background px-4 relative overflow-hidden">
      {/* Background design accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-allvino-primary-container rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-allvino-secondary-container rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse delay-75"></div>

      <div className="w-full max-w-md glass-panel rounded-2xl p-8 shadow-2xl relative z-10 border border-allvino-outline-variant/40">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold font-serif tracking-tight text-allvino-primary">
            ALLVINO
          </h1>
          <p className="text-sm text-allvino-on-surface-variant mt-2 font-light">
            Painel de Gestão do Catálogo B2B
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-2">
              E-mail corporativo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text placeholder-allvino-on-surface-variant/60 focus:outline-none focus:border-allvino-primary transition"
              placeholder="seuemail@allvino.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-allvino-primary mb-2">
              Senha de acesso
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-allvino-surface-container-low border border-allvino-outline-variant text-allvino-text placeholder-allvino-on-surface-variant/60 focus:outline-none focus:border-allvino-primary transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-lg bg-allvino-primary hover:bg-allvino-primary-container disabled:opacity-50 text-white font-semibold tracking-wide transition duration-200 shadow-lg hover:shadow-allvino-primary/20"
          >
            {loading ? "Autenticando..." : "Entrar no Painel"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-xs text-allvino-on-surface-variant hover:text-allvino-primary transition"
          >
            ← Voltar para a vitrine pública
          </a>
        </div>
      </div>
    </div>
  );
}
