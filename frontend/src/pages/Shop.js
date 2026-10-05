import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";
import ProductCard from "@/components/ProductCard";
import { HOUSES } from "@/lib/catalog";
import { useCategories } from "@/hooks/useCategories";
import { CollectionFilters, filterClass } from "@/components/CollectionFilters";

export default function Shop() {
    const { vertical } = useParams();
    const [params, setParams] = useSearchParams();
    const selectedHouse = vertical || params.get("house") || "";
    const category = vertical ? params.get("category") || "" : "";
    const { t } = useI18n();
    const { tree } = useCategories();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        let active = true;
        setLoading(true); setError(false);
        api.get("/products", { params: { ...(selectedHouse && { vertical: selectedHouse }), ...(category && { category }) } })
            .then(({ data }) => { if (active) setProducts(data); })
            .catch(() => { if (active) { setProducts([]); setError(true); } })
            .finally(() => { if (active) setLoading(false); });
        window.scrollTo(0, 0);
        return () => { active = false; };
    }, [selectedHouse, category, retry]);

    const house = HOUSES.find(h => h.key === vertical);
    return (
        <div className="min-h-screen">
            <section className="pt-16 sm:pt-20 pb-12 border-b border-white/5">
                <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
                    <p data-testid="shop-eyebrow" className="text-xs uppercase text-brass-400 mb-5">— {house ? t(house.label) : t("hero.cta")}</p>
                    <h1 data-testid="shop-heading" className="font-serif text-4xl sm:text-5xl lg:text-6xl text-bone-100 leading-none mb-10">{house ? t(house.title) : t("shop.title")}</h1>
                    {vertical ? (
                        <CollectionFilters categories={tree[vertical]?.categories || {}} selected={category}
                            onSelect={value => setParams(value ? { category: value } : {})} />
                    ) : (
                        <div data-testid="shop-house-filters" className="flex flex-wrap gap-x-6 gap-y-4">
                            <button type="button" data-testid="filter-all" aria-pressed={!selectedHouse} onClick={() => setParams({})} className={filterClass(!selectedHouse)}>{t("shop.filter.all")}</button>
                            {HOUSES.map(h => <button type="button" key={h.key} data-testid={h.filterId} aria-pressed={selectedHouse === h.key}
                                onClick={() => setParams({ house: h.key })} className={filterClass(selectedHouse === h.key)}>{t(h.label)}</button>)}
                        </div>
                    )}
                </div>
            </section>
            <section className="py-12 sm:py-16">
                <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
                    {loading ? <p data-testid="shop-loading" role="status" className="py-20 text-bone-300">{t("common.loading")}</p>
                        : error ? <div data-testid="shop-error" role="alert" className="py-20 text-bone-300"><p>{t("catalog.error")}</p><button type="button" data-testid="shop-retry" className="mt-4 text-brass-400" onClick={() => setRetry(n => n + 1)}>{t("catalog.retry")}</button></div>
                        : products.length === 0 ? <p data-testid="shop-empty" className="py-20 text-bone-300">{t("shop.empty")}</p>
                        : <><p data-testid="shop-product-count" className="text-xs text-bone-300 mb-8">{products.length} {t("catalog.products")}</p><div data-testid="shop-products" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-10 sm:gap-y-14">
                            {products.map(p => <ProductCard key={p.slug} product={p} />)}
                        </div></>}
                </div>
            </section>
        </div>
    );
}