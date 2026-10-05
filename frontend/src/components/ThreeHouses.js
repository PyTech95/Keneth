import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

const houses = [
    { key: "masalas", title: "masalas", tid: "vertical-card-masalas", image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1400&q=85" },
    { key: "home-furnishing", title: "decor", tid: "vertical-card-decor", image: "https://images.pexels.com/photos/6480707/pexels-photo-6480707.jpeg?w=1400&q=85" },
    { key: "artificial-jewelry", title: "jewelry", tid: "vertical-card-jewelry", image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1400&q=85" },
];

export const ThreeHouses = () => {
    const { t } = useI18n();
    return <section data-testid="three-houses-section" className="py-20 sm:py-24 lg:py-32 border-t border-white/5">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16 mb-12 sm:mb-16">
                <div className="lg:col-span-4"><p className="text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-brass-300 mb-4">— 01 · Provenance</p></div>
                <div className="lg:col-span-8">
                    <h2 data-testid="three-houses-heading" className="font-serif text-4xl sm:text-5xl lg:text-6xl text-bone-100 leading-none mb-5 sm:mb-6">{t("sec.verticals.title")}</h2>
                    <p className="text-base sm:text-lg text-bone-300 font-light max-w-2xl leading-relaxed">{t("sec.verticals.sub")}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
                {houses.map(h => <Link key={h.key} to={`/shop/${h.key}`} data-testid={h.tid} className="group relative aspect-[4/5] card-image-wrap bg-ink-800 block">
                    <img src={h.image} alt={t(`vert.${h.title}.title`)} loading="lazy" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/70 to-ink-900/10" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-10">
                        <p className="text-[11px] sm:text-xs tracking-[0.28em] uppercase text-brass-200 mb-2 sm:mb-3 on-image-shadow">— {t(`home.house.${h.key}`)}</p>
                        <h3 className="font-serif text-3xl sm:text-4xl text-white mb-2 sm:mb-3 leading-none hero-text-shadow">{t(`vert.${h.title}.title`)}</h3>
                        <p className="text-sm text-bone-100 font-light max-w-md mb-4 sm:mb-5 leading-relaxed on-image-shadow">{t(`vert.${h.title}.desc`)}</p>
                        <span className="inline-flex items-center gap-3 text-xs uppercase text-brass-200">{t("sec.category.viewAll")}<ArrowRight className="w-4 h-4" /></span>
                    </div>
                </Link>)}
            </div>
        </div>
    </section>;
};