'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePages, useUpdateSection } from '@/hooks/useWebsite';
import { ConfirmModal } from '@/components/ConfirmModal';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
const sectionIcons: Record<string, string> = {
  hero: '🏠',
  about: '👥',
  music: '🎵',
  events: '📅',
  gallery: '🖼️',
  news: '📰',
  store: '🛍️',
  contact: '📬',
};

export default function CmsSectionsPage() {
  const { data: pages, isLoading, error } = usePages();
  const updateSection = useUpdateSection();
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState<any>(null);

  const sections = pages
    ? pages.flatMap((page: any) =>
        (page.sections || []).map((section: any) => ({
          ...section,
          pageTitle: page.title,
          pageSlug: page.slug,
          route: `/${page.slug}`,
          name: section.type.charAt(0).toUpperCase() + section.type.slice(1),
        }))
      )
    : [];

  const filteredSections = sections.filter(
    (sec: any) =>
      sec.name.toLowerCase().includes(search.toLowerCase()) ||
      sec.pageTitle.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = (section: any) => {
    if (section.is_published) {
      setConfirm(section);
    } else {
      updateSection.mutate(
        { sectionId: section.id, data: { isPublished: true } },
        {
          onSuccess: () => toast.success(`${section.name} is now live`),
          onError: () => toast.error('Failed to publish section'),
        }
      );
    }
  };

  const confirmHide = () => {
    if (!confirm) return;
    updateSection.mutate(
      { sectionId: confirm.id, data: { isPublished: false } },
      {
        onSuccess: () => {
          toast.success(`${confirm.name} set to draft`);
          setConfirm(null);
        },
        onError: () => toast.error('Failed to hide section'),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        Failed to load sections. Please try again.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-xl font-semibold text-slate-800">Page Sections</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage and edit your website sections</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">All Sections</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search sections..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Section</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Page</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Last updated</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSections.length > 0 ? (
                  filteredSections.map((sec: any) => (
                    <tr key={sec.id} className="border-b border-gray-100 last:border-0 hover:bg-purple-50/30 transition-colors">
                      <td className="px-5 py-3 text-sm text-gray-800 font-medium flex items-center gap-2">
                        <span>{sectionIcons[sec.type] || '📄'}</span> {sec.name}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">{sec.pageTitle}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                            sec.is_published
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sec.is_published ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          {sec.is_published ? 'Live' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500 tabular-nums">
                        {new Date(sec.updated_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* ✅ Updated edit link */}
                        <Link
  href={`/admin/cms/sections/${sec.id}`}
  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
  title="Edit section"
>
  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
    <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
</Link>
                          <button
                            onClick={() => toggleStatus(sec)}
                            disabled={updateSection.isPending}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              sec.is_published
                                ? 'text-emerald-500 hover:text-red-500 hover:bg-red-50'
                                : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                            } disabled:opacity-50`}
                            title={sec.is_published ? 'Set to draft' : 'Publish'}
                          >
                            {sec.is_published ? (
                              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                                <path d="M13 3L3 13M3 3l10 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                                <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">
                      No sections found. Create some pages first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {confirm && (
          <ConfirmModal
            name={confirm.name}
            onConfirm={confirmHide}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}