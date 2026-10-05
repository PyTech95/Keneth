import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";
import { AboutVideo } from "@/components/AboutVideo";

export const HomeAbout = ({ productCount }) => {
    const { t } = useI18n();
    const [video, setVideo] = useState(null);
    useEffect(() => {
        let active = true;
        api.get("/site/about-video").then(({ data }) => { if (active) setVideo(data); }).catch(() => {});
        return () => { active = false; };
    }, []);
    return <section id="about" data-testid="home-about-section" className="py-20 sm:py-24 lg:py-28 border-t border-white/5">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
            <div className={`grid gap-10 lg:gap-16 items-center ${video?.url ? "lg:grid-cols-2" : "lg:grid-cols-[2fr_1fr]"}`}>
                <div>
                    <p className="text-xs uppercase text-brass-300 mb-5">— {t("home.about.eyebrow")}</p>
                    <h2 data-testid="home-about-heading" className="font-serif text-4xl sm:text-5xl text-bone-100 leading-tight mb-6">{t("home.about.title")}</h2>
                    <p className="text-sm sm:text-base text-bone-200 font-light leading-relaxed mb-5">{t("home.about.p1")}</p>
                    <p className="text-sm sm:text-base text-bone-300 font-light leading-relaxed mb-8">{t("home.about.p2")}</p>
                    <Link to="/journal" data-testid="home-about-cta" className="inline-flex items-center gap-3 border border-brass-400 text-brass-400 hover:bg-brass-400 hover:text-ink-900 transition-colors px-7 py-3.5 text-xs">{t("home.about.cta")}<ArrowRight className="w-4 h-4" /></Link>
                </div>
                <div>
                    {video?.url && <AboutVideo video={video} />}
                    <div className={`flex flex-wrap gap-8 ${video?.url ? "mt-8 justify-between" : "lg:flex-col lg:pl-12 lg:border-l lg:border-white/10"}`}>
                        {[[productCount || "21", "products"], ["3", "houses"], ["2023", "est"]].map(([value, key]) => <div key={key} data-testid={`about-stat-${key}`}>
                            <div className="font-serif text-3xl sm:text-4xl text-brass-400 leading-none">{value}</div>
                            <div className="text-xs uppercase text-bone-300 mt-2">{t(`home.about.stat.${key}`)}</div>
                        </div>)}
                    </div>
                </div>
            </div>
        </div>
    </section>;
};