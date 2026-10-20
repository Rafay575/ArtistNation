'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaFacebook } from 'react-icons/fa';
import { RiInstagramFill } from 'react-icons/ri';
import { FaXTwitter } from 'react-icons/fa6';
import { useArtist } from '@/contexts/ArtistContext';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Footer() {
    const { menu, settings } = useArtist();
    const [email, setEmail] = useState('');
    const [subscribing, setSubscribing] = useState(false);

    const primaryColor = settings?.primary_color || '#5D2FDB';
    const logoUrl = settings?.logo_url_dark || settings?.logo_url || '/logo-black.png';
    const siteName = settings?.site_name || 'Artist Site';

    const footerData = settings?.footer_data || {};
    const contact = footerData.contact || '0665 Broadway NY, New York 10001 United States of America<br><b>855 100 4444</b><br>info@barber.com';
    const socials = footerData.socials || [
        { platform: 'facebook', url: '#' },
        { platform: 'instagram', url: '#' },
        { platform: 'x', url: '#' },
    ];
    const subscribeText = footerData.subscribeText || 'Subscribe & follow';
    const subscribeEnabled = footerData.subscribeEnabled !== false;

    // Get subdomain from window.location
    const getSubdomain = () => {
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            const parts = hostname.split('.');
            // For localhost:3001 or custom domains, adjust logic accordingly
            // For this example, assume first part is subdomain (e.g., artist.localhost:3001)
            if (parts.length >= 2 && !['localhost', '127.0.0.1'].includes(parts[0])) {
                return parts[0];
            }
            return '';
        }
        return '';
    };

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email');
            return;
        }
        const subdomain = getSubdomain();
        if (!subdomain) {
            toast.error('Could not identify artist');
            return;
        }

        setSubscribing(true);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/subscribe/${subdomain}`, { email });
            toast.success('Subscribed successfully!');
            setEmail('');
        } catch (err: any) {
            const msg = err.response?.data?.error || 'Subscription failed';
            toast.error(msg);
        } finally {
            setSubscribing(false);
        }
    };

    const socialIcons: Record<string, React.ReactNode> = {
        facebook: <FaFacebook className="size-5 text-primary" style={{ color: primaryColor }} />,
        instagram: <RiInstagramFill className="size-5 text-primary" style={{ color: primaryColor }} />,
        x: <FaXTwitter className="size-5 text-primary" style={{ color: primaryColor }} />,
    };

    return (
        <div className="py-[50px] lg:py-[80px] container">
            <Link href="/" className="flex items-center">
                <Image
                    src={logoUrl}
                    alt={siteName}
                    width={180}
                    height={50}
                    priority
                    unoptimized={true}
                    className="w-50 md:w-60"
                />
            </Link>

            <div className="mt-10 flex gap-3 gap-y-10 flex-wrap lg:flex-nowrap">
                <div className="w-full md:w-[58%] lg:w-[30%] flex flex-col gap-3">
                    <p className="text-2xl font-bold text-primary" style={{ color: primaryColor }}>Contact</p>
                    <p dangerouslySetInnerHTML={{ __html: contact }} />
                </div>

                <div className="w-full md:w-[40%] lg:w-[25%]">
                    <div className="flex flex-col gap-3 w-full lg:w-[50%] ml-auto">
                        <p className="text-2xl font-bold text-primary" style={{ color: primaryColor }}>Pages</p>
                        <div className="flex flex-col gap-2">
                            {menu.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="hover:text-primary transition-colors duration-300"
                                    style={{ '--hover-color': primaryColor } as React.CSSProperties}
                                    onMouseEnter={(e) => { e.currentTarget.style.color = primaryColor; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-[45%] flex flex-col justify-center">
                    <p className="text-4xl font-bold text-primary" style={{ color: primaryColor }}>{subscribeText}</p>
                    {subscribeEnabled && (
                        <form onSubmit={handleSubscribe} className="flex flex-col md:flex-row gap-x-4 gap-y-1 items-start md:items-center mt-2">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="border border-primary rounded-full px-2 py-2 flex-1 w-full"
                                placeholder="Your email"
                                style={{ borderColor: primaryColor }}
                                required
                            />
                            <button
                                type="submit"
                                disabled={subscribing}
                                className="hover:bg-transparent hover:text-primary border border-primary text-white bg-primary text-[17px] py-2 px-5 rounded-full duration-300 disabled:opacity-50"
                                style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: 'white' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = primaryColor; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = primaryColor; e.currentTarget.style.color = 'white'; }}
                            >
                                {subscribing ? 'Subscribing...' : 'Subscribe'}
                            </button>
                        </form>
                    )}
                    <div className="flex gap-4 items-center mt-4">
                        {socials.map((social: any, idx: number) => (
                            <a key={idx} href={social.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                                {socialIcons[social.platform] || <span className="text-primary" style={{ color: primaryColor }}>{social.platform}</span>}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}