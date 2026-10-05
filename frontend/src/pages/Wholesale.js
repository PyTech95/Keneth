import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api, formatErr } from "@/lib/api";
import { ShieldCheck, Send, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

const INTEREST_OPTIONS = [
    { v: "spices", label: "Indian Spices" },
    { v: "home-decor", label: "Home Decor Textiles" },
    { v: "jewelry", label: "Artisan Jewelry" },
    { v: "all", label: "All three verticals" },
];

const VOLUME_OPTIONS = [
    { v: "25-100kg", label: "25 — 100 kg / month" },
    { v: "100-500kg", label: "100 — 500 kg / month" },
    { v: "500kg+", label: "500 kg + / month" },
    { v: "custom", label: "Custom · to be discussed" },
];

const COUNTRIES = [
    "Germany", "France", "Italy", "Spain", "Netherlands", "Belgium", "Switzerland",
    "Austria", "United Kingdom", "Sweden", "Denmark", "Norway", "Portugal", "Ireland",
    "Greece", "Poland", "Czech Republic", "United States", "Canada", "Other",
];

const input = "w-full bg-transparent border-b border-white/20 rounded-none text-bone-100 py-3 focus:outline-none focus:border-brass-400 transition-colors placeholder:text-bone-300/40";
const label = "text-[10px] tracking-[0.28em] uppercase text-bone-300/70 mb-2 block";

export default function Wholesale() {
    const [form, setForm] = useState({
        company: "", contact_name: "", email: "", phone: "",
        country: "Germany", interest: "spices", volume: "25-100kg", message: "",
    });
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [err, setErr] = useState("");

    const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setErr("");
        setLoading(true);
        try {
            await api.post("/wholesale/enquiry", form);
            setDone(true);
            toast.success("Enquiry received");
        } catch (e2) {
            setErr(formatErr(e2));
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
                <div className="max-w-lg w-full text-center">
                    <div className="w-16 h-16 mx-auto mb-8 border border-brass-400 flex items-center justify-center">
                        <Check className="w-7 h-7 text-brass-400" strokeWidth={1.2} />
                    </div>
                    <p className="text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-brass-400 mb-4">— Received</p>
                    <h1 className="font-serif text-5xl sm:text-6xl text-bone-100 tracking-tight leading-none mb-6">Thank you.</h1>
                    <p className="text-bone-300 font-light leading-relaxed mb-8">
                        Your wholesale enquiry is with our export desk. Mr Keneth or a member of his team will reply within one business day (IST) with pricing, samples, and a proforma invoice.
                    </p>
                    <p className="text-xs sm:text-sm text-bone-300/70 mb-10">
                        In the meantime, feel free to browse our journal or download our verified certificates.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/certifications"
                            className="border border-brass-400 text-brass-400 hover:bg-brass-400 hover:text-ink-900 transition-colors duration-500 px-8 py-3.5 text-[11px] tracking-[0.28em] uppercase"
                        >
                            View certifications
                        </Link>
                        <Link
                            to="/journal"
                            className="text-[11px] tracking-[0.28em] uppercase text-bone-300 hover:text-brass-400 transition-colors px-8 py-3.5 link-hairline"
                        >
                            Read the journal
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-8 sm:pt-12 pb-24">
            <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-16">
                    {/* Left column — pitch */}
                    <div className="lg:col-span-5 lg:sticky lg:top-32 self-start">
                        <p className="text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-brass-400 mb-4">— Wholesale desk</p>
                        <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-bone-100 tracking-tight leading-[0.95] mb-6 sm:mb-8">
                            For chefs, boutiques & importers
                        </h1>
                        <p className="text-base sm:text-lg text-bone-300 font-light leading-relaxed mb-8">
                            We supply European restaurants, delis and design stores from 25kg trial cartons upwards. Fill out the brief and we will reply within one business day with a pricing sheet, sample availability, and Incoterm options.
                        </p>

                        <div className="border-t border-white/10 pt-6 sm:pt-8 space-y-4 sm:space-y-5">
                            <Perk num="01" title="Direct from source" body="No middlemen. Same workshops, wholesale margins." />
                            <Perk num="02" title="EU-ready paperwork" body="HS codes, FSSAI certificate, phytosanitary docs — all handled." />
                            <Perk num="03" title="Sample kits" body="Complimentary sample sets of up to 500g per SKU for verified buyers." />
                        </div>

                        <Link
                            to="/certifications"
                            className="inline-flex items-center gap-3 mt-8 text-[10px] sm:text-[11px] tracking-[0.28em] uppercase text-brass-400 hover:gap-5 transition-all"
                        >
                            <ShieldCheck className="w-4 h-4" /> View certifications <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Right column — form */}
                    <div className="lg:col-span-7">
                        <form onSubmit={submit} className="border border-white/10 bg-ink-800/40 p-6 sm:p-10 space-y-7 sm:space-y-8">
                            <p className="text-[10px] tracking-[0.28em] uppercase text-brass-400 pb-4 border-b border-white/10">Your brief</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                <div>
                                    <label className={label}>Company / restaurant *</label>
                                    <input required data-testid="ws-company" value={form.company} onChange={(e) => update("company", e.target.value)} className={input} />
                                </div>
                                <div>
                                    <label className={label}>Your name *</label>
                                    <input required data-testid="ws-contact" value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)} className={input} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                <div>
                                    <label className={label}>Email *</label>
                                    <input required type="email" data-testid="ws-email" value={form.email} onChange={(e) => update("email", e.target.value)} className={input} />
                                </div>
                                <div>
                                    <label className={label}>Phone / WhatsApp</label>
                                    <input data-testid="ws-phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} className={input} />
                                </div>
                            </div>

                            <div>
                                <label className={label}>Country of delivery *</label>
                                <select
                                    required
                                    data-testid="ws-country"
                                    value={form.country}
                                    onChange={(e) => update("country", e.target.value)}
                                    className={`${input} appearance-none cursor-pointer`}
                                >
                                    {COUNTRIES.map((c) => <option key={c} value={c} className="bg-ink-800">{c}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className={label}>Product interest *</label>
                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    {INTEREST_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.v}
                                            type="button"
                                            data-testid={`ws-interest-${opt.v}`}
                                            onClick={() => update("interest", opt.v)}
                                            className={`border py-3.5 px-4 text-[10px] sm:text-[11px] tracking-[0.24em] uppercase transition-colors text-left ${
                                                form.interest === opt.v
                                                    ? "border-brass-400 text-brass-400 bg-brass-400/5"
                                                    : "border-white/15 text-bone-100 hover:border-white/40"
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className={label}>Estimated monthly volume *</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    {VOLUME_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.v}
                                            type="button"
                                            data-testid={`ws-volume-${opt.v}`}
                                            onClick={() => update("volume", opt.v)}
                                            className={`border py-3.5 px-4 text-[10px] sm:text-[11px] tracking-[0.24em] uppercase transition-colors text-left ${
                                                form.volume === opt.v
                                                    ? "border-brass-400 text-brass-400 bg-brass-400/5"
                                                    : "border-white/15 text-bone-100 hover:border-white/40"
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className={label}>Tell us about your business (optional)</label>
                                <textarea
                                    rows={4}
                                    data-testid="ws-message"
                                    value={form.message}
                                    onChange={(e) => update("message", e.target.value)}
                                    placeholder="e.g. Michelin-star restaurant in Munich looking for single-origin cardamom for a tasting menu…"
                                    className={`${input} resize-y`}
                                />
                            </div>

                            {err && <p className="text-destructive text-sm">{err}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                data-testid="ws-submit"
                                className="w-full bg-brass-400 text-ink-900 hover:bg-brass-300 disabled:opacity-60 py-4 text-[11px] tracking-[0.28em] uppercase transition-colors inline-flex items-center justify-center gap-3"
                            >
                                {loading ? "Sending…" : <>Send enquiry <Send className="w-4 h-4" /></>}
                            </button>
                            <p className="text-[10px] sm:text-xs text-bone-300/60 leading-relaxed text-center">
                                By submitting you agree to be contacted at the email above about wholesale pricing. We never share your details.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Perk({ num, title, body }) {
    return (
        <div className="flex gap-4 sm:gap-5">
            <div className="font-serif text-2xl text-brass-400 shrink-0 tabular-nums">{num}</div>
            <div>
                <div className="font-serif text-lg text-bone-100 mb-1">{title}</div>
                <p className="text-sm text-bone-300 font-light leading-relaxed">{body}</p>
            </div>
        </div>
    );
}
