import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { ProductCarousel } from "@/components/ProductCarousel";

export const FeaturedJewelry = ({ products }) => {
    const { t } = useI18n();
    return <section data-testid="home-featured-section" className="py-20 sm:py-24 lg:py-28 border-t border-white/5">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
            <div className="mb-10 sm:mb-14">
                <p className="text-xs uppercase text-brass-300 mb-4">— 02 · {t("featured.eyebrow")}</p>
                <h2 data-testid="featured-heading" className="font-serif text-4xl sm:text-5xl text-bone-100 leading-none">{t("sec.featured.title")}</h2>
                <p className="text-sm sm:text-base text-bone-300 mt-4">{t("sec.featured.sub")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-8 lg:gap-16 items-center mb-12">
                <div className="grid grid-cols-2 gap-3 sm:gap-5 items-start">
                    <img data-testid="featured-jewelry-model-1" src="/jewelry-editorial-1.jpg" alt="Woman wearing a traditional kundan necklace and earrings" loading="lazy" className="w-full aspect-[2/3] object-contain" />
                    <img data-testid="featured-jewelry-model-2" src="/jewelry-editorial-2.jpg" alt="Woman wearing Indian jewellery with a red and gold sari" loading="lazy" className="w-full aspect-[2/3] object-contain mt-10 sm:mt-16" />
                </div>
                <div className="max-w-md">
                    <p className="text-xs uppercase text-brass-300 mb-4">{t("nav.jewelry")}</p>
                    <h3 className="font-serif text-4xl sm:text-5xl leading-tight mb-8">{t("featured.title")}</h3>
                    <Link to="/shop/artificial-jewelry" data-testid="featured-jewelry-shop" className="inline-flex items-center gap-3 text-sm text-brass-300 hover:text-bone-100 transition-colors">{t("featured.cta")}<ArrowRight className="w-4 h-4" /></Link>
                </div>
            </div>
            <ProductCarousel id="featured-jewelry" products={products} />
        </div>
    </section>;
};