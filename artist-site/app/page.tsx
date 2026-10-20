import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function RootPage() {
    // ✅ headers() returns a Promise – must await
    const headersList = await headers();
    const host = headersList.get('host') || '';

    // Only redirect for the root domain (localhost:3001)
    if (host === 'localhost:3001' || host === 'localhost:3001/') {
        redirect('http://localhost:3000/');
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-gray-500">This is the artist site – subdomain required.</p>
        </div>
    );
}