import React from "react";

/**
 * Official Keneth Global Inc mark — ornate gold "K" with sunburst rays.
 * The image comes from /logo-mark.png in the public folder.
 */
export function Monogram({ className = "", testId }) {
    return (
        <img
            src="/logo-mark.png"
            data-testid={testId}
            alt="Keneth Global Inc"
            className={`${className} object-contain`}
            draggable="false"
        />
    );
}

export function Logo({ variant = "horizontal", className = "" }) {
    if (variant === "compact") {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <Monogram className="w-[43px] h-[43px]" />
            </div>
        );
    }

    if (variant === "stacked") {
        return (
            <div className={`inline-flex flex-col items-center ${className}`}>
                <Monogram className="w-[86px] h-[86px] mb-2" />
                <span className="font-serif text-2xl tracking-tight text-bone-100 leading-none">Keneth</span>
                <span className="font-serif italic text-lg text-brass-400 leading-tight mt-0.5">Global Inc</span>
                <span className="text-[9px] tracking-[0.32em] uppercase text-bone-300 mt-2">Est. 2019</span>
            </div>
        );
    }

    return (
        <div className={`inline-flex items-center gap-3 sm:gap-3.5 ${className}`}>
            <Monogram className="w-[54px] h-[54px] shrink-0" />
            <div className="flex flex-col leading-none">
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                    <span className="font-serif text-[22px] tracking-tight text-bone-100">Keneth</span>
                    <span className="font-serif italic text-lg text-brass-400">Global Inc</span>
                </div>
                <span className="text-[9px] tracking-[0.3em] uppercase text-bone-300 mt-1">Est. India · 2019</span>
            </div>
        </div>
    );
}

export default Logo;
