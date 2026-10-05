import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, STATIC_BASE } from "@/lib/api";
import { ArrowRight, Play } from "lucide-react";

export const GalleryTeaser = () => {
    const [items, setItems] = useState([]);
    useEffect(() => {
        let active = true;
        api.get("/gallery").then(({ data }) => { if (active) setItems(data); }).catch(() => {});
        return () => { active = false; };
    }, []);

    const images = items.filter((i) => i.type === "image").slice(0, 5);
    const hasVideo = items.some((i) => i.type === "video");
    if (!images.length) return null;

    return (
        <section data-testid="home-gallery-section" className="py-16 sm:py-20 lg:py-28 border-t border-white/5 bg-ink-800/30">
            <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-8 sm:mb-10">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-brass-300 mb-4">— From the source</p>
                        <h2 className="font-serif text-4xl sm:text-5xl text-bone-100 leading-none">The Gallery</h2>
                        <p className="mt-4 text-sm sm:text-base text-bone-300 font-light leading-relaxed max-w-xl">
                            Harbour mornings, spice markets and the hands behind every order.
                        </p>
                    </div>
                    <Link to="/gallery" data-testid="home-gallery-link" className="text-xs uppercase tracking-[0.2em] text-brass-300 link-hairline flex items-center gap-2">
                        View the gallery <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {images.map((img, i) => (
                        <Link
                            to="/gallery"
                            key={img.src}
                            data-testid={`home-gallery-thumb-${i}`}
                            className={`group relative overflow-hidden bg-ink-800 ${i === 0 ? "col-span-2 row-span-2 aspect-square md:aspect-auto" : "aspect-square"}`}
                        >
                            <img
                                src={`${STATIC_BASE}/${img.src}`}
                                alt={`Keneth gallery ${i + 1}`}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {i === 0 && hasVideo && (
                                <span className="absolute inset-0 flex items-center justify-center bg-ink-900/25">
                                    <span className="w-14 h-14 rounded-full border border-brass-400 bg-ink-900/60 backdrop-blur flex items-center justify-center text-brass-400 group-hover:bg-brass-400 group-hover:text-ink-900 transition-colors">
                                        <Play className="w-6 h-6 ml-0.5 fill-current" />
                                    </span>
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};
