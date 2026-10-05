import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";

export const ProductCarousel = ({ products, id }) => {
    const { t } = useI18n();
    const track = useRef(null);
    const [edges, setEdges] = useState({ start: true, end: false });
    const measure = useCallback(() => {
        const el = track.current;
        if (el) setEdges({ start: el.scrollLeft < 3, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 3 });
    }, []);
    useEffect(() => {
        const el = track.current;
        if (!el) return;
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        measure();
        return () => observer.disconnect();
    }, [measure, products.length]);
    const scroll = direction => {
        const el = track.current;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el?.scrollBy({ left: direction * el.clientWidth, behavior: reduced ? "instant" : "smooth" });
    };
    return <div data-testid={`${id}-carousel`} className="min-w-0">
        <div className="flex items-center justify-end gap-3 mb-6">
            <span data-testid={`${id}-count`} className="text-xs text-bone-300 mr-2">{products.length} {t("catalog.products")}</span>
            <Button variant="outline" size="icon" type="button" data-testid={`${id}-previous`} aria-label={t("carousel.previous")} title={t("carousel.previous")} disabled={edges.start}
                onClick={() => scroll(-1)} className="rounded-none border-white/20"><ArrowLeft /></Button>
            <Button variant="outline" size="icon" type="button" data-testid={`${id}-next`} aria-label={t("carousel.next")} title={t("carousel.next")} disabled={edges.end}
                onClick={() => scroll(1)} className="rounded-none border-white/20"><ArrowRight /></Button>
        </div>
        <div ref={track} onScroll={measure} tabIndex={0} data-testid={`${id}-track`} aria-label={t("hero.selection")} className="product-carousel-track scrollbar-hide pb-3"
            onKeyDown={e => { if (e.target === e.currentTarget && ["ArrowLeft", "ArrowRight"].includes(e.key)) { e.preventDefault(); scroll(e.key === "ArrowLeft" ? -1 : 1); } }}>
            {products.map(p => <div key={p.slug} className="min-w-0 snap-start"><ProductCard product={p} testIdPrefix={id} /></div>)}
        </div>
    </div>;
};