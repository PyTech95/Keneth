import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { formatErr } from "@/lib/api";
import { TID } from "@/constants/testIds";
import { toast } from "sonner";

export default function Login() {
    const { login } = useAuth();
    const { t } = useI18n();
    const nav = useNavigate();
    const loc = useLocation();
    const from = loc.state?.from || "/account";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email, password);
            toast.success("Welcome back");
            nav(from);
        } catch (err) {
            setError(formatErr(err));
        } finally {
            setLoading(false);
        }
    };

    const input = "w-full bg-transparent border-b border-white/20 rounded-none text-bone-100 py-3 focus:outline-none focus:border-brass-400 transition-colors placeholder:text-bone-300/40";

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-16 px-6">
            <div className="max-w-md w-full">
                <p className="text-[11px] tracking-[0.32em] uppercase text-brass-400 mb-4">— {t("nav.login")}</p>
                <h1 className="font-serif text-5xl text-bone-100 tracking-tight leading-none mb-4">{t("auth.login.title")}</h1>
                <p className="text-bone-300 font-light mb-12">{t("auth.login.sub")}</p>

                <form onSubmit={submit} className="space-y-8">
                    <div>
                        <label className="text-[10px] tracking-[0.28em] uppercase text-bone-300/70 mb-2 block">{t("auth.email")}</label>
                        <input
                            type="email"
                            required
                            data-testid={TID.loginEmail}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={input}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] tracking-[0.28em] uppercase text-bone-300/70 mb-2 block">{t("auth.password")}</label>
                        <input
                            type="password"
                            required
                            data-testid={TID.loginPassword}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={input}
                        />
                    </div>
                    {error && <p className="text-destructive text-sm">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        data-testid={TID.loginSubmit}
                        className="w-full bg-brass-400 text-ink-900 hover:bg-brass-300 disabled:opacity-60 py-3.5 text-[11px] tracking-[0.28em] uppercase transition-colors"
                    >
                        {loading ? "…" : t("auth.signIn")}
                    </button>
                </form>

                <p className="mt-10 text-sm text-bone-300">
                    {t("auth.noAccount")} <Link to="/register" className="text-brass-400 link-hairline">{t("nav.register")}</Link>
                </p>
            </div>
        </div>
    );
}
