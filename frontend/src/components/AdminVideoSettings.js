import React, { useEffect, useState } from "react";
import { Save, Trash2, Loader2 } from "lucide-react";
import { api, formatErr } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AboutVideo } from "@/components/AboutVideo";

export const AdminVideoSettings = () => {
    const [url, setUrl] = useState("");
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    useEffect(() => {
        let active = true;
        api.get("/site/about-video").then(({ data }) => { if (active) { setVideo(data); setUrl(data.url || ""); } })
            .catch(e => { if (active) setError(formatErr(e)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);
    const save = async e => {
        e.preventDefault(); setSaving(true); setError(""); setMessage("");
        try {
            const { data } = await api.put("/site/about-video", { url: url.trim() });
            setVideo(data); setUrl(data.url); setMessage("Video saved to the homepage.");
        } catch (e) { setError(formatErr(e)); } finally { setSaving(false); }
    };
    const remove = async () => {
        setSaving(true); setError(""); setMessage("");
        try { await api.delete("/site/about-video"); setVideo(null); setUrl(""); setMessage("Video removed from the homepage."); }
        catch (e) { setError(formatErr(e)); } finally { setSaving(false); }
    };
    return <section data-testid="admin-video-settings" className="max-w-3xl">
        <h2 data-testid="admin-video-heading" className="font-serif text-lg text-bone-100 mb-8">Homepage · About video</h2>
        {loading ? <p data-testid="admin-video-loading" role="status" className="text-bone-300">Loading…</p> : <>
            <form onSubmit={save} className="space-y-5">
                <Label htmlFor="about-video-url" className="text-bone-200">Public video link — YouTube, Vimeo, MP4, WebM or OGG</Label>
                <Input id="about-video-url" data-testid="admin-video-url" type="url" required maxLength={2048} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" className="rounded-none h-12 bg-transparent border-white/20" disabled={saving} />
                <div className="flex flex-wrap gap-3">
                    <Button type="submit" data-testid="admin-video-save" disabled={saving || !url.trim()} className="rounded-none">{saving ? <Loader2 className="animate-spin" /> : <Save />}Save video</Button>
                    <Button type="button" variant="outline" data-testid="admin-video-remove" disabled={saving || !video?.url} onClick={remove} className="rounded-none border-white/20"><Trash2 />Remove video</Button>
                </div>
            </form>
            {error && <p data-testid="admin-video-error" role="alert" className="text-red-300 text-sm mt-5">{error}</p>}
            {message && <p data-testid="admin-video-status" role="status" className="text-brass-300 text-sm mt-5">{message}</p>}
            <div className="mt-10">{video?.url ? <AboutVideo video={video} prefix="admin-about" /> : <p data-testid="admin-video-empty" className="text-sm text-bone-300">No video published.</p>}</div>
        </>}
    </section>;
};