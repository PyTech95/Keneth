import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, STATIC_BASE } from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";
import { ArrowRight } from "lucide-react";

const coverSrc = (p) => p?.cover_image ? `${STATIC_BASE}/${p.cover_image}` : p?.cover_hint;

const CAT_LABEL = {
    spices: "The Spice House",
    textiles: "The Fabric House",
    jewelry: "The Jewel House",
};

export default function Journal() {
    const { tr } = useI18n();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/journal").then(({ data }) => {
            setPosts(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    return (
        <div className="pt-12 pb-24">
            <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
                <p className="text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-brass-400 mb-4">— The Dispatch</p>
                <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-bone-100 tracking-tight leading-none mb-4">Journal</h1>
                <p className="text-base sm:text-lg text-bone-300 font-light max-w-2xl mb-14 sm:mb-20">
                    Slow essays on craft, provenance, and the makers we work with. Published seasonally.
                </p>

                {loading ? (
                    <div className="py-24 text-center text-bone-300 text-sm tracking-widest uppercase">Loading…</div>
                ) : posts.length === 0 ? (
                    <div className="py-24 text-center text-bone-300 font-light">No dispatches yet — check back soon.</div>
                ) : (
                    <div className="space-y-14 sm:space-y-20">
                        {/* Featured (first) */}
                        {posts[0] && (
                            <Link to={`/journal/${posts[0].slug}`} className="group grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                                <div className="lg:col-span-7 aspect-[16/10] card-image-wrap bg-ink-800 overflow-hidden">
                                    <img src={coverSrc(posts[0])} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="lg:col-span-5">
                                    <p className="text-[10px] sm:text-[11px] tracking-[0.28em] uppercase text-brass-400 mb-4">
                                        {CAT_LABEL[posts[0].category] || "Journal"} · {posts[0].read_time} min read
                                    </p>
                                    <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-bone-100 tracking-tight leading-tight group-hover:text-brass-400 transition-colors mb-4 sm:mb-6">
                                        {tr(posts[0].title)}
                                    </h2>
                                    <p className="text-base sm:text-lg text-bone-300 font-light leading-relaxed mb-6">
                                        {tr(posts[0].excerpt)}
                                    </p>
                                    <span className="inline-flex items-center gap-3 text-[11px] tracking-[0.28em] uppercase text-brass-400 group-hover:gap-5 transition-all">
                                        Read essay <ArrowRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </Link>
                        )}

                        {/* Rest */}
                        {posts.length > 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 border-t border-white/5 pt-14 sm:pt-20">
                                {posts.slice(1).map((post) => (
                                    <Link key={post.slug} to={`/journal/${post.slug}`} className="group">
                                        <div className="aspect-[16/10] card-image-wrap bg-ink-800 overflow-hidden mb-5">
                                            <img src={coverSrc(post)} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <p className="text-[10px] tracking-[0.28em] uppercase text-brass-400 mb-3">
                                            {CAT_LABEL[post.category] || "Journal"} · {post.read_time} min
                                        </p>
                                        <h3 className="font-serif text-2xl sm:text-3xl text-bone-100 tracking-tight leading-tight group-hover:text-brass-400 transition-colors mb-2 sm:mb-3">
                                            {tr(post.title)}
                                        </h3>
                                        <p className="text-sm sm:text-base text-bone-300 font-light leading-relaxed">
                                            {tr(post.excerpt)}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
