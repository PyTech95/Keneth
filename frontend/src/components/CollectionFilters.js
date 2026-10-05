import React from "react";
import { useI18n } from "@/contexts/I18nContext";
import { categoryLabel } from "@/lib/catalog";

export const filterClass = active => `pb-2 border-b text-xs sm:text-sm transition-colors ${active ? "border-brass-400 text-brass-400" : "border-transparent text-bone-300 hover:text-bone-100"}`;

export const CollectionFilters = ({ categories, selected, onSelect, prefix = "category" }) => {
    const { t } = useI18n();
    return (
        <div data-testid={`${prefix}-filters`} className="flex flex-wrap gap-x-6 gap-y-4" aria-label={t("catalog.categories")}>
            <button type="button" data-testid={`${prefix}-all`} aria-pressed={!selected} onClick={() => onSelect("")} className={filterClass(!selected)}>{t("shop.filter.all")}</button>
            {Object.keys(categories).sort().map(category => (
                <button type="button" key={category} data-testid={`${prefix}-${category}`} aria-pressed={selected === category}
                    onClick={() => onSelect(category)} className={filterClass(selected === category)}>{categoryLabel(category, t)}</button>
            ))}
        </div>
    );
};