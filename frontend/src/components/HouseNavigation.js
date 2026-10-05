import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { categoryLabel, categoryLink, HOUSES } from "@/lib/catalog";
import { useCategories } from "@/hooks/useCategories";

export const HouseNavigation = ({ mobile = false }) => {
    const { tree, error } = useCategories();
    const { t } = useI18n();
    return <nav data-testid={mobile ? "mobile-house-navigation" : "desktop-house-navigation"} className={mobile ? "space-y-2" : "flex items-center justify-between gap-5"} aria-label={t("catalog.categories")}>
        {HOUSES.map(house => <HouseMenu key={house.key} house={house} categories={tree[house.key]?.categories || {}} error={error} mobile={mobile} />)}
        <Link to="/shop" data-testid={mobile ? "mobile-nav-shop" : "nav-shop"} className={mobile ? "block py-3 font-serif text-2xl" : "text-[11px] uppercase text-bone-100 hover:text-brass-300 transition-colors"}>{t("nav.shop")}</Link>
    </nav>;
};

const HouseMenu = ({ house, categories, error, mobile }) => {
    const [open, setOpen] = useState(false);
    const { t } = useI18n();
    const loc = useLocation();
    const id = `${mobile ? "mobile-" : ""}${house.tid}`;
    useEffect(() => setOpen(false), [loc.key]);
    return <div className="relative" onMouseEnter={() => { if (!mobile) setOpen(true); }} onMouseLeave={() => { if (!mobile) setOpen(false); }}
        onKeyDown={e => { if (e.key === "Escape") { setOpen(false); e.stopPropagation(); } }}
        onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
        <div className={`flex items-center ${mobile ? "justify-between border-b border-white/10" : "gap-1"}`}>
            <Link to={house.to} data-testid={id} onFocus={() => { if (!mobile) setOpen(true); }}
                className={mobile ? "py-3 font-serif text-2xl" : "py-4 text-[11px] uppercase text-bone-100 hover:text-brass-300 transition-colors whitespace-nowrap"}>{t(house.label)}</Link>
            <button type="button" data-testid={`${id}-toggle`} aria-label={`${t(house.label)} ${t("catalog.categories")}`} aria-expanded={open} aria-controls={`${id}-menu`}
                onClick={() => setOpen(value => !value)} className="p-2 text-brass-300 hover:text-bone-100 transition-colors">
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
        </div>
        {open && <div id={`${id}-menu`} data-testid={`${id}-menu`} className={mobile ? "pl-4 pb-3" : "absolute left-0 top-full w-64 bg-ink-800 border border-white/15 shadow-2xl py-2 z-50"}>
            <Link to={house.to} data-testid={`${id}-all`} className="block px-4 py-3 text-sm text-brass-300 hover:bg-white/5 transition-colors">{t("shop.filter.all")} · {t(house.label)}</Link>
            {Object.keys(categories).sort().map(category => <Link key={category} to={categoryLink(house, category)} data-testid={`${id}-${category}`}
                className="block px-4 py-3 text-sm text-bone-100 hover:text-brass-300 hover:bg-white/5 transition-colors">{categoryLabel(category, t)}</Link>)}
            {error && <p data-testid={`${id}-error`} className="px-4 py-3 text-sm text-bone-300">{t("catalog.error")}</p>}
        </div>}
    </div>;
};