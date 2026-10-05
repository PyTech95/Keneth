import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, formatErr } from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";
import { useCart } from "@/contexts/CartContext";
import { Check } from "lucide-react";

export default function PaymentSuccess() {
    const [params] = useSearchParams();
    const sessionId = params.get("session_id");
    const { t } = useI18n();
    const { clear } = useCart();
    const [status, setStatus] = useState(null);
    const [attempts, setAttempts] = useState(0);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!sessionId) return;
        let cancelled = false;
        const poll = async () => {
            try {
                const { data } = await api.get(`/checkout/status/${sessionId}`);
                if (cancelled) return;
                setStatus(data);
                if (data.payment_status === "paid") {
                    clear();
                    return;
                }
                if (attempts < 15) {
                    setTimeout(() => setAttempts((a) => a + 1), 2000);
                }
            } catch (e) {
                setError(formatErr(e));
            }
        };
        poll();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, attempts]);

    const paid = status?.payment_status === "paid";

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-6">
            <div className="max-w-lg w-full text-center">
                <div className="w-16 h-16 mx-auto mb-8 border border-brass-400 flex items-center justify-center">
                    <Check className="w-7 h-7 text-brass-400" strokeWidth={1.2} />
                </div>
                <p className="text-[11px] tracking-[0.32em] uppercase text-brass-400 mb-4">
                    {paid ? "— Confirmed" : "— Processing"}
                </p>
                <h1 className="font-serif text-5xl lg:text-6xl text-bone-100 tracking-tight leading-none mb-6">
                    {t("success.title")}
                </h1>
                <p className="text-bone-300 font-light leading-relaxed mb-8">
                    {paid ? t("success.sub") : t("checkout.processing")}
                </p>
                {error && <p className="text-destructive text-sm mb-4">{error}</p>}
                {sessionId && (
                    <div className="text-xs text-bone-300/70 mb-10 tracking-widest uppercase">
                        {t("success.orderId")}: <span className="text-bone-100">{sessionId.slice(-16)}</span>
                    </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/account"
                        className="border border-brass-400 text-brass-400 hover:bg-brass-400 hover:text-ink-900 transition-colors duration-500 px-8 py-3.5 text-[11px] tracking-[0.28em] uppercase"
                    >
                        {t("success.viewOrders")}
                    </Link>
                    <Link
                        to="/shop"
                        className="text-[11px] tracking-[0.28em] uppercase text-bone-300 hover:text-brass-400 transition-colors px-8 py-3.5 link-hairline"
                    >
                        {t("cart.continue")}
                    </Link>
                </div>
            </div>
        </div>
    );
}
