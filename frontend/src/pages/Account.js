import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { formatPrice } from "@/lib/currency";
import { api } from "@/lib/api";

const badgeCls = {
    paid: "border-brass-400 text-brass-400",
    completed: "border-brass-400 text-brass-400",
    shipped: "border-emerald-400/60 text-emerald-300",
    delivered: "border-emerald-400/60 text-emerald-300",
    pending: "border-white/20 text-bone-300",
    initiated: "border-white/20 text-bone-300",
    cancelled: "border-destructive/60 text-destructive",
    failed: "border-destructive/60 text-destructive",
};

export default function Account() {
    const { user, ready, logout } = useAuth();
    const { t, lang } = useI18n();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        api.get("/orders/mine").then(({ data }) => {
            setOrders(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [user]);

    if (!ready) return <div className="py-40 text-center text-bone-300">{t("common.loading")}</div>;
    if (!user) return <Navigate to="/login" state={{ from: "/account" }} replace />;

    return (
        <div className="pt-12 pb-20">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
                <div className="flex justify-between items-end flex-wrap gap-6 mb-16">
                    <div>
                        <p className="text-[11px] tracking-[0.32em] uppercase text-brass-400 mb-4">— {user.name}</p>
                        <h1 className="font-serif text-5xl lg:text-6xl text-bone-100 tracking-tight leading-none">{t("acct.title")}</h1>
                        <p className="text-bone-300 font-light mt-3">{t("acct.sub")}</p>
                    </div>
                    <button onClick={logout} className="text-[11px] tracking-[0.28em] uppercase text-bone-300 hover:text-brass-400 transition-colors">
                        {t("nav.logout")}
                    </button>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-bone-300">{t("common.loading")}</div>
                ) : orders.length === 0 ? (
                    <div className="py-20 text-center">
                        <p className="text-bone-300 font-light mb-6">{t("acct.empty")}</p>
                        <Link to="/shop" className="border border-brass-400 text-brass-400 hover:bg-brass-400 hover:text-ink-900 transition-colors duration-500 px-8 py-3.5 text-[11px] tracking-[0.28em] uppercase inline-block">
                            {t("cart.continue")}
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((o) => (
                            <div key={o.id} className="border border-white/10 hover:border-brass-400/50 transition-colors p-6 lg:p-8">
                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 items-center">
                                    <div className="col-span-2 lg:col-span-1">
                                        <div className="text-[10px] tracking-[0.24em] uppercase text-bone-300/70 mb-1">{t("acct.orderId")}</div>
                                        <div className="font-serif text-lg text-bone-100">#{o.id.slice(-8)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] tracking-[0.24em] uppercase text-bone-300/70 mb-1">{t("acct.date")}</div>
                                        <div className="text-sm text-bone-100">{new Date(o.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] tracking-[0.24em] uppercase text-bone-300/70 mb-1">{t("acct.items")}</div>
                                        <div className="text-sm text-bone-100">{o.items?.length || 0}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] tracking-[0.24em] uppercase text-bone-300/70 mb-1">{t("acct.amount")}</div>
                                        <div className="font-serif text-lg text-brass-400">{formatPrice(o.amount, lang)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] tracking-[0.24em] uppercase text-bone-300/70 mb-1">{t("acct.status")}</div>
                                        <span className={`inline-block border px-3 py-1 text-[10px] tracking-[0.24em] uppercase ${badgeCls[o.status] || "border-white/20 text-bone-300"}`}>
                                            {o.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
