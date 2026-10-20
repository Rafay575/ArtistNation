'use client';

import Image from 'next/image';
import { useArtist } from '@/contexts/ArtistContext';

export default function AboutSection({ content }: { content: any }) {
    const { settings } = useArtist();
    const primaryColor = settings?.primary_color || '#5D2FDB';

    const title = content.title || 'About us';
    const paragraphs = content.paragraphs || [];
    const images = content.images || [];
    const buttonText = content.buttonText || 'Read More';
    const buttonLink = content.buttonLink || '#';

    return (
        <div className="container py-[50px] lg:py-[80px]">
            <div className="flex flex-col lg:flex-row gap-5">
                {/* Left column - images grid */}
                <div className="flex-1 flex lg:pr-15 gap-3 md:gap-5">
                    {/* Column 1 */}
                    <div className="flex-1 flex flex-col gap-3 md:gap-5">
                        {images.slice(0, 2).map((src: string, idx: number) => (
                            <div
                                key={idx}
                                className="relative w-full aspect-[4/5] overflow-hidden rounded-2xl shadow-md shadow-black/30"
                            >
                                <Image
                                    src={src}
                                    fill
                                    sizes="(max-width: 1024px) 50vw, 25vw"
                                    unoptimized
                                    alt={`About image ${idx + 1}`}
                                    className="object-cover "
                                />
                            </div>
                        ))}
                    </div>

                    {/* Column 2 (offset down) */}
                    <div className="flex-1 flex flex-col gap-3 md:gap-5 mt-20">
                        {images.slice(2, 4).map((src: string, idx: number) => (
                            <div
                                key={idx + 2}
                                className="relative w-full aspect-[4/5] overflow-hidden rounded-2xl shadow-md shadow-black/30"
                            >
                                <Image
                                    src={src}
                                    fill
                                    sizes="(max-width: 1024px) 50vw, 25vw"
                                    unoptimized
                                    alt={`About image ${idx + 3}`}
                                    className="object-cover "
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right column - text content */}
                <div className="flex-1 flex flex-col justify-center items-start gap-7">
                    <p className="text-4xl md:text-5xl font-bold leading-[100%] text-primary">
                        {title}
                    </p>
                    <div className="flex flex-col justify-center items-start gap-3">
                        {paragraphs.map((p: string, idx: number) => (
                            <p key={idx}>{p}</p>
                        ))}
                    </div>
                    {buttonText && (
                        <a
                            href={buttonLink}
                            className="bg-transparent border border-primary text-primary hover:text-white hover:bg-primary hover:border-primary text-[17px] py-2 px-5 rounded-full duration-300"
                            style={{
                                borderColor: primaryColor,
                                color: primaryColor,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = primaryColor;
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = primaryColor;
                            }}
                        >
                            {buttonText}
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}