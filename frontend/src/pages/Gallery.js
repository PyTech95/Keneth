import React, { useEffect, useState, useCallback } from "react";
import { api, STATIC_BASE } from "@/lib/api";
import { X, Play, ChevronLeft, ChevronRight } from "lucide-react";

const mediaUrl = (src) => `${STATIC_BASE}/${src.replace(/^gallery\//, "gallery/")}`;

export default function Gallery() {
    const [items, setItems] = useState([]);
    const [error, setError] = useState(false);
    const [lightbox, setLightbox] = useState(null); // index into images
    const [playVideo, setPlayVideo] = useState(false);

    useEffect(() => {
        let active = true;
        api.get("/gallery")
            .then(({ data }) => { if (active) setItems(data); })
            .catch(() => { if (active) setError(true); });
        return () => { active = false; };
    }, []);

    const video = items.find((i) => i.type === "video");
    const images = items.filter((i) => i.type === "image");

    const close = useCallback(() => setLightbox(null), []);
    const prev = useCallback(() => setLightbox((i) => (i > 0 ? i - 1 : images.length - 1)), [images.length]);
    const next = useCallback(() => setLightbox((i) => (i < images.length - 1 ? i + 1 : 0)), [images.length]);

    useEffect(() => {
        if (lightbox === null) return;
        const onKey = (e) => {
            if (e.key === "Escape") close();
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
        };
        window.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
    }, [lightbox, close, prev, next]);

    return (
        <div data-testid="gallery-page">
            {/* HERO */}
            <section className="border-b border-white/10 py-16 sm:py-20 lg:py-28">
                <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
                    <p className="text-xs uppercase tracking-[0.3em] text-brass-300 mb-4">— From the source</p>
                    <h1 data-testid="gallery-heading" className="font-serif text-4xl sm:text-5xl lg:text-6xl text-bone-100 leading-[1.05] max-w-3xl">
                        The Keneth Gallery
                    </h1>
                    <p className="mt-6 text-sm sm:text-base text-bone-300 font-light leading-relaxed max-w-2xl">
                        Behind the harbour mornings, the spice markets of India and the hands that pack every order — a look at where our masalas, dry fruits and crafts truly begin.
                    </p>
                </div>
            </section>

            {/* VIDEO */}
            {video && (
                <section className="py-10 sm:py-14 border-b border-white/5">
                    <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
                        <div className="relative w-full overflow-hidden bg-ink-800 aspect-video">
                            {playVideo ? (
                                <video
                                    data-testid="gallery-video"
                                    src={mediaUrl(video.src)}
                                    className="w-full h-full object-contain bg-black"
                                    controls
                                    autoPlay
                                    playsInline
                                />
                            ) : (
                                <button
                                    type="button"
                                    data-testid="gallery-video-play"
                                    onClick={() => setPlayVideo(true)}
                                    className="group absolute inset-0 w-full h-full flex items-center justify-center"
                                    aria-label="Play film"
                                >
                                    {images[0] && (
                                        <img src={mediaUrl(images[0].src)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                                    )}
                                    <span className="absolute inset-0 bg-ink-900/40" />
                                    <span className="relative z-10 flex flex-col items-center gap-4">
                                        <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-brass-400 bg-ink-900/70 backdrop-blur flex items-center justify-center group-hover:bg-brass-400 group-hover:text-ink-900 text-brass-400 transition-colors">
                                            <Play className="w-7 h-7 ml-1 fill-current" />
                                        </span>
                                        <span className="text-xs uppercase tracking-[0.3em] text-bone-100">Watch the film</span>
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* GRID */}
            <section className="py-12 sm:py-16 lg:py-20">
                <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
                    {error && <p data-testid="gallery-error" className="text-sm text-bone-300">Could not load the gallery. Please try again later.</p>}
                    <div className="columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4 [column-fill:_balance]">
                        {images.map((img, i) => (
                            <button
                                type="button"
                                key={img.src}
                                data-testid={`gallery-item-${i}`}
                                onClick={() => setLightbox(i)}
                                className="group mb-3 sm:mb-4 block w-full overflow-hidden bg-ink-800 break-inside-avoid"
                            >
                                <img
                                    src={mediaUrl(img.src)}
                                    alt={`Keneth gallery ${i + 1}`}
                                    loading="lazy"
                                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* LIGHTBOX */}
            {lightbox !== null && images[lightbox] && (
                <div
                    data-testid="gallery-lightbox"
                    className="fixed inset-0 z-[80] bg-ink-900/95 backdrop-blur-sm flex items-center justify-center"
                    onClick={close}
                >
                    <button type="button" data-testid="gallery-lightbox-close" onClick={close} className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-bone-100 hover:text-brass-400 transition-colors" aria-label="Close">
                        <X className="w-7 h-7" />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-2 sm:left-6 p-2 text-bone-100 hover:text-brass-400 transition-colors" aria-label="Previous">
                        <ChevronLeft className="w-8 h-8" />
                    </button>
                    <img
                        src={mediaUrl(images[lightbox].src)}
                        alt={`Keneth gallery ${lightbox + 1}`}
                        className="max-h-[85vh] max-w-[90vw] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button type="button" onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-2 sm:right-6 p-2 text-bone-100 hover:text-brass-400 transition-colors" aria-label="Next">
                        <ChevronRight className="w-8 h-8" />
                    </button>
                    <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-bone-300">{lightbox + 1} / {images.length}</span>
                </div>
            )}
        </div>
    );
}
