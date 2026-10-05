import React, { useState } from "react";
import { ShieldCheck, FileText, ExternalLink, Download } from "lucide-react";

const CERT_PDF = "/certificates/fssai.pdf";

const SUMMARY_ROWS = [
    { label: "License Number", value: "12726999000728" },
    { label: "FoSCoS Reference", value: "10260705108809121" },
    { label: "Licensee", value: "KENETH GLOBAL INC" },
    { label: "Category", value: "Central License" },
    { label: "Issuing Authority", value: "Food Safety & Standards Authority of India" },
    { label: "Kind of Business", value: "Importer · Wholesaler · Retailer · Trader / Exporter" },
    { label: "Registered Office", value: "E-106, RG Luxury Homes, Sector-16B, Noida, Uttar Pradesh — 201306" },
    { label: "Place of Issue", value: "FSSAI Delhi" },
    { label: "Issued On", value: "18 September 2026" },
    { label: "Fee Paid Upto", value: "17 September 2027" },
];

export default function CertificateSection() {
    const [view, setView] = useState("summary");

    return (
        <section
            data-testid="home-certificate-section"
            className="py-20 sm:py-24 lg:py-32 border-t border-white/5 bg-ink-800/30"
        >
            <div className="max-w-[1100px] mx-auto px-5 sm:px-6 lg:px-10">
                {/* Header */}
                <div className="flex items-start gap-4 mb-10 sm:mb-14">
                    <div className="w-12 h-12 border border-brass-400/40 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5 text-brass-400" strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-brass-400 mb-2">— Government Licence</p>
                        <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-bone-100 tracking-tight leading-none">
                            FSSAI Food Safety Licence
                        </h2>
                    </div>
                </div>

                {/* Toggle */}
                <div className="flex gap-2 mb-10 border-b border-white/10">
                    <ToggleButton
                        active={view === "summary"}
                        onClick={() => setView("summary")}
                        testid="certificate-tab-summary"
                        icon={FileText}
                    >
                        Summary
                    </ToggleButton>
                    <ToggleButton
                        active={view === "certificate"}
                        onClick={() => setView("certificate")}
                        testid="certificate-tab-certificate"
                        icon={ShieldCheck}
                    >
                        Certificate
                    </ToggleButton>
                </div>

                {/* Summary view */}
                {view === "summary" && (
                    <div data-testid="certificate-summary-panel" className="border border-white/10 bg-ink-900/40 p-8 sm:p-12">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-5">
                            {SUMMARY_ROWS.map((row) => (
                                <div key={row.label} className="flex flex-col gap-1 pb-4 border-b border-white/5">
                                    <span className="text-[10px] tracking-[0.24em] uppercase text-bone-100/55">{row.label}</span>
                                    <span className="text-bone-100 text-sm sm:text-base font-light leading-relaxed">{row.value}</span>
                                </div>
                            ))}
                        </div>
                        <p className="mt-8 text-xs text-bone-300/60 font-light leading-relaxed">
                            Central Licence granted under the Food Safety and Standards Act, 2006. View the full Form C certificate using the tab above.
                        </p>
                    </div>
                )}

                {/* Certificate view */}
                {view === "certificate" && (
                    <div data-testid="certificate-document-panel">
                        <div className="border border-white/10 bg-white p-3 sm:p-5">
                            <img
                                src="/certificates/fssai-page1.png"
                                alt="FSSAI food safety licence — Keneth Global Inc"
                                data-testid="certificate-preview-image"
                                className="w-full h-auto block"
                                loading="lazy"
                            />
                        </div>
                        <div className="flex flex-wrap gap-3 mt-5">
                            <a
                                href={CERT_PDF}
                                data-testid="certificate-open-full"
                                target="_blank"
                                rel="noreferrer noopener"
                                className="inline-flex items-center gap-2 border border-brass-400/60 hover:border-brass-400 text-brass-400 hover:bg-brass-400/10 transition-colors px-4 py-2.5 text-[10px] tracking-[0.24em] uppercase"
                            >
                                Open full certificate (8 pages) <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <a
                                href={CERT_PDF}
                                download
                                data-testid="certificate-download-full"
                                className="inline-flex items-center gap-2 text-bone-300 hover:text-brass-400 transition-colors px-4 py-2.5 text-[10px] tracking-[0.24em] uppercase"
                            >
                                Download PDF <Download className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

function ToggleButton({ active, onClick, children, testid, icon: Icon }) {
    return (
        <button
            type="button"
            onClick={onClick}
            data-testid={testid}
            aria-pressed={active}
            className={`inline-flex items-center gap-2 px-5 sm:px-7 py-3.5 text-[10px] sm:text-[11px] tracking-[0.24em] uppercase transition-colors duration-300 border-b-2 -mb-px ${
                active
                    ? "border-brass-400 text-brass-400"
                    : "border-transparent text-bone-300/70 hover:text-bone-100"
            }`}
        >
            <Icon className="w-3.5 h-3.5" strokeWidth={1.6} />
            {children}
        </button>
    );
}
