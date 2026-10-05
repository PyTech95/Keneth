import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { api, productImage } from "@/lib/api";
import { formatPrice } from "@/lib/currency";
import { useI18n } from "@/contexts/I18nContext";

export default function SearchModal({ open, onClose }) {
    const [q, setQ] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const nav = useNavigate();
    const { tr, lang } = useI18n();

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
            document.body.style.overflow = "hidden";
        } else {
            setQ("");
            setResults([]);
        }
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    useEffect(() => {
        if (!q.trim()) {
            setResults([]);
            return;
        }
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/products?q=${encodeURIComponent(q)}&limit=8`);
                setResults(data);
            } catch (e) { setResults([]); }
            setLoading(false);
        }, 220);
        return () => clearTimeout(t);
    }, [q]);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose?.();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    if (!open) return null;

    const goTo = (slug) => {
        onClose();
        nav(`/product/${slug}`);
    };

    return (
        <div className="fixed inset-0 z-[70] bg-ink-900/95 backdrop-blur-xl overflow-y-auto">
            <div className="max-w-3xl mx-auto px-5 sm:px-6 pt-16 sm:pt-24 pb-16">
                <div className="flex items-center justify-between mb-8 sm:mb-12">
                    <p className="text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-brass-400">— Search the atelier</p>
                    <button onClick={onClose} data-testid="search-close" className="text-bone-100 hover:text-brass-400 transition-colors" aria-label="Close">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex items-center gap-4 border-b border-white/20 pb-2 mb-8">
                    <Search className="w-5 h-5 text-brass-400 shrink-0" />
                    <input
                        ref={inputRef}
                        data-testid="search-input"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Try 'cardamom', 'kundan', 'silk runner'…"
                        className="flex-1 bg-transparent text-bone-100 text-2xl sm:text-3xl font-serif py-2 focus:outline-none placeholder:text-bone-300/40"
                    />
                </div>

                {loading && <p className="text-bone-300 text-sm tracking-widest uppercase">Searching…</p>}

                {!loading && q && results.length === 0 && (
                    <p className="text-bone-300 text-sm">No results for <em>"{q}"</em>.</p>
                )}

                {results.length > 0 && (
                    <div className="space-y-3" data-testid="search-results">
                        {results.map((p) => (
                            <button
                                key={p.slug}
                                data-testid={`search-result-${p.slug}`}
                                onClick={() => goTo(p.slug)}
                                className="w-full flex items-center gap-4 sm:gap-5 p-3 sm:p-4 border border-white/5 hover:border-brass-400/60 hover:bg-ink-800 transition-colors text-left group"
                            >
                                <div className="w-14 h-16 sm:w-16 sm:h-20 bg-ink-800 overflow-hidden shrink-0">
                                    <img src={productImage(p)} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] sm:text-[10px] tracking-[0.24em] uppercase text-bone-300/70 mb-1">
                                        {p.vertical === "masalas" ? "Indian Spices" : p.vertical === "jewelry" ? "Jewelry" : "Home Decor"}
                                    </p>
                                    <p className="font-serif text-lg sm:text-xl text-bone-100 group-hover:text-brass-400 transition-colors leading-tight">{tr(p.name)}</p>
                                    <p className="text-xs sm:text-sm text-bone-300/70 mt-1 truncate">{tr(p.short_description)}</p>
                                </div>
                                <div className="font-serif text-lg text-brass-400 shrink-0">{formatPrice(p.price_eur, lang)}</div>
                            </button>
                        ))}
                    </div>
                )}

                {!q && (
                    <div>
                        <p className="text-[10px] tracking-[0.28em] uppercase text-bone-300/60 mb-4">Popular searches</p>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            {["Garam Masala", "Kundan Choker", "Silk Runner", "Wall Hanging", "Cardamom", "Bangles"].map((term) => (
                                <button
                                    key={term}
                                    onClick={() => setQ(term)}
                                    className="border border-white/15 hover:border-brass-400 hover:text-brass-400 text-bone-100 px-3 sm:px-4 py-2 text-xs sm:text-sm transition-colors"
                                >
                                    {term}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
