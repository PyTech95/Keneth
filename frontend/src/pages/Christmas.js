import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";
import { ProductCarousel } from "@/components/ProductCarousel";
import { CollectionFilters } from "@/components/CollectionFilters";
import { TID } from "@/constants/testIds";
import { ArrowRight, Truck, Gift, Sparkles, TreePine } from "lucide-react";

const XMAS_HERO = "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=2000&q=85";

const LOCALE = { en: "en-GB", de: "de-DE", fr: "fr-FR", es: "es-ES", it: "it-IT" };

function christmasInfo() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let year = now.getFullYear();
    if (today > new Date(year, 11, 25)) year += 1;
    const target = new Date(year, 11, 25);
    const days = Math.round((target - today) / 86400000);
    const lastOrder = new Date(year, 11, 20); // order-by date for in-time delivery
    return { days, lastOrder };
}

function Countdown() {
    const { t, lang } = useI18n();
    const { days, lastOrder } = christmasInfo();
    const dateStr = lastOrder.toLocaleDateString(LOCALE[lang] || "en-GB", { day: "numeric", month: "long" });
    const isToday = days === 0;
    return (
        <div className="bg-ink-800 border-b border-white/5">
            <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10 py-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-center">
                <span className="inline-flex items-center gap-2.5">
                    <TreePine className="w-4 h-4 text-brass-400 shrink-0" strokeWidth={1.6} />
                    {isToday ? (
                        <span className="font-serif text-xl sm:text-2xl text-bone-100">{t("xmas.count.today")}</span>
                    ) : (
                        <span className="font-serif text-xl sm:text-2xl text-bone-100">
                            <span className="text-brass-400">{days}</span> {t("xmas.count.days")}
                        </span>
                    )}
                </span>
                {!isToday && (
                    <>
                        <span className="hidden sm:block w-px h-5 bg-white/15" />
                        <span className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-bone-300">
                            {t("xmas.count.orderby").replace("{d}", dateStr)}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}

export default function Christmas() {
    const { t } = useI18n();
    const [products, setProducts] = useState([]);
    const [params, setParams] = useSearchParams();
    const category = params.get("category") || "";
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        let active = true;
        setError(false); setLoading(true);
        api.get("/products", { params: { vertical: "christmas-decor" } }).then(({ data }) => { if (active) setProducts(data); })
            .catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [retry]);

    useEffect(() => {
        if (category && !loading) document.getElementById("christmas-collection")?.scrollIntoView({ block: "start" });
    }, [category, loading]);

    const categories = Object.fromEntries(products.map(p => [p.category, 1]));
    const xmas = products.filter((p) => !category || p.category === category);
    const under30 = products.filter((p) => Number(p.price_eur) < 30).slice(0, 4);
    const statement = [...products].sort((a, b) => Number(b.price_eur) - Number(a.price_eur)).slice(0, 4);
    const forHost = products
        .filter((p) => ["table-linen", "stockings"].includes(p.category))
        .slice(0, 4);

    return (
        <div>
            {/* FREE-SHIPPING BANNER */}
            <div className="bg-brass-400 text-ink-900">
                <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10 py-3 flex items-center justify-center gap-3 text-center">
                    <Truck className="w-4 h-4 shrink-0" strokeWidth={2} />
                    <span className="text-[10px] sm:text-[11px] tracking-[0.18em] sm:tracking-[0.24em] uppercase font-medium">
                        {t("xmas.banner")}
                    </span>
                </div>
            </div>

            {/* CHRISTMAS COUNTDOWN */}
            <Countdown />

            {/* HERO */}
            <section data-testid={TID.xmasHero} className="relative min-h-[520px] h-[78vh] w-full overflow-hidden">
                <div className="absolute inset-0 animate-ken-burns">
                    <img src={XMAS_HERO} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/70 to-ink-900/45" />
                <div className="absolute inset-0 bg-gradient-to-r from-ink-900/85 via-ink-900/35 to-transparent" />
                <div className="relative z-10 h-full max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10 flex flex-col justify-end pb-16 sm:pb-24 lg:pb-28">
                    <div className="max-w-3xl">
                        <p className="text-[11px] sm:text-xs tracking-[0.32em] sm:tracking-[0.4em] uppercase text-brass-200 mb-5 sm:mb-6 animate-fade-up on-image-shadow">
                            — {t("nav.christmas")}
                        </p>
                        <h1 className="font-serif text-[40px] sm:text-[64px] lg:text-[84px] leading-[0.96] tracking-tight text-white mb-6 sm:mb-8 animate-fade-up animate-fade-up-delay-1 hero-text-shadow">
                            {t("xmas.title")}
                        </h1>
                        <p className="text-base sm:text-lg lg:text-xl text-bone-100 max-w-xl font-light leading-relaxed mb-9 sm:mb-11 animate-fade-up animate-fade-up-delay-2 on-image-shadow">
                            {t("xmas.subtitle")}
                        </p>
                        <a
                            href="#christmas-collection"
                            data-testid={TID.xmasShopCta}
                            className="group inline-flex items-center gap-3 sm:gap-4 bg-brass-400 text-ink-900 hover:bg-brass-300 transition-colors duration-500 px-7 sm:px-9 py-4 text-[10px] sm:text-[11px] tracking-[0.24em] sm:tracking-[0.28em] uppercase animate-fade-up animate-fade-up-delay-3"
                        >
                            {t("xmas.cta")}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>
            </section>

            {/* CHRISTMAS COLLECTION */}
                <section id="christmas-collection" data-testid="christmas-collection" className="py-20 sm:py-24 lg:py-28 border-t border-white/5">
                    <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 sm:mb-14 gap-4">
                            <div>
                                <p className="text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-brass-300 mb-3 sm:mb-4">— {t("home.house.christmas-decor")}</p>
                                <h2 data-testid="christmas-collection-heading" className="font-serif text-4xl sm:text-5xl lg:text-6xl text-bone-100 leading-none">
                                    {t("nav.christmas")}
                                </h2>
                            </div>
                            <Link data-testid="christmas-shop-all" to="/shop/christmas-decor" className="text-xs uppercase text-brass-300 link-hairline self-start md:self-auto">
                                {t("xmas.shopAll")}
                            </Link>
                        </div>
                        <div className="mb-8"><CollectionFilters categories={categories} selected={category} onSelect={value => setParams(value ? { category: value } : {})} prefix="christmas-category" /></div>
                        {loading ? <p data-testid="christmas-loading" role="status">{t("common.loading")}</p>
                            : error ? <div data-testid="christmas-error" role="alert">{t("catalog.error")}<button type="button" data-testid="christmas-retry" onClick={() => setRetry(n => n + 1)} className="ml-4 text-brass-300">{t("catalog.retry")}</button></div>
                                : !xmas.length ? <p data-testid="christmas-empty">{t("shop.empty")}</p>
                                    : <ProductCarousel key={category} id="christmas-collection" products={xmas} />}
                    </div>
                </section>

            {/* GIFT GUIDE */}
            <section id="gift-guide" className="py-20 sm:py-24 lg:py-32 border-t border-white/5 bg-ink-800/30 scroll-mt-24">
                <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
                    <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20">
                        <p className="text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-brass-300 mb-4 inline-flex items-center gap-2">
                            <Gift className="w-4 h-4" /> {t("xmas.guide.title")}
                        </p>
                        <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-bone-100 tracking-tight leading-none mb-5">
                            {t("xmas.guide.title")}
                        </h2>
                        <p className="text-base sm:text-lg text-bone-300 font-light leading-relaxed">{t("xmas.guide.sub")}</p>
                    </div>

                    <GiftBand id="christmas-under-30" icon={Sparkles} title={t("xmas.guide.under")} items={under30} />
                    <GiftBand id="christmas-statement" icon={Gift} title={t("xmas.guide.statement")} items={statement} />
                    <GiftBand id="christmas-host" icon={Truck} title={t("xmas.guide.forHome")} items={forHost} last />
                </div>
            </section>
        </div>
    );
}

function GiftBand({ id, icon: Icon, title, items, last = false }) {
    if (!items || items.length === 0) return null;
    return (
        <div className={last ? "" : "mb-16 sm:mb-24"}>
            <div className="flex items-center gap-3 mb-8 sm:mb-10">
                <Icon className="w-5 h-5 text-brass-400" strokeWidth={1.5} />
                <h3 className="font-serif text-2xl sm:text-3xl text-bone-100 tracking-tight">{title}</h3>
                <div className="flex-1 h-px bg-white/10 ml-4" />
            </div>
            <ProductCarousel id={id} products={items} />
        </div>
    );
}
