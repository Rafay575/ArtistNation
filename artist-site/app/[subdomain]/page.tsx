// app/[subdomain]/page.tsx
import { notFound } from 'next/navigation';
import { SectionRenderer } from '@/components/SectionRenderer';
import Navbar from '@/components/Navbar';

// Fetch page data from the backend
async function getPage(subdomain: string, slug: string = 'home') {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const url = `${baseUrl}/api/public/${subdomain}/${slug}`;
    
    console.log('🔍 Fetching:', url); // will show in terminal

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Failed to fetch page: ${res.status} ${res.statusText}`);
    }
    
    return res.json();
}

export default async function ArtistHomePage({
    params,
}: {
    params: Promise<{ subdomain: string }>;
}) {
    const { subdomain } = await params;
    const page = await getPage(subdomain, 'home');

    if (!page) {
        notFound();
    }

    return (
        <div>
              <Navbar />
            <SectionRenderer sections={page.sections} />
        </div>
    );
}