import React, { useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { ExternalLink, RotateCw } from "lucide-react";

export const AboutVideo = ({ video, prefix = "about" }) => {
    const { t } = useI18n();
    const [failed, setFailed] = useState("");
    useEffect(() => setFailed(""), [video?.url]);
    if (!video?.url) return null;
    const embed = video.kind === "youtube" || video.kind === "vimeo";
    return <div data-testid={`${prefix}-video-container`}>
        <div className="aspect-video bg-ink-800 overflow-hidden">
            {failed ? <div role="alert" data-testid={`${prefix}-video-error`} className="h-full flex flex-col gap-4 items-center justify-center p-5 text-center text-sm text-bone-300">
                <p>{t(failed)}</p>
                <button type="button" data-testid={`${prefix}-video-retry`} onClick={() => setFailed("")} className="inline-flex items-center gap-2 text-brass-300 hover:text-bone-100 transition-colors"><RotateCw className="w-4 h-4" />{t("catalog.retry")}</button>
            </div>
                : embed ? <iframe data-testid={`${prefix}-video-embed`} src={video.url} title={t("video.title")} className="w-full h-full" loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
                    : <video data-testid={`${prefix}-video-player`} src={video.url} controls playsInline preload="metadata" className="w-full h-full object-contain"
                        onError={e => setFailed([3, 4].includes(e.currentTarget.error?.code) ? "video.unsupported" : "video.unavailable")} />}
        </div>
        <a data-testid={`${prefix}-video-open`} href={video.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-3 text-xs text-brass-300 hover:text-bone-100 transition-colors">{t("video.open")}<ExternalLink className="w-3 h-3" /></a>
    </div>;
};