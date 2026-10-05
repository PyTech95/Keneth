// Currency display — prices are stored in EUR (base currency for Stripe).
// English users see INR (Indian home market), European-language users see EUR.
export const CURRENCIES = {
    en: { symbol: "₹", code: "INR", rate: 90, locale: "en-IN", digits: 0 },
    de: { symbol: "€", code: "EUR", rate: 1, locale: "de-DE", digits: 2 },
    fr: { symbol: "€", code: "EUR", rate: 1, locale: "fr-FR", digits: 2 },
    es: { symbol: "€", code: "EUR", rate: 1, locale: "es-ES", digits: 2 },
    it: { symbol: "€", code: "EUR", rate: 1, locale: "it-IT", digits: 2 },
};

export function currencyFor(lang) {
    return CURRENCIES[lang] || CURRENCIES.en;
}

export function formatPrice(eurAmount, lang) {
    const cfg = currencyFor(lang);
    const value = Number(eurAmount || 0) * cfg.rate;
    try {
        return new Intl.NumberFormat(cfg.locale, {
            style: "currency",
            currency: cfg.code,
            minimumFractionDigits: cfg.digits,
            maximumFractionDigits: cfg.digits,
        }).format(value);
    } catch {
        return `${cfg.symbol}${value.toFixed(cfg.digits)}`;
    }
}
