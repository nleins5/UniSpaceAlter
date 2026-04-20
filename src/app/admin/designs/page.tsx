"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

interface Submission {
  id: number;
  filename: string;
  url: string;
  tshirtColor: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

export default function AdminDesignsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/exports/submissions.json')
      .then(r => r.json())
      .then(data => { setSubmissions(data.reverse()); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Design Submissions</h1>
            <p className="text-sm text-gray-500 font-mono mt-1">{submissions.length} submissions total</p>
          </div>
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" title="System Operational" />
        </div>

        {loading ? (
          <div className="text-center py-32 text-gray-400 font-mono">Loading...</div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-32 text-gray-400 font-mono">No submissions yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="relative w-full h-64 bg-gray-100">
                  <Image
                    src={sub.url}
                    alt={`Design ${sub.id}`}
                    fill
                    className="object-contain p-4"
                    unoptimized
                  />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded border border-gray-200" style={{ backgroundColor: sub.tshirtColor }} />
                      <span className="text-[10px] font-mono text-gray-500">{sub.tshirtColor}</span>
                    </div>
                    <p className="text-[10px] font-mono text-gray-400">
                      {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <a
                    href={sub.url}
                    download
                    className="px-4 py-2 bg-black text-white text-[10px] font-black uppercase rounded-full hover:bg-gray-800 transition-all"
                  >
                    Download PNG
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
