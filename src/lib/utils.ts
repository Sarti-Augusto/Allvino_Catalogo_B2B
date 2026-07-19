/**
 * Retorna a URL da bandeira nacional com base no nome do país usando o serviço FlagCDN.
 */
export function getCountryFlagUrl(countryName: string): string {
  const normalized = countryName.toLowerCase().trim();
  const flagCodes: { [key: string]: string } = {
    "frança": "fr",
    "franca": "fr",
    "itália": "it",
    "italia": "it",
    "brasil": "br",
    "argentina": "ar",
    "chile": "cl",
    "espanha": "es",
    "portugal": "pt",
    "uruguai": "uy",
    "eua": "us",
    "estados unidos": "us",
    "alemanha": "de",
    "austrália": "au",
    "australia": "au",
    "áfrica do sul": "za",
    "africa do sul": "za",
    "nova zelândia": "nz",
    "nova zelandia": "nz",
  };
  const code = flagCodes[normalized] || "un";
  return `https://flagcdn.com/w40/${code}.png`;
}
