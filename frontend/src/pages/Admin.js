import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { formatPrice } from "@/lib/currency";
import { api, productImage, formatErr } from "@/lib/api";
import { TID } from "@/constants/testIds";
import { AdminVideoSettings } from "@/components/AdminVideoSettings";
import ProductEditor from "@/components/admin/ProductEditor";
import { useToast } from "@/hooks/use-toast";
import { LayoutGrid, Package, ShoppingBag, Users, Image as ImageIcon, Plus, Pencil, Trash2, Search } from "lucide-react";

const TABS = [
    { key: "stats", label: "Overview", tid: "admin-tab-stats", icon: LayoutGrid },
    { key: "products", label: "Products", tid: "admin-tab-products", icon: Package },
    { key: "orders", label: "Orders", tid: "admin-tab-orders", icon: ShoppingBag },
    { key: "users", label: "Customers", tid: "admin-tab-users", icon: Users },
    { key: "content", label: "Homepage", tid: "admin-tab-content", icon: ImageIcon },
];

const ORDER_STATUSES = ["initiated", "completed", "shipped", "delivered", "cancelled", "failed"];

export default function Admin() {
    const { user, ready } = useAuth();
    const { t, lang } = useI18n();
    const { toast } = useToast();
    const [tab, setTab] = useState("stats");
    const [stats, setStats] = useState(null);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [query, setQuery] = useState("");
    const [editing, setEditing] = useState(undefined); // undefined=closed, null=new, obj=edit

    const loadProducts = useCallback(() => {
        api.get("/products?limit=500").then(({ data }) => setProducts(data)).catch(() => {});
    }, []);
    const loadStats = useCallback(() => {
        api.get("/admin/stats").then(({ data }) => setStats(data)).catch(() => {});
    }, []);

    useEffect(() => {
        if (!user || user.role !== "admin") return;
        loadStats();
        loadProducts();
        api.get("/admin/orders").then(({ data }) => setOrders(data)).catch(() => {});
        api.get("/admin/users").then(({ data }) => setUsers(data)).catch(() => {});
    }, [user, loadStats, loadProducts]);

    const categorySuggestions = useMemo(
        () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort(),
        [products]
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return products;
        return products.filter((p) => (p.name?.en || "").toLowerCase().includes(q) || (p.slug || "").includes(q) || (p.category || "").includes(q));
    }, [products, query]);

    const onSaved = () => { setEditing(undefined); loadProducts(); loadStats(); };

    const deleteProduct = async (p) => {
        if (!window.confirm(`Delete "${p.name?.en}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/admin/products/${p.id}`);
            toast({ title: "Product deleted" });
            loadProducts(); loadStats();
        } catch (err) {
            toast({ title: "Delete failed", description: formatErr(err), variant: "destructive" });
        }
    };

    const setOrderStatus = async (o, status) => {
        try {
            await api.patch(`/admin/orders/${o.id}`, { status });
            setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status } : x)));
            toast({ title: `Order marked ${status}` });
        } catch (err) {
            toast({ title: "Update failed", description: formatErr(err), variant: "destructive" });
        }
    };

    if (!ready) return <div className="py-40 text-center text-bone-300">{t("common.loading")}</div>;
    if (!user || user.role !== "admin") return <Navigate to="/login" replace />;

    return (
        <div className="pt-10 pb-24">
            <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-10">
                <p className="text-[11px] tracking-[0.32em] uppercase text-brass-400 mb-3">— Control Room</p>
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-bone-100 tracking-tight leading-none mb-10">{t("admin.title")}</h1>

                {/* Tabs */}
                <div className="flex flex-wrap gap-x-6 sm:gap-x-8 gap-y-3 border-b border-white/10 mb-10">
                    {TABS.map((tb) => {
                        const Icon = tb.icon;
                        return (
                            <button key={tb.key} data-testid={tb.tid || undefined} onClick={() => setTab(tb.key)}
                                className={`inline-flex items-center gap-2 pb-4 text-[11px] tracking-[0.24em] uppercase transition-colors border-b -mb-px ${
                                    tab === tb.key ? "border-brass-400 text-brass-400" : "border-transparent text-bone-300 hover:text-bone-100"}`}>
                                <Icon className="w-3.5 h-3.5" /> {tb.label}
                            </button>
                        );
                    })}
                </div>

                {tab === "content" && <AdminVideoSettings />}

                {tab === "stats" && stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                        {[
                            { k: "revenue", label: t("admin.revenue"), value: formatPrice(stats.revenue_eur, lang) },
                            { k: "orders", label: t("admin.orders"), value: stats.orders },
                            { k: "products", label: t("admin.products"), value: stats.products },
                            { k: "users", label: t("admin.users"), value: stats.users },
                        ].map((c) => (
                            <div key={c.k} data-testid={TID.adminStat(c.k)} className="border border-white/10 p-6 sm:p-8 hover:border-brass-400/40 transition-colors">
                                <div className="text-[10px] tracking-[0.24em] uppercase text-bone-300 mb-3">{c.label}</div>
                                <div className="font-serif text-3xl sm:text-4xl lg:text-5xl text-bone-100">{c.value}</div>
                            </div>
                        ))}
                    </div>
                )}

                {tab === "products" && (
                    <div className="space-y-6">
                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                            <div className="relative flex-1 max-w-md">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-bone-300/50" />
                                <input value={query} onChange={(e) => setQuery(e.target.value)} data-testid="admin-product-search" placeholder="Search products, slug or category..."
                                    className="w-full bg-ink-800 border border-white/10 focus:border-brass-400/60 text-bone-100 text-sm pl-10 pr-3 py-2.5 outline-none transition-colors placeholder:text-bone-300/40" />
                            </div>
                            <button onClick={() => setEditing(null)} data-testid="admin-add-product-btn"
                                className="inline-flex items-center justify-center gap-2 bg-brass-400 hover:bg-brass-300 text-ink-900 px-5 py-3 text-[10px] tracking-[0.24em] uppercase font-medium transition-colors shrink-0">
                                <Plus className="w-4 h-4" /> Add product
                            </button>
                        </div>

                        <div className="text-xs text-bone-300/60">{filtered.length} product{filtered.length !== 1 ? "s" : ""}</div>

                        {/* List */}
                        <div className="border border-white/10">
                            <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-ink-800/40 text-[10px] tracking-[0.24em] uppercase text-bone-300">
                                <div className="col-span-5">Product</div>
                                <div className="col-span-3">Category</div>
                                <div className="col-span-2 text-right">Price</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>
                            {filtered.map((p) => (
                                <div key={p.id} data-testid={`admin-product-row-${p.slug}`} className="grid grid-cols-12 gap-3 sm:gap-4 p-4 border-b border-white/5 items-center">
                                    <div className="col-span-12 sm:col-span-5 flex gap-3 items-center">
                                        <div className="w-12 h-12 bg-ink-800 overflow-hidden shrink-0 border border-white/5">
                                            <img src={productImage(p)} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-serif text-base sm:text-lg text-bone-100 truncate flex items-center gap-2">
                                                {p.name.en}
                                                {p.active === false && <span className="text-[8px] tracking-widest uppercase text-red-400 border border-red-400/40 px-1.5 py-0.5">Hidden</span>}
                                            </div>
                                            <div className="text-xs text-bone-300/70 truncate">{p.slug}</div>
                                        </div>
                                    </div>
                                    <div className="col-span-6 sm:col-span-3 text-xs tracking-[0.18em] uppercase text-bone-300">{p.category}</div>
                                    <div className="col-span-6 sm:col-span-2 text-right font-serif text-brass-400">{formatPrice(p.price_eur, lang)}</div>
                                    <div className="col-span-12 sm:col-span-2 flex sm:justify-end gap-2 pt-2 sm:pt-0">
                                        <button onClick={() => setEditing(p)} data-testid={`admin-edit-${p.slug}`}
                                            className="inline-flex items-center gap-1.5 border border-white/15 hover:border-brass-400/60 text-bone-200 hover:text-brass-400 px-3 py-2 text-[10px] tracking-[0.2em] uppercase transition-colors">
                                            <Pencil className="w-3.5 h-3.5" /> Edit
                                        </button>
                                        <button onClick={() => deleteProduct(p)} data-testid={`admin-delete-${p.slug}`}
                                            className="inline-flex items-center justify-center border border-white/15 hover:border-red-400/60 text-bone-300 hover:text-red-400 px-3 py-2 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {filtered.length === 0 && <div className="p-10 text-center text-bone-300">No products match your search.</div>}
                        </div>
                    </div>
                )}

                {tab === "orders" && (
                    <div className="border border-white/10">
                        <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-ink-800/40 text-[10px] tracking-[0.24em] uppercase text-bone-300">
                            <div className="col-span-3">Order</div>
                            <div className="col-span-3">Customer</div>
                            <div className="col-span-2">Date</div>
                            <div className="col-span-2 text-right">Amount</div>
                            <div className="col-span-2 text-right">Status</div>
                        </div>
                        {orders.length === 0 && <div className="p-8 text-center text-bone-300">No orders yet.</div>}
                        {orders.map((o) => (
                            <div key={o.id} className="grid grid-cols-12 gap-3 sm:gap-4 p-4 border-b border-white/5 items-center">
                                <div className="col-span-6 sm:col-span-3 font-serif text-bone-100">#{o.id.slice(-10)}</div>
                                <div className="col-span-6 sm:col-span-3 text-sm text-bone-300 truncate">{o.email || "guest"}</div>
                                <div className="col-span-6 sm:col-span-2 text-sm text-bone-300">{new Date(o.created_at).toLocaleDateString()}</div>
                                <div className="col-span-6 sm:col-span-2 text-right font-serif text-brass-400">{formatPrice(o.amount, lang)}</div>
                                <div className="col-span-12 sm:col-span-2 sm:text-right">
                                    <select value={o.status} onChange={(e) => setOrderStatus(o, e.target.value)} data-testid={`admin-order-status-${o.id.slice(-6)}`}
                                        className="bg-ink-800 border border-white/10 focus:border-brass-400/60 text-[10px] tracking-[0.16em] uppercase text-bone-100 px-2 py-1.5 outline-none">
                                        {ORDER_STATUSES.map((s) => <option key={s} value={s} className="bg-ink-900">{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {tab === "users" && (
                    <div className="border border-white/10 overflow-x-auto">
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-ink-800/40 text-[10px] tracking-[0.24em] uppercase text-bone-300 min-w-[600px]">
                            <div className="col-span-4">Name</div>
                            <div className="col-span-5">Email</div>
                            <div className="col-span-2">Role</div>
                            <div className="col-span-1">Joined</div>
                        </div>
                        {users.map((u) => (
                            <div key={u.id} className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 items-center min-w-[600px]">
                                <div className="col-span-4 font-serif text-bone-100">{u.name}</div>
                                <div className="col-span-5 text-sm text-bone-300">{u.email}</div>
                                <div className="col-span-2 text-[10px] tracking-[0.2em] uppercase text-brass-400">{u.role}</div>
                                <div className="col-span-1 text-xs text-bone-300">{u.created_at && new Date(u.created_at).toLocaleDateString()}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {editing !== undefined && (
                <ProductEditor
                    product={editing}
                    categorySuggestions={categorySuggestions}
                    onClose={() => setEditing(undefined)}
                    onSaved={onSaved}
                />
            )}
        </div>
    );
}
