import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/contexts/I18nContext";
import { X } from "lucide-react";

export default function PaymentCancel() {
    const { t } = useI18n();
    return (
        <div className="min-h-[70vh] flex items-center justify-center px-6">
            <div className="max-w-lg w-full text-center">
                <div className="w-16 h-16 mx-auto mb-8 border border-white/20 flex items-center justify-center">
                    <X className="w-7 h-7 text-bone-300" strokeWidth={1.2} />
                </div>
                <p className="text-[11px] tracking-[0.32em] uppercase text-bone-300 mb-4">— Cancelled</p>
                <h1 className="font-serif text-5xl text-bone-100 tracking-tight mb-6">{t("cancel.title")}</h1>
                <p className="text-bone-300 font-light mb-10">{t("cancel.sub")}</p>
                <Link
                    to="/cart"
                    className="border border-brass-400 text-brass-400 hover:bg-brass-400 hover:text-ink-900 transition-colors duration-500 px-8 py-3.5 text-[11px] tracking-[0.28em] uppercase inline-block"
                >
                    {t("cancel.back")}
                </Link>
            </div>
        </div>
    );
}
