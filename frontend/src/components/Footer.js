import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/contexts/I18nContext";
import { Monogram } from "@/components/Logo";
import { ShieldCheck, Award, Leaf, Factory } from "lucide-react";

export default function Footer() {
    const { t } = useI18n();
    const col = "text-[11px] tracking-[0.22em] uppercase text-bone-100 mb-6";
    const linkCls = "block text-sm text-bone-300 hover:text-brass-400 transition-colors mb-3";

    return (
        <footer className="border-t border-white/10 bg-ink-900 mt-16 sm:mt-24">
            {/* CREDENTIALS STRIP */}
            <div className="border-b border-white/5 bg-ink-800/40">
                <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10 py-10 sm:py-14">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 sm:mb-8">
                        <p className="text-[9px] sm:text-[10px] tracking-[0.4em] uppercase text-bone-300/60">
                            Registered · Certified · Compliant
                        </p>
                        <Link to="/certifications" data-testid="footer-cert-link" className="text-[10px] sm:text-[11px] tracking-[0.28em] uppercase text-brass-400 link-hairline">
                            Verify credentials →
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-8">
                        <Credential
                            icon={ShieldCheck}
                            label="Govt. of India"
                            value="IEC · ADOPM2564J"
                            sub="DGFT-Registered Exporter · Since 2023"
                        />
                        <Credential
                            icon={Leaf}
                            label="FSSAI Compliant"
                            value="Food Safety Licensed"
                            sub="Ref. 10260705108809121"
                        />
                        <Credential
                            icon={Award}
                            label="GST Registered"
                            value="09ADOPM2564J4ZY"
                            sub="Proprietor · Sanjay Keneth Mal"
                        />
                        <Credential
                            icon={Factory}
                            label="Udyam MSME"
                            value="UDYAM-UP-28-0208361"
                            sub="Ministry of MSME · Micro Enterprise"
                        />
                    </div>
                </div>
            </div>

            {/* MAIN GRID */}
            <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10 pt-16 sm:pt-20 pb-8 sm:pb-10">
                <div className="grid grid-cols-2 md:grid-cols-12 gap-8 sm:gap-12">
                    <div className="col-span-2 md:col-span-5">
                        <div className="flex items-center gap-3 mb-4">
                            <Monogram className="w-12 h-12 shrink-0" />
                            <div className="flex items-baseline gap-2">
                                <span className="font-serif text-2xl sm:text-3xl tracking-tight text-bone-100">Keneth</span>
                                <span className="font-serif italic text-xl sm:text-2xl text-brass-400">Global Inc</span>
                            </div>
                        </div>
                        <p className="text-sm text-bone-300 font-light leading-relaxed max-w-md">
                            {t("footer.tagline")}
                        </p>
                        <div className="mt-6 sm:mt-8 text-xs text-bone-300/70 leading-relaxed">
                            <div className="font-serif text-sm text-bone-100 mb-2">Mr Sanjay Keneth Mal · Proprietor</div>
                            E-106, RG Luxury Homes, Sector-16B<br/>
                            Thana Bishrakh, Post I.A. Surajpur<br/>
                            Noida, Gautam Buddha Nagar<br/>
                            Uttar Pradesh — 201306, India
                            <div className="mt-4 space-y-1">
                                <div><a href="mailto:keneth.sanjay@gmail.com" className="link-hairline text-bone-100/80">keneth.sanjay@gmail.com</a></div>
                                <div><a href="tel:+919953839245" className="link-hairline text-bone-100/80">+91 99538 39245</a></div>
                            </div>
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <div className={col}>{t("footer.about")}</div>
                        <Link to="/about" className={linkCls}>{t("footer.about.about")}</Link>
                        <Link to="/craftsmanship" className={linkCls}>{t("footer.about.craft")}</Link>
                        <Link to="/press" className={linkCls}>{t("footer.about.press")}</Link>
                    </div>
                    <div className="md:col-span-2">
                        <div className={col}>{t("footer.shop")}</div>
                        <Link to="/shop/masalas" className={linkCls}>{t("nav.masalas")}</Link>
                        <Link to="/shop/home-decor" className={linkCls}>{t("nav.decor")}</Link>
                        <Link to="/shop/jewelry" className={linkCls}>{t("nav.jewelry")}</Link>
                        <Link to="/shop" className={linkCls}>{t("nav.shop")}</Link>
                    </div>
                    <div className="md:col-span-3">
                        <div className={col}>{t("footer.support")}</div>
                        <Link to="/wholesale" className={linkCls}>Wholesale enquiry</Link>
                        <Link to="/certifications" className={linkCls}>Certifications</Link>
                        <Link to="/journal" className={linkCls}>Journal</Link>
                        <Link to="/wishlist" className={linkCls}>Wishlist</Link>
                        <Link to="/contact" className={linkCls}>{t("footer.support.contact")}</Link>
                        <Link to="/shipping" className={linkCls}>{t("footer.support.shipping")}</Link>
                        <Link to="/returns" className={linkCls}>{t("footer.support.returns")}</Link>
                    </div>
                </div>

                {/* Legal + regulatory */}
                <div className="mt-14 sm:mt-16 pt-6 sm:pt-8 border-t border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-start">
                        <div>
                            <p className="text-[11px] tracking-[0.2em] uppercase text-bone-300/60 leading-relaxed">{t("footer.legal")}</p>
                            <p className="text-[10px] text-bone-300/40 mt-2 leading-relaxed">
                                A proprietorship of Sanjay Keneth Mal · Established 30 January 2023<br/>
                                PAN · ADOPM2564J
                            </p>
                        </div>
                        <div className="flex gap-6 md:justify-end">
                            <a href="#" className="text-[11px] tracking-[0.2em] uppercase text-bone-300/70 hover:text-brass-400 transition-colors">Instagram</a>
                            <a href="#" className="text-[11px] tracking-[0.2em] uppercase text-bone-300/70 hover:text-brass-400 transition-colors">Pinterest</a>
                            <Link to="/journal" className="text-[11px] tracking-[0.2em] uppercase text-bone-300/70 hover:text-brass-400 transition-colors">Journal</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function Credential({ icon: Icon, label, value, sub }) {
    return (
        <div className="text-left">
            <div className="flex items-center gap-2.5 mb-2">
                <Icon className="w-4 h-4 text-brass-400 shrink-0" strokeWidth={1.5} />
                <span className="text-[9px] sm:text-[10px] tracking-[0.28em] uppercase text-brass-400">{label}</span>
            </div>
            <div className="font-serif text-base sm:text-lg text-bone-100 leading-tight mb-1">{value}</div>
            <p className="text-[10px] sm:text-xs text-bone-300/70 font-light leading-snug">{sub}</p>
        </div>
    );
}
