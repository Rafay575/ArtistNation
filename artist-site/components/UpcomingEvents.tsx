'use client';

import Image from 'next/image';
import { useArtist } from '@/contexts/ArtistContext';

// Pulls { day, month, weekday } out of a date string for the date block.
// Falls back to just showing the raw string if it isn't parseable.
function parseEventDate(raw: string) {
    if (!raw) return null;
    const parsed = new Date(raw);
    if (isNaN(parsed.getTime())) return null;

    return {
        day: parsed.getDate(),
        month: parsed.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        weekday: parsed.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    };
}

/**
 * Normalize the ticket link:
 * - Accepts full URLs (https://...)
 * - Accepts "www.example.com" and prefixes "https://"
 * - Treats "", "#", "n/a" as no link
 * Returns the normalized URL string, or null if there's no usable link.
 */
function normalizeTicketLink(raw: string | undefined | null): string | null {
    if (!raw) return null;
    const trimmed = String(raw).trim();
    if (!trimmed || trimmed === '#' || trimmed.toLowerCase() === 'n/a') return null;

    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^mailto:/i.test(trimmed)) return trimmed;
    if (/^tel:/i.test(trimmed)) return trimmed;

    // Bare domain like "ticketmaster.com/event/123"
    if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
        return `https://${trimmed}`;
    }

    return trimmed;
}

export default function EventsSection({ content }: { content: any }) {
    const { settings } = useArtist();
    const primaryColor = settings?.primary_color || '#5D2FDB';

    const {
        heading = 'Upcoming events',
        description = 'Track to get concert, live stream and tour updates.',
        image = '/up-img.png',
        events = [],
    } = content;

    return (
        <div className="relative py-[50px] lg:py-[80px]">
            <div className="container flex flex-col lg:flex-row gap-y-5 relative z-2">
                <div className="flex-1">
                    <Image
                        src={image}
                        width={300}
                        height={300}
                        alt="events"
                        unoptimized={true}
                        className="w-full lg:w-[85%]"
                    />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                    <div className="mb-8">
                        <h2 className="text-4xl md:text-5xl font-bold text-primary">
                            {heading}
                        </h2>
                        <p className="mt-4 text-sm md:text-base">{description}</p>
                    </div>
                    <div className="flex flex-col items-stretch gap-5 w-full">
                        {events.length === 0 ? (
                            <p className="text-gray-500">No upcoming events.</p>
                        ) : (
                            events.map((event: any, idx: number) => {
                                const dateParts = parseEventDate(event.date);
                                const ticketHref = normalizeTicketLink(event.ticketLink);

                                // Shared button styles
                                const buttonClasses =
                                    'bg-transparent border text-[17px] py-1 px-5 rounded-full duration-300 inline-block';
                                const buttonStyle = {
                                    borderColor: primaryColor,
                                    color: primaryColor,
                                };
                                const handleEnter = (e: React.MouseEvent<HTMLElement>) => {
                                    e.currentTarget.style.backgroundColor = primaryColor;
                                    e.currentTarget.style.color = 'white';
                                };
                                const handleLeave = (e: React.MouseEvent<HTMLElement>) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = primaryColor;
                                };

                                return (
                                    <div
                                        key={idx}
                                        className="flex items-stretch gap-5 w-full border-b border-gray-300 pb-7"
                                    >
                                        {/* Date block */}
                                        <div
                                            className="flex flex-col items-center justify-center shrink-0 w-16 md:w-20 rounded-2xl"
                                            style={{ backgroundColor: primaryColor + '12' }}
                                        >
                                            {dateParts ? (
                                                <>
                                                    <span
                                                        className="text-3xl md:text-4xl font-bold leading-none"
                                                        style={{ color: primaryColor }}
                                                    >
                                                        {dateParts.day}
                                                    </span>
                                                    <span className="mt-1 text-[11px] md:text-xs font-semibold tracking-wide text-gray-500">
                                                        {dateParts.month}
                                                    </span>
                                                </>
                                            ) : (
                                                <span
                                                    className="text-sm font-semibold text-center px-1"
                                                    style={{ color: primaryColor }}
                                                >
                                                    {event.date}
                                                </span>
                                            )}
                                        </div>

                                        {/* Event details */}
                                        <div className="flex flex-col justify-center flex-1 min-w-0">
                                            <p className="text-xl text-primary">{event.title}</p>
                                            <div className="flex gap-6 items-center w-full mt-1">
                                                <div className="flex gap-2 items-center justify-between flex-1 min-w-0">
                                                    <p className="text-sm truncate">{event.location}</p>
                                                </div>

                                                {/* ✅ Tickets button — ALWAYS shown */}
                                                <div className="flex gap-2 items-center justify-center shrink-0">
                                                    {ticketHref ? (
                                                        // Has a valid URL → clickable link that opens in new tab
                                                        <a
                                                            href={ticketHref}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={buttonClasses}
                                                            style={buttonStyle}
                                                            onMouseEnter={handleEnter}
                                                            onMouseLeave={handleLeave}
                                                        >
                                                            Tickets
                                                        </a>
                                                    ) : (
                                                        // No URL → non-clickable button, disabled look
                                                        <button
                                                            type="button"
                                                            disabled
                                                            title="Ticket link not available yet"
                                                            className={`${buttonClasses} opacity-50 cursor-not-allowed`}
                                                            style={buttonStyle}
                                                        >
                                                            Tickets
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Decorative overlays */}
            <Image
                src="/overlay2.png"
                alt="overlay"
                width={300}
                height={400}
                className="w-[50px] md:w-[100px] absolute top-10 left-0 z-1"
            />
            <Image
                src="/overlay3.png"
                alt="overlay"
                width={300}
                height={400}
                className="w-[100px] md:w-[200px] absolute bottom-0 right-10 z-1"
            />
        </div>
    );
}