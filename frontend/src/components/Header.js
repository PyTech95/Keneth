import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, User, Menu, X, ChevronDown, Search, Heart } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { TID } from "@/constants/testIds";
import { Monogram } from "@/components/Logo";
import { HouseNavigation } from "@/components/HouseNavigation";
import SearchModal from "@/components/SearchModal";

export default function Header() {
    const { t, lang, setLang, languages } = useI18n();
    const { count } = useCart();
    const { count: wishCount } = useWishlist();
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const loc = useLocation();
    useEffect(() => { setOpen(false); setLangOpen(false); }, [loc.key]);
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);
    useEffect(() => {
        const onKey = e => {
            if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(e.target.tagName) && !e.target.isContentEditable) { e.preventDefault(); setSearchOpen(true); }
            if (e.key === "Escape") { setOpen(false); setLangOpen(false); }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);
    const iconClass = "p-2 text-bone-100 hover:text-brass-300 transition-colors";
    return <>
        <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
        {!loc.pathname.startsWith("/payment") && <div className="bg-ink-800 border-b border-white/5 overflow-hidden" data-testid="announcement-bar">
            <div className="whitespace-nowrap py-2.5 flex animate-marquee">
                {[0, 1].map(i => <div key={i} aria-hidden={i === 1} className="flex shrink-0 items-center gap-10 pr-10 text-[10px] sm:text-[11px] uppercase text-bone-200">
                    <span data-testid={`announcement-delivery-${i}`}>{t("announcement.delivery")}</span><span className="text-brass-300">◆</span>
                    <span data-testid={`announcement-spices-${i}`}>{t("announcement.spices")}</span><span className="text-brass-300">◆</span>
                    <span data-testid={`announcement-craft-${i}`}>{t("announcement.craft")}</span><span className="text-brass-300">◆</span>
                </div>)}
            </div>
        </div>}
        <header data-testid="store-header" className="sticky top-0 z-50 bg-ink-900/95 backdrop-blur-xl border-b border-white/10">
            <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-6 py-1 sm:py-2">
                    <Link to="/" data-testid={TID.logo} className="group flex items-center gap-3 sm:gap-4 shrink-0">
                        <Monogram testId="header-logo-mark" className="w-[73px] h-[73px] sm:w-[83px] sm:h-[83px] group-hover:rotate-3 transition-transform duration-500 shrink-0" />
                        <div data-testid="header-logo-text" className="flex flex-col leading-none">
                            <div className="flex items-baseline gap-1.5 sm:gap-2">
                                <span className="font-serif text-xl sm:text-[26px] text-white">Keneth</span>
                                <span className="font-serif italic text-base sm:text-[22px] text-white">Global Inc</span>
                            </div>
                            <span className="hidden sm:block text-[9px] uppercase text-bone-300 mt-1">Est. India · 2023</span>
                        </div>
                    </Link>
                    <div className="flex items-center justify-between sm:justify-end gap-1 sm:gap-3 w-full sm:w-auto border-t sm:border-0 border-white/5">
                        <button type="button" onClick={() => setSearchOpen(true)} data-testid="header-search-btn" className={iconClass} aria-label="Search"><Search className="w-5 h-5" /></button>
                        <div className="relative" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setLangOpen(false); }}>
                            <button type="button" onClick={() => setLangOpen(s => !s)} data-testid={TID.langBtn} aria-expanded={langOpen} aria-label="Language"
                                className={`${iconClass} flex items-center gap-1 text-xs uppercase`}>{languages.find(l => l.code === lang)?.short}<ChevronDown className="w-3 h-3" /></button>
                            {langOpen && <div data-testid="language-menu" className="absolute right-0 top-full mt-2 min-w-[150px] bg-ink-800 border border-white/10 shadow-2xl z-50">
                                {languages.map(l => <button type="button" key={l.code} data-testid={TID.langOption(l.code)} onClick={() => { setLang(l.code); setLangOpen(false); }}
                                    className={`block w-full text-left px-4 py-3 text-xs transition-colors ${lang === l.code ? "text-brass-400" : "text-bone-100 hover:text-brass-400 hover:bg-ink-700"}`}>{l.short} · {l.label}</button>)}
                            </div>}
                        </div>
                        <Link to="/wishlist" data-testid="nav-wishlist" className={`${iconClass} relative`} aria-label="Wishlist"><Heart className="w-5 h-5" />{wishCount > 0 && <Badge id="wishlist-count" value={wishCount} />}</Link>
                        {user ? <>
                            {user.role === "admin" && <Link to="/admin" data-testid={TID.navAdmin} className="hidden md:block text-xs text-brass-300">{t("nav.admin")}</Link>}
                            <Link to="/account" data-testid={TID.navAccount} className={iconClass} aria-label={t("nav.account")}><User className="w-5 h-5" /></Link>
                        </> : <Link to="/login" data-testid={TID.navLogin} className={iconClass} aria-label={t("nav.login")} title={t("nav.login")}><User className="w-5 h-5" /></Link>}
                        <Link to="/cart" data-testid={TID.navCart} className={`${iconClass} relative`} aria-label={t("nav.cart")}><ShoppingBag className="w-5 h-5" />{count > 0 && <Badge id="cart-count" value={count} />}</Link>
                        <button type="button" data-testid="mobile-menu-open" onClick={() => setOpen(true)} className={`lg:hidden ${iconClass}`} aria-label="Menu" aria-expanded={open}><Menu className="w-6 h-6" /></button>
                    </div>
                </div>
                <div className="hidden lg:block border-t border-white/5"><HouseNavigation /></div>
            </div>
        </header>
        {open && createPortal(<div data-testid="mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation" className="fixed inset-0 z-[70] bg-ink-900 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                <Link to="/" data-testid="mobile-menu-logo" className="flex items-center gap-2"><Monogram className="w-[62px] h-[62px]" /><span className="font-serif text-xl text-white">Keneth <i>Global Inc</i></span></Link>
                <button type="button" data-testid="mobile-menu-close" onClick={() => setOpen(false)} className={iconClass} aria-label="Close menu" autoFocus><X className="w-6 h-6" /></button>
            </div>
            <div className="px-5 py-6"><HouseNavigation mobile />
                <div className="border-t border-white/10 mt-6 py-4 flex flex-wrap gap-5 text-sm text-bone-300">
                    {["wholesale", "certifications", "journal"].map(path => <Link key={path} data-testid={`mobile-nav-${path}`} to={`/${path}`} className="capitalize hover:text-brass-300">{path}</Link>)}
                </div>
                {user ? <div className="flex flex-wrap gap-5 py-4 text-sm text-brass-300"><Link data-testid="mobile-nav-account" to="/account">{t("nav.account")}</Link>
                    {user.role === "admin" && <Link data-testid="mobile-nav-admin" to="/admin">{t("nav.admin")}</Link>}
                    <button data-testid={TID.navLogout} type="button" onClick={() => { logout(); setOpen(false); }}>{t("nav.logout")}</button></div>
                    : <Link data-testid="mobile-nav-login" to="/login" className="text-brass-300">{t("nav.login")}</Link>}
            </div>
        </div>, document.body)}
    </>;
}

const Badge = ({ id, value }) => <span data-testid={id} className="absolute -top-1 -right-1 bg-brass-400 text-ink-900 text-[10px] min-w-4 h-4 px-1 flex items-center justify-center rounded-full">{value}</span>;