import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { LANGUAGES, TRANSLATIONS } from "@/lib/i18n";

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
    const [lang, setLang] = useState(() => {
        return localStorage.getItem("kg_lang") || "en";
    });

    useEffect(() => {
        localStorage.setItem("kg_lang", lang);
        document.documentElement.setAttribute("lang", lang);
    }, [lang]);

    const value = useMemo(() => {
        const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
        const t = (key) => dict[key] ?? TRANSLATIONS.en[key] ?? key;
        // pick localized field from product object: {en, de, fr...}
        const tr = (obj) => {
            if (obj == null) return "";
            if (typeof obj === "string") return obj;
            return obj[lang] || obj.en || "";
        };
        return { lang, setLang, t, tr, languages: LANGUAGES };
    }, [lang]);

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error("useI18n must be used within I18nProvider");
    return ctx;
}
