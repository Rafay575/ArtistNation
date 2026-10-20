'use client';

import { useArtist } from '@/contexts/ArtistContext';

export default function HeroSection({ content }: { content: any }) {
    const { settings } = useArtist();
    const primaryColor = settings?.primary_color || '#5D2FDB';

    const backgroundImage = content.image || '/hero.png';

    // ✅ Read overlay opacity from CMS (0–100). Default to 40 if not set.
    const overlayOpacity =
        typeof content.overlayOpacity === 'number'
            ? content.overlayOpacity
            : content.overlayOpacity !== undefined && content.overlayOpacity !== ''
            ? Number(content.overlayOpacity)
            : 40;

    // Clamp to 0–100, then convert to 0–1 for CSS rgba()
    const overlayAlpha = Math.max(0, Math.min(100, overlayOpacity)) / 100;

    // ctaLink may come as "#music" or "music" — normalize it
    const targetId = (content.ctaLink || '').replace(/^#/, '').trim();

    const handleCtaClick = () => {
        if (!targetId) return;
        const el = document.getElementById(targetId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <header
            className="relative h-screen min-h-[400px] bg-cover bg-center bg-no-repeat max-w-full flex items-center justify-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            {/* ✅ Dynamic overlay driven by CMS overlayOpacity */}
            <div
                className="absolute inset-0"
                style={{ backgroundColor: `rgba(0, 0, 0, ${overlayAlpha})` }}
            />

            <div className="relative z-10 container text-white flex flex-col gap-5">
                <p className="w-full max-w-lg text-[44px] sm:text-[67px] font-[700] leading-[100%]">
                    {content.heading || ''}
                </p>
                <p className="w-full max-w-sm">
                    {content.subheading || ''}
                </p>

                {/* ✅ Button renders only when ctaText is not empty */}
                <div className="flex gap-5 items-center flex-wrap">
                    {content.ctaText && content.ctaText.trim() !== '' && (
                        <button
                            onClick={handleCtaClick}
                            className="bg-white text-primary border border-white hover:bg-primary hover:border-primary hover:text-white text-[17px] py-2 px-5 rounded-full duration-300 cursor-pointer"
                            style={{ color: primaryColor }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = primaryColor;
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'white';
                                e.currentTarget.style.color = primaryColor;
                            }}
                        >
                            {content.ctaText}
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}