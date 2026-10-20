'use client';

import { motion, AnimatePresence } from 'framer-motion';

const EASE = [0.4, 0, 0.2, 1] as const;

interface ConfirmModalProps {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ name, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        className="relative w-full max-w-sm mx-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.2, ease: EASE }}
      >
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="none">
            <path d="M10 6v4M10 14h.01M3 10a7 7 0 1014 0A7 7 0 003 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">Hide section?</h3>
        <p className="text-sm text-slate-400 mb-5">
          <span className="text-slate-600 font-medium">{name}</span> will be set to draft and hidden from your site.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 h-9 rounded-lg border border-slate-200 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-9 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
          >
            Yes, hide it
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}