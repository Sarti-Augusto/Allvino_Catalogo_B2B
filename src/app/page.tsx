import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-allvino-dark-950 text-white font-sans">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-extrabold font-serif text-allvino-gold-400 tracking-tight">
          Allvino
        </h1>
        <p className="text-xl text-allvino-dark-200">
          Catálogo Digital e Geração de PDF B2B
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/admin/login"
            className="px-6 py-3 font-semibold rounded-md border border-allvino-gold-400 text-allvino-gold-400 hover:bg-allvino-gold-400 hover:text-allvino-dark-950 transition duration-300"
          >
            Painel Admin
          </Link>
          <a
            href="/api/export-pdf"
            className="px-6 py-3 font-semibold rounded-md bg-allvino-wine-800 text-white hover:bg-allvino-wine-700 transition duration-300"
          >
            Baixar Catálogo (PDF)
          </a>
        </div>
      </div>
    </main>
  );
}
