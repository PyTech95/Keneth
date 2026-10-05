import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { api, formatErr, STATIC_BASE } from "@/lib/api";
import { formatPrice, currencyFor } from "@/lib/currency";
import { TID } from "@/constants/testIds";
import { Minus, Plus, X, Gift } from "lucide-react";
import { toast } from "sonner";

const GIFT_WRAP_EUR = 5;

const resolveImg = (img) => {
    if (!img) return "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80";
    if (img.startsWith("http")) return img;
    return `${STATIC_BASE}/${img}`;
};

export default function Cart() {
    const { items, remove, setQty, subtotal, clear } = useCart();
    const { user } = useAuth();
    const { t, lang } = useI18n();
    const [loading, setLoading] = useState(false);
    const [giftWrap, setGiftWrap] = useState(false);
    const [giftMessage, setGiftMessage] = useState("");
    const currency = currencyFor(lang);
    const shippingEur = subtotal >= 120 ? 0 : 12;
    const giftEur = giftWrap ? GIFT_WRAP_EUR : 0;
    const grandTotal = subtotal + shippingEur + giftEur;

    const handleCheckout = async () => {
        if (items.length === 0) return;
        setLoading(true);
        try {
            const { data } = await api.post("/checkout/session", {
                items: items.map((i) => ({ slug: i.slug, quantity: i.quantity })),
                origin_url: window.location.origin,
                email: user?.email,
                gift_wrap: giftWrap,
                gift_message: giftWrap ? giftMessage : "",
            });
            window.location.href = data.checkout_url;
        } catch (err) {
            toast.error(formatErr(err));
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
                <p className="text-[11px] tracking-[0.32em] uppercase text-brass-400 mb-4">— {t("nav.cart")}</p>
                <h1 className="font-serif text-5xl lg:text-6xl text-bone-100 tracking-tight mb-6">{t("cart.title")}</h1>
                <p className="text-bone-300 font-light max-w-md mb-10">{t("cart.empty")}</p>
                <Link
                    to="/shop"
                    className="border border-brass-400 text-brass-400 hover:bg-brass-400 hover:text-ink-900 transition-colors duration-500 px-8 py-3.5 text-[11px] tracking-[0.28em] uppercase"
                >
                    {t("cart.continue")}
                </Link>
            </div>
        );
    }

    return (
        <div className="pt-12 pb-20">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
                <p className="text-[11px] tracking-[0.32em] uppercase text-brass-400 mb-4">— {t("nav.cart")}</p>
                <h1 className="font-serif text-5xl lg:text-6xl text-bone-100 tracking-tight leading-none mb-16">
                    {t("cart.title")}
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    <div className="lg:col-span-8">
                        <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-white/10 text-[10px] tracking-[0.24em] uppercase text-bone-300">
                            <div className="col-span-6">{t("cart.item")}</div>
                            <div className="col-span-3 text-center">{t("cart.qty")}</div>
                            <div className="col-span-3 text-right">{t("cart.total")}</div>
                        </div>
                        {items.map((item) => (
                            <div key={item.slug} className="grid grid-cols-12 gap-4 py-8 border-b border-white/5 items-center">
                                <div className="col-span-12 md:col-span-6 flex gap-5">
                                    <div className="w-24 h-28 bg-ink-800 overflow-hidden shrink-0">
                                        <img src={resolveImg(item.image)} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col justify-between py-1">
                                        <Link to={`/product/${item.slug}`} className="font-serif text-xl text-bone-100 hover:text-brass-400 transition-colors leading-tight">
                                            {item.name}
                                        </Link>
                                        <button
                                            data-testid={TID.cartRemove(item.slug)}
                                            onClick={() => remove(item.slug)}
                                            className="text-[10px] tracking-[0.24em] uppercase text-bone-300 hover:text-brass-400 transition-colors flex items-center gap-1 self-start"
                                        >
                                            <X className="w-3 h-3" /> {t("cart.remove")}
                                        </button>
                                    </div>
                                </div>
                                <div className="col-span-6 md:col-span-3 flex md:justify-center">
                                    <div className="flex items-center border border-white/15">
                                        <button onClick={() => setQty(item.slug, item.quantity - 1)} className="w-9 h-10 flex items-center justify-center text-bone-100/70 hover:text-brass-400">
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span data-testid={TID.cartQty(item.slug)} className="w-9 text-center text-bone-100 tabular-nums text-sm">{item.quantity}</span>
                                        <button onClick={() => setQty(item.slug, item.quantity + 1)} className="w-9 h-10 flex items-center justify-center text-bone-100/70 hover:text-brass-400">
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                <div className="col-span-6 md:col-span-3 text-right font-serif text-xl text-brass-400">
                                    {formatPrice(item.price * item.quantity, lang)}
                                </div>
                            </div>
                        ))}
                        <button
                            data-testid={TID.cartClear}
                            onClick={clear}
                            className="mt-8 text-[10px] tracking-[0.24em] uppercase text-bone-300 hover:text-brass-400 transition-colors"
                        >
                            Clear cart
                        </button>

                        {/* GIFT WRAP */}
                        <div className={`mt-10 border p-6 sm:p-7 transition-colors ${giftWrap ? "border-brass-400/60 bg-brass-400/[0.04]" : "border-white/10 bg-ink-800/40"}`}>
                            <label className="flex items-start gap-4 cursor-pointer">
                                <input
                                    type="checkbox"
                                    data-testid={TID.cartGiftWrap}
                                    checked={giftWrap}
                                    onChange={(e) => setGiftWrap(e.target.checked)}
                                    className="mt-1 w-4 h-4 accent-[#C5A059] shrink-0"
                                />
                                <img
                                    src="/gift-wrap.jpg"
                                    alt="Premium gift wrap preview"
                                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover shrink-0 border border-white/10"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="flex items-center gap-2 font-serif text-lg text-bone-100">
                                            <Gift className="w-4 h-4 text-brass-400" /> {t("cart.giftwrap.title")}
                                        </span>
                                        <span className="text-brass-400 font-serif text-lg shrink-0">+{formatPrice(GIFT_WRAP_EUR, lang)}</span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-bone-300 font-light mt-1 leading-relaxed">{t("cart.giftwrap.desc")}</p>
                                </div>
                            </label>
                            {giftWrap && (
                                <div className="mt-5 pl-8">
                                    <label className="block text-[10px] tracking-[0.24em] uppercase text-bone-300 mb-2">{t("cart.giftwrap.note")}</label>
                                    <textarea
                                        data-testid={TID.cartGiftMessage}
                                        value={giftMessage}
                                        onChange={(e) => setGiftMessage(e.target.value.slice(0, 500))}
                                        rows={3}
                                        placeholder={t("cart.giftwrap.notePlaceholder")}
                                        className="w-full bg-transparent border border-white/15 rounded-none text-bone-100 text-sm px-4 py-3 focus:outline-none focus:border-brass-400 transition-colors placeholder:text-bone-300/60 resize-none"
                                    />
                                    <div className="text-[10px] text-bone-300/60 mt-1 text-right tabular-nums">{giftMessage.length}/500</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-4">
                        <div className="bg-ink-800/60 p-8 border border-white/5">
                            <p className="text-[11px] tracking-[0.32em] uppercase text-brass-400 mb-6">— Summary</p>
                            <div className="flex justify-between text-sm text-bone-300 mb-4">
                                <span>{t("cart.subtotal")}</span>
                                <span className="text-bone-100 tabular-nums">{formatPrice(subtotal, lang)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-bone-300 mb-4">
                                <span>Shipping</span>
                                <span className="text-bone-100">{subtotal >= 120 ? "Complimentary" : formatPrice(12, lang)}</span>
                            </div>
                            {giftWrap && (
                                <div className="flex justify-between text-sm text-bone-300 mb-4">
                                    <span className="flex items-center gap-1.5"><Gift className="w-3.5 h-3.5 text-brass-400" /> {t("cart.giftwrap.line")}</span>
                                    <span className="text-bone-100 tabular-nums">{formatPrice(GIFT_WRAP_EUR, lang)}</span>
                                </div>
                            )}
                            <div className="pb-6 mb-6 border-b border-white/10" />
                            <div className="flex justify-between items-baseline mb-8">
                                <span className="text-[11px] tracking-[0.28em] uppercase text-bone-100">{t("cart.total")}</span>
                                <span className="font-serif text-3xl text-brass-400 tabular-nums">
                                    {formatPrice(grandTotal, lang)}
                                </span>
                            </div>
                            <button
                                data-testid={TID.cartCheckout}
                                onClick={handleCheckout}
                                disabled={loading}
                                className="w-full bg-brass-400 text-ink-900 hover:bg-brass-300 disabled:opacity-60 disabled:cursor-not-allowed py-4 text-[11px] tracking-[0.28em] uppercase transition-colors"
                            >
                                {loading ? t("checkout.processing") : t("cart.checkout")}
                            </button>
                            <Link
                                to="/shop"
                                className="block text-center mt-4 text-[10px] tracking-[0.24em] uppercase text-bone-300 hover:text-brass-400 transition-colors py-3"
                            >
                                {t("cart.continue")}
                            </Link>
                            <p className="text-[10px] text-bone-300/60 mt-6 text-center leading-relaxed">
                                Secure checkout · Test card 4242 4242 4242 4242
                                {currency.code !== "EUR" && (
                                    <><br/>Payment settled in EUR at Stripe · your card is charged the equivalent</>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
