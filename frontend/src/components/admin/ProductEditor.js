import React, { useRef, useState } from "react";
import { X, UploadCloud, Trash2, Loader2, Star, GripVertical } from "lucide-react";
import { api, STATIC_BASE, formatErr } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const VERTICALS = [
    { key: "masalas", label: "Indian Spices" },
    { key: "home-furnishing", label: "Home Furnishing" },
    { key: "artificial-jewelry", label: "Artificial Jewelry" },
    { key: "christmas-decor", label: "Christmas Decor" },
];

const imgUrl = (path) => (path ? (path.startsWith("http") ? path : `${STATIC_BASE}/${path}`) : "");

export default function ProductEditor({ product, categorySuggestions = [], onClose, onSaved }) {
    const { toast } = useToast();
    const isNew = !product;
    const fileRef = useRef(null);
    const galleryRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState(() => ({
        slug: product?.slug || "",
        name_en: product?.name?.en || "",
        vertical: product?.vertical || "masalas",
        category: product?.category || "",
        price_eur: product?.price_eur ?? "",
        unit: product?.unit || "",
        short_en: product?.short_description?.en || "",
        long_en: product?.long_description?.en || "",
        badge_en: product?.badge?.en || "",
        image_hint: product?.image_hint || "",
        ai_image: product?.ai_image || "",
        gallery_images: product?.gallery_images ? [...product.gallery_images] : [],
        active: product?.active !== false,
    }));

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const upload = async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        const { data } = await api.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        return data.path;
    };

    const onMainFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const path = await upload(file);
            set("ai_image", path);
            toast({ title: "Image uploaded" });
        } catch (err) {
            toast({ title: "Upload failed", description: formatErr(err), variant: "destructive" });
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const onGalleryFiles = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setUploading(true);
        try {
            const paths = [];
            for (const f of files) paths.push(await upload(f));
            setForm((fm) => ({ ...fm, gallery_images: [...fm.gallery_images, ...paths] }));
            toast({ title: `${paths.length} image(s) added to gallery` });
        } catch (err) {
            toast({ title: "Upload failed", description: formatErr(err), variant: "destructive" });
        } finally {
            setUploading(false);
            if (galleryRef.current) galleryRef.current.value = "";
        }
    };

    const removeGallery = (idx) => setForm((fm) => ({ ...fm, gallery_images: fm.gallery_images.filter((_, i) => i !== idx) }));
    const makeMain = (idx) => setForm((fm) => {
        const chosen = fm.gallery_images[idx];
        const rest = fm.gallery_images.filter((_, i) => i !== idx);
        if (fm.ai_image) rest.unshift(fm.ai_image);
        return { ...fm, ai_image: chosen, gallery_images: rest };
    });

    const save = async () => {
        if (!form.name_en.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
        if (!form.category.trim()) { toast({ title: "Category is required", variant: "destructive" }); return; }
        if (form.price_eur === "" || isNaN(Number(form.price_eur))) { toast({ title: "Valid price is required", variant: "destructive" }); return; }
        const payload = {
            slug: form.slug || undefined,
            name: { en: form.name_en.trim() },
            vertical: form.vertical,
            category: form.category.trim(),
            price_eur: Number(form.price_eur),
            unit: form.unit.trim(),
            short_description: { en: form.short_en.trim() },
            long_description: { en: form.long_en.trim() },
            badge: form.badge_en.trim() ? { en: form.badge_en.trim() } : null,
            ai_image: form.ai_image,
            gallery_images: form.gallery_images,
            image_hint: form.image_hint.trim(),
            active: form.active,
        };
        setSaving(true);
        try {
            if (isNew) await api.post("/admin/products", payload);
            else await api.put(`/admin/products/${product.id}`, payload);
            toast({ title: isNew ? "Product created" : "Product updated" });
            onSaved();
        } catch (err) {
            toast({ title: "Save failed", description: formatErr(err), variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-start sm:items-center justify-center" data-testid="product-editor-modal">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full sm:max-w-3xl max-h-[100dvh] sm:max-h-[92vh] overflow-y-auto bg-ink-900 border border-white/10 sm:my-8">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 sm:px-8 py-5 bg-ink-900/95 backdrop-blur border-b border-white/10">
                    <div>
                        <p className="text-[10px] tracking-[0.28em] uppercase text-brass-400">{isNew ? "New product" : "Edit product"}</p>
                        <h3 className="font-serif text-2xl text-bone-100 mt-1">{form.name_en || "Untitled product"}</h3>
                    </div>
                    <button onClick={onClose} data-testid="product-editor-close" className="w-10 h-10 flex items-center justify-center text-bone-300 hover:text-bone-100 border border-white/10 hover:border-white/30 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 sm:p-8 space-y-8">
                    {/* Images */}
                    <section className="space-y-4">
                        <Label>Main image</Label>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="w-28 h-28 bg-ink-800 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                                {form.ai_image
                                    ? <img src={imgUrl(form.ai_image)} alt="" className="w-full h-full object-cover" data-testid="editor-main-preview" />
                                    : <span className="text-[10px] text-bone-300/50 uppercase tracking-widest">No image</span>}
                            </div>
                            <div className="flex flex-col gap-2">
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onMainFile} data-testid="editor-main-file" />
                                <button onClick={() => fileRef.current?.click()} disabled={uploading} data-testid="editor-main-upload-btn"
                                    className="inline-flex items-center gap-2 border border-brass-400/60 hover:border-brass-400 text-brass-400 hover:bg-brass-400/10 px-4 py-2.5 text-[10px] tracking-[0.24em] uppercase transition-colors disabled:opacity-50">
                                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />} Upload main image
                                </button>
                                {form.ai_image && <button onClick={() => set("ai_image", "")} className="text-[10px] tracking-[0.2em] uppercase text-bone-300/60 hover:text-red-400 text-left">Remove</button>}
                            </div>
                        </div>

                        <Label>Gallery images</Label>
                        <div className="flex flex-wrap gap-3">
                            {form.gallery_images.map((g, i) => (
                                <div key={i} className="relative w-20 h-20 bg-ink-800 border border-white/10 overflow-hidden group" data-testid={`editor-gallery-item-${i}`}>
                                    <img src={imgUrl(g)} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                        <button title="Make main" onClick={() => makeMain(i)} className="p-1.5 text-brass-400 hover:text-brass-300"><Star className="w-4 h-4" /></button>
                                        <button title="Remove" onClick={() => removeGallery(i)} data-testid={`editor-gallery-remove-${i}`} className="p-1.5 text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                            <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={onGalleryFiles} data-testid="editor-gallery-file" />
                            <button onClick={() => galleryRef.current?.click()} disabled={uploading} data-testid="editor-gallery-upload-btn"
                                className="w-20 h-20 border border-dashed border-white/20 hover:border-brass-400/60 text-bone-300/60 hover:text-brass-400 flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50">
                                <UploadCloud className="w-5 h-5" /><span className="text-[8px] tracking-widest uppercase">Add</span>
                            </button>
                        </div>
                    </section>

                    {/* Core fields */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Field label="Product name *" className="sm:col-span-2">
                            <input value={form.name_en} onChange={(e) => set("name_en", e.target.value)} data-testid="editor-name" className={inputCls} placeholder="e.g. Royal Garam Masala" />
                        </Field>
                        <Field label="Vertical">
                            <select value={form.vertical} onChange={(e) => set("vertical", e.target.value)} data-testid="editor-vertical" className={inputCls}>
                                {VERTICALS.map((v) => <option key={v.key} value={v.key} className="bg-ink-900">{v.label}</option>)}
                            </select>
                        </Field>
                        <Field label="Category *">
                            <input list="cat-suggest" value={form.category} onChange={(e) => set("category", e.target.value)} data-testid="editor-category" className={inputCls} placeholder="e.g. whole-spices" />
                            <datalist id="cat-suggest">{categorySuggestions.map((c) => <option key={c} value={c} />)}</datalist>
                        </Field>
                        <Field label="Price (EUR) *">
                            <input type="number" step="0.01" min="0" value={form.price_eur} onChange={(e) => set("price_eur", e.target.value)} data-testid="editor-price" className={inputCls} placeholder="9.90" />
                        </Field>
                        <Field label="Unit">
                            <input value={form.unit} onChange={(e) => set("unit", e.target.value)} data-testid="editor-unit" className={inputCls} placeholder="100g / piece" />
                        </Field>
                        <Field label="Badge (optional)">
                            <input value={form.badge_en} onChange={(e) => set("badge_en", e.target.value)} data-testid="editor-badge" className={inputCls} placeholder="Bestseller" />
                        </Field>
                        <Field label="Slug (optional)">
                            <input value={form.slug} onChange={(e) => set("slug", e.target.value)} data-testid="editor-slug" className={inputCls} placeholder="auto-generated from name" />
                        </Field>
                        <Field label="Short description" className="sm:col-span-2">
                            <input value={form.short_en} onChange={(e) => set("short_en", e.target.value)} data-testid="editor-short" className={inputCls} placeholder="One-line summary" />
                        </Field>
                        <Field label="Long description" className="sm:col-span-2">
                            <textarea rows={4} value={form.long_en} onChange={(e) => set("long_en", e.target.value)} data-testid="editor-long" className={`${inputCls} resize-y`} placeholder="Full product story..." />
                        </Field>
                        <Field label="Fallback image URL (optional)" className="sm:col-span-2">
                            <input value={form.image_hint} onChange={(e) => set("image_hint", e.target.value)} data-testid="editor-hint" className={inputCls} placeholder="https://..." />
                        </Field>
                    </section>

                    {/* Active toggle */}
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} data-testid="editor-active" className="w-4 h-4 accent-brass-400" />
                        <span className="text-sm text-bone-100">Active (visible in store)</span>
                    </label>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 sm:px-8 py-5 bg-ink-900/95 backdrop-blur border-t border-white/10">
                    <button onClick={onClose} className="px-5 py-3 text-[10px] tracking-[0.24em] uppercase text-bone-300 hover:text-bone-100 transition-colors">Cancel</button>
                    <button onClick={save} disabled={saving || uploading} data-testid="editor-save-btn"
                        className="inline-flex items-center gap-2 bg-brass-400 hover:bg-brass-300 text-ink-900 px-7 py-3 text-[10px] tracking-[0.24em] uppercase font-medium transition-colors disabled:opacity-50">
                        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{isNew ? "Create product" : "Save changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

const inputCls = "w-full bg-ink-800 border border-white/10 focus:border-brass-400/60 text-bone-100 text-sm px-3.5 py-2.5 outline-none transition-colors placeholder:text-bone-300/40";

function Label({ children }) {
    return <p className="text-[10px] tracking-[0.24em] uppercase text-brass-400">{children}</p>;
}
function Field({ label, className = "", children }) {
    return (
        <div className={className}>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-bone-300/70 mb-2">{label}</label>
            {children}
        </div>
    );
}
