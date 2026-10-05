import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api, STATIC_BASE } from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";
import { ChevronRight, ArrowLeft } from "lucide-react";

const CAT_LABEL = {
    spices: "The Spice House",
    textiles: "The Fabric House",
    jewelry: "The Jewel House",
};

export default function JournalPost() {
    const { slug } = useParams();
    const nav = useNavigate();
    const { tr, lang } = useI18n();
    const [post, setPost] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        api.get(`/journal/${slug}`).then(({ data }) => setPost(data)).catch(() => nav("/journal"));
    }, [slug, nav]);

    if (!post) return <div className="py-40 text-center text-bone-300 text-sm tracking-widest uppercase">Loading…</div>;

    const bodyList = (post.body?.[lang] && post.body[lang].length ? post.body[lang] : post.body?.en) || [];
    const cover = post.cover_image ? `${STATIC_BASE}/${post.cover_image}` : post.cover_hint;

    return (
        <article className="pb-24">
            {/* Cover */}
            <div className="relative h-[55vh] min-h-[400px] w-full overflow-hidden">
                <img src={cover} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-ink-900/40 via-ink-900/20 to-ink-900" />
                <div className="absolute bottom-0 left-0 right-0 pb-12 sm:pb-16">
                    <div className="max-w-3xl mx-auto px-5 sm:px-6">
                        <p className="text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-brass-400 mb-4">
                            {CAT_LABEL[post.category] || "Journal"} · {post.read_time} min read
                        </p>
                        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-bone-100 tracking-tight leading-[1.05]">
                            {tr(post.title)}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Meta */}
            <div className="max-w-3xl mx-auto px-5 sm:px-6 pt-10">
                <nav className="flex items-center gap-2 text-[10px] tracking-[0.24em] uppercase text-bone-300/70 mb-8">
                    <Link to="/" className="hover:text-brass-400 transition-colors">Home</Link>
                    <ChevronRight className="w-3 h-3" />
                    <Link to="/journal" className="hover:text-brass-400 transition-colors">Journal</Link>
                </nav>
                <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-12">
                    <div>
                        <p className="text-xs tracking-[0.2em] uppercase text-bone-300/70">By</p>
                        <p className="font-serif text-lg text-bone-100 mt-1">{post.author}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs tracking-[0.2em] uppercase text-bone-300/70">Published</p>
                        <p className="font-serif text-lg text-bone-100 mt-1">
                            {new Date(post.date).toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="space-y-8">
                    {bodyList.map((para, i) => (
                        <p
                            key={i}
                            className={`font-light text-bone-100/90 leading-[1.85] ${
                                i === 0 ? "text-xl sm:text-2xl first-letter:font-serif first-letter:italic first-letter:text-5xl sm:first-letter:text-6xl first-letter:leading-none first-letter:float-left first-letter:pr-3 first-letter:pt-1 first-letter:text-brass-400" : "text-base sm:text-lg"
                            }`}
                        >
                            {para}
                        </p>
                    ))}
                </div>

                {/* End rule */}
                <div className="mt-16 text-center">
                    <p className="text-brass-400 text-2xl">◆</p>
                </div>

                {/* Back */}
                <div className="mt-16 border-t border-white/10 pt-8">
                    <Link
                        to="/journal"
                        className="inline-flex items-center gap-3 text-[11px] tracking-[0.28em] uppercase text-brass-400 hover:gap-5 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" /> All essays
                    </Link>
                </div>
            </div>
        </article>
    );
}
