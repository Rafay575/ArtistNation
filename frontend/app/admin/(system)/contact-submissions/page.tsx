"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api as axios } from "@/lib/api";
import { Loader2, Mail, Phone, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";

interface Submission {
  id: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
  created_at: string;
}

interface SubmissionsResponse {
  submissions: Submission[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
} as const;

const tableRow = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
} as const;

export default function ContactSubmissionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const { data, isLoading, isError } = useQuery<SubmissionsResponse>({
    queryKey: ["contactSubmissions", page],
    queryFn: async () => {
      const res = await axios.get("/api/admin/contact-submissions", { params: { page, limit } });
      return res.data;
    },
  });

  const submissions = data?.submissions || [];
  const pagination = data?.pagination;

  // client-side search filter
  const filtered = submissions.filter((s) =>
    !search
      ? true
      : s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        s.message.toLowerCase().includes(search.toLowerCase())
  );

  const total = pagination?.total || 0;

  const stats = [
    { id: 1, label: "Total Messages", value: total.toString(), iconBg: "bg-indigo-50", icon: Mail },
  ];

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;
  if (isError) return <div className="text-center py-20 text-red-500">Failed to load submissions.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto space-y-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-xl font-semibold text-slate-800">Contact Submissions</h1>
          <p className="text-xs text-slate-400 mt-0.5">Messages from your website visitors</p>
        </motion.div>

        {/* Stat card */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <motion.div key={stat.id} variants={fadeUp} whileHover={{ y: -2 }} className="bg-white rounded-xl border p-4 flex flex-col gap-6">
              <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Search + Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">All Messages</h2>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-left text-xs font-semibold text-gray-400 uppercase px-5 py-3">Sr</TableHead>
                <TableHead className="text-left text-xs font-semibold text-gray-400 uppercase px-5 py-3">Name</TableHead>
                <TableHead className="text-left text-xs font-semibold text-gray-400 uppercase px-5 py-3">Email</TableHead>
                <TableHead className="text-left text-xs font-semibold text-gray-400 uppercase px-5 py-3">Phone</TableHead>
                <TableHead className="text-left text-xs font-semibold text-gray-400 uppercase px-5 py-3">Message</TableHead>
                <TableHead className="text-left text-xs font-semibold text-gray-400 uppercase px-5 py-3">Date</TableHead>
              </TableRow>
            </TableHeader>
            <motion.tbody variants={container} initial="hidden" animate="show">
              {filtered.length > 0 ? (
                filtered.map((sub,_) => (
                  <motion.tr key={sub.id} variants={tableRow} whileHover={{ backgroundColor: "#faf5ff" }}
                    className="border-b border-gray-100 last:border-0">
                    <TableCell className="px-5 py-3 text-sm font-medium">{_ +1}</TableCell>
                    <TableCell className="px-5 py-3 text-sm font-medium">{sub.name}</TableCell>
                    <TableCell className="px-5 py-3 text-sm text-blue-600">{sub.email}</TableCell>
                    <TableCell className="px-5 py-3 text-sm">{sub.phone || "—"}</TableCell>
                    <TableCell className="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">{sub.message}</TableCell>
                    <TableCell className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </TableCell>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">
                    No messages found.
                  </td>
                </tr>
              )}
            </motion.tbody>
          </Table>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center py-4 border-t">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }}
                      className={page <= 1 ? "pointer-events-none opacity-50" : ""} />
                  </PaginationItem>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setPage(p); }} isActive={p === page}>
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (page < pagination.totalPages) setPage(page + 1); }}
                      className={page >= pagination.totalPages ? "pointer-events-none opacity-50" : ""} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}