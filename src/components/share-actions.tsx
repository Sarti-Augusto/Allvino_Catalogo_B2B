"use client";

import { useState } from "react";

interface ShareActionsProps {
  compact?: boolean;
  text: string;
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

export function ShareActions({ compact = false, text }: ShareActionsProps) {
  const [feedback, setFeedback] = useState("");
  const pageUrl = () => window.location.href.split("#")[0];

  const handleWhatsApp = () => {
    const shareUrl = pageUrl();
    const message = `${text}\n${shareUrl}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleInstagram = async () => {
    const shareUrl = pageUrl();

    if (navigator.share) {
      try {
        await navigator.share({ title: "Allvino", text, url: shareUrl });
        setFeedback("Compartilhamento aberto.");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await copyToClipboard(shareUrl);
      setFeedback("Link copiado. Abra o Instagram e cole no story ou na mensagem.");
    } catch {
      setFeedback("Não foi possível copiar o link. Copie a URL desta página manualmente.");
    }
  };

  const handleCopy = async () => {
    try {
      await copyToClipboard(pageUrl());
      setFeedback("Link copiado!");
    } catch {
      setFeedback("Não foi possível copiar o link.");
    }
  };

  const buttonBase = compact
    ? "rounded px-3 py-1.5 text-[10px] font-bold tracking-wide transition shadow"
    : "flex-1 rounded py-2.5 text-xs font-bold text-center transition flex items-center justify-center shadow";

  return (
    <div className={compact ? "relative flex items-center gap-2" : "w-full space-y-2"}>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleWhatsApp}
          className={`${buttonBase} bg-[#25D366] text-white hover:bg-[#20ba5a]`}
          aria-label="Compartilhar pelo WhatsApp"
        >
          WhatsApp
        </button>
        <button
          type="button"
          onClick={handleInstagram}
          className={`${buttonBase} bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white`}
          aria-label="Compartilhar no Instagram"
        >
          Instagram
        </button>
        {!compact ? (
          <button
            type="button"
            onClick={handleCopy}
            className={`${buttonBase} border border-allvino-outline-variant bg-allvino-surface-container-high text-allvino-text hover:bg-allvino-primary hover:text-white`}
          >
            Copiar link
          </button>
        ) : null}
      </div>
      <span aria-live="polite" className="block min-h-4 text-center text-[10px] text-allvino-on-surface-variant">
        {feedback}
      </span>
    </div>
  );
}
