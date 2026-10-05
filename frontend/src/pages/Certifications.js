import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Leaf, Award, FileCheck, ExternalLink, ArrowRight, Download, Factory } from "lucide-react";

const CERT_ASSETS = {
    iec: "/certificates/iec.pdf",
    fssai: "/certificates/fssai.pdf",
};

export default function Certifications() {
    return (
        <div className="pt-8 sm:pt-12 pb-24">
            <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
                {/* Header */}
                <p className="text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-brass-400 mb-4">— Verification</p>
                <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-bone-100 tracking-tight leading-none mb-6">Certifications & Trust</h1>
                <p className="text-base sm:text-lg text-bone-300 font-light max-w-2xl leading-relaxed mb-14 sm:mb-20">
                    Every shipment from Keneth Global Inc leaves India under five government licences.
                    We keep them on this page — publicly, transparently — because your buyers deserve to see them before you do.
                </p>

                {/* Big cards — row 1: IEC + FSSAI */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
                    <CertCard
                        icon={ShieldCheck}
                        eyebrow="Directorate General of Foreign Trade"
                        title="Importer-Exporter Code"
                        number="ADOPM2564J"
                        detail="Issued 30 January 2023 by the Government of India, Ministry of Commerce and Industry. Authorises Keneth Global Inc to import and export from and to India."
                        verifyLabel="Verify on DGFT"
                        verifyHref="https://dgft.gov.in"
                        downloadHref={CERT_ASSETS.iec}
                    />
                    <CertCard
                        icon={Leaf}
                        eyebrow="Food Safety & Standards Authority of India"
                        title="FSSAI Licence"
                        number="Ref · 10260705108809121"
                        detail="FoSCoS-compliant food business licence covering manufacturing, repacking, wholesale, retail and export of Indian spices, cereals and beverages."
                        verifyLabel="Verify on FoSCoS"
                        verifyHref="https://foscos.fssai.gov.in"
                        downloadHref={CERT_ASSETS.fssai}
                    />
                </div>

                {/* Row 2: GST + Udyam MSME + PAN */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-20">
                    <CertCard
                        icon={Award}
                        eyebrow="Goods & Services Tax · Uttar Pradesh"
                        title="GST Registration"
                        number="09ADOPM2564J4ZY"
                        detail="Regular GST registration issued 10 February 2026. Valid indefinitely. Digitally signed by Goods and Services Tax Network."
                        verifyLabel="Verify on GST Portal"
                        verifyHref="https://www.gst.gov.in/services/searchtaxpayer"
                    />
                    <CertCard
                        icon={Factory}
                        eyebrow="Ministry of Micro, Small & Medium Enterprises"
                        title="Udyam MSME"
                        number="UDYAM-UP-28-0208361"
                        detail="Registered as a Micro Enterprise under the Udyam scheme, Government of India. Recognised as a bona-fide Indian MSME exporter."
                        verifyLabel="Verify on Udyam Portal"
                        verifyHref="https://udyamregistration.gov.in"
                    />
                    <CertCard
                        icon={FileCheck}
                        eyebrow="Income Tax Department, India"
                        title="Permanent Account Number"
                        number="ADOPM2564J"
                        detail="Registered under the Income Tax Act, 1961. Same identifier as our IEC — as issued to sole proprietorships in India."
                    />
                </div>

                {/* Company snapshot */}
                <div className="border border-white/10 bg-ink-800/40 p-8 sm:p-12">
                    <p className="text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-brass-400 mb-6">— Legal entity</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
                        <div>
                            <h2 className="font-serif text-3xl sm:text-4xl text-bone-100 tracking-tight mb-6">Keneth Global Inc</h2>
                            <div className="space-y-4 text-sm text-bone-300 font-light">
                                <Row label="Nature" value="Proprietorship" />
                                <Row label="Proprietor & Signatory" value="Mr Sanjay Keneth Mal" />
                                <Row label="Established" value="30 January 2023" />
                                <Row label="Enterprise Type" value="Micro (Udyam-registered)" />
                                <Row label="Trade Name" value="KENETH GLOBAL INC" />
                                <Row label="Banking" value="IDBI Bank · IFSC IBKL0000200" />
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] tracking-[0.24em] uppercase text-bone-100/60 mb-3">Registered Address</div>
                            <p className="font-serif text-lg sm:text-xl text-bone-100 leading-relaxed">
                                E-106, RG Luxury Homes<br/>
                                Sector-16B, Thana Bishrakh<br/>
                                Post I.A. Surajpur, Noida<br/>
                                Gautam Buddha Nagar<br/>
                                Uttar Pradesh — 201306, India
                            </p>
                            <div className="mt-6 space-y-2 text-sm text-bone-300">
                                <div><a href="mailto:keneth.sanjay@gmail.com" className="link-hairline text-brass-400">keneth.sanjay@gmail.com</a></div>
                                <div><a href="tel:+919953839245" className="link-hairline text-bone-100/80">+91 99538 39245</a></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA to wholesale */}
                <div className="mt-16 sm:mt-24 text-center">
                    <p className="text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-brass-400 mb-4">— For trade buyers</p>
                    <h2 className="font-serif text-4xl sm:text-5xl text-bone-100 tracking-tight leading-none mb-6">
                        Ready to place a wholesale order?
                    </h2>
                    <p className="text-base sm:text-lg text-bone-300 font-light max-w-xl mx-auto mb-10">
                        Restaurants, hotels, boutiques and importers across Europe already source from us — request our wholesale pricing sheet in one form.
                    </p>
                    <Link
                        to="/wholesale"
                        data-testid="cta-to-wholesale"
                        className="inline-flex items-center gap-3 border border-brass-400 text-brass-400 hover:bg-brass-400 hover:text-ink-900 transition-colors duration-500 px-8 py-4 text-[10px] sm:text-[11px] tracking-[0.28em] uppercase"
                    >
                        Open a wholesale enquiry <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

function CertCard({ icon: Icon, eyebrow, title, number, detail, verifyLabel, verifyHref, downloadHref }) {
    return (
        <div className="border border-white/10 hover:border-brass-400/40 transition-colors p-8 sm:p-10 group">
            <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 border border-brass-400/40 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-brass-400" strokeWidth={1.5} />
                </div>
                <div>
                    <p className="text-[10px] tracking-[0.28em] uppercase text-bone-300/70 mb-1">{eyebrow}</p>
                    <h3 className="font-serif text-2xl sm:text-3xl text-bone-100 leading-tight">{title}</h3>
                </div>
            </div>
            <div className="mb-6 pb-6 border-b border-white/10">
                <div className="text-[9px] tracking-[0.24em] uppercase text-bone-300/70 mb-2">Reference</div>
                <div className="font-serif text-2xl sm:text-3xl text-brass-400 tabular-nums tracking-tight">{number}</div>
            </div>
            <p className="text-sm sm:text-base text-bone-300 font-light leading-relaxed mb-8">{detail}</p>
            <div className="flex flex-wrap gap-3">
                {verifyHref && (
                    <a
                        href={verifyHref}
                        data-testid={`certificate-verify-${number.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-2 border border-brass-400/60 hover:border-brass-400 text-brass-400 hover:bg-brass-400/10 transition-colors px-4 py-2.5 text-[10px] tracking-[0.24em] uppercase"
                    >
                        {verifyLabel} <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                )}
                {downloadHref && (
                    <a
                        href={downloadHref}
                        data-testid={`certificate-download-${number.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-2 text-bone-300 hover:text-brass-400 transition-colors px-4 py-2.5 text-[10px] tracking-[0.24em] uppercase"
                    >
                        Download PDF <Download className="w-3.5 h-3.5" />
                    </a>
                )}
            </div>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex justify-between items-baseline gap-4 pb-3 border-b border-white/5">
            <span className="text-[10px] tracking-[0.24em] uppercase text-bone-100/60">{label}</span>
            <span className="text-bone-100 text-right">{value}</span>
        </div>
    );
}
