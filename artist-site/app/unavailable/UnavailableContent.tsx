// app/unavailable/UnavailableContent.tsx
"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function UnavailableContent() {
  const searchParams = useSearchParams();
  const subdomain = searchParams.get('subdomain') || 'this site';
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      window.location.href = 'https://test.artistnation.studio';
    }
  }, [countdown]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">🚧 Site Unavailable</h1>

        <p className="text-gray-600 mb-6">
          The site <strong className="text-gray-900">{subdomain}.artistnation.studio</strong> is currently unavailable.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-700">⚠️ This site is currently inactive. This could be because:</p>
          <ul className="text-sm text-gray-600 mt-2 list-disc list-inside space-y-1">
            <li>The subscription has been canceled</li>
            <li>The trial period has ended</li>
            <li>Payment is overdue</li>
          </ul>
          <p className="text-sm text-gray-600 mt-2">Please contact the site owner to reactivate.</p>
        </div>

        <div className="space-y-3">
          <Link
            href="https://test.artistnation.studio"
            className="block w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Go to ArtistNation
          </Link>
          <p className="text-sm text-gray-400">
            Redirecting in <span className="font-bold text-gray-600">{countdown}</span> seconds...
          </p>
        </div>
      </div>
    </div>
  );
}