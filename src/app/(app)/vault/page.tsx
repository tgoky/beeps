"use client";

import { useState, useEffect } from "react";
import { generateLicenseCertificate } from "@/lib/generateCertificate";
import { ShieldCheck, DownloadCloud, FileText, Lock, Music2, Loader2, ArrowRight } from "lucide-react";
import { formatAmount } from "@/lib/currency";

export default function DigitalVaultPage() {
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVault = async () => {
      try {
        const res = await fetch("/api/users/me/licenses");
        const data = await res.json();
        if (data.success) setVaultItems(data.vault);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchVault();
  }, []);

  const handleDownloadPDF = (item: any) => {
    const mockBeat = { title: item.title };
    // Pass the raw agreement data into your PDF generator
    generateLicenseCertificate(item.rawAgreement, mockBeat, "You (Licensee)", item.producerName);
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-white/30">
      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Vault Header */}
        <div className="mb-12 border-b border-zinc-800 pb-8 flex items-end justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <Lock size={12} /> Beeps Digital Safe
            </div>
            <h1 className="text-4xl font-light tracking-tight text-white mb-2">Your Vault</h1>
            <p className="text-zinc-500 font-light tracking-wide">Secure access to your purchased beats, custom services, and legal certificates.</p>
          </div>
        </div>

        {vaultItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border border-zinc-800 border-dashed rounded-3xl bg-zinc-950/50">
            <ShieldCheck className="w-16 h-16 text-zinc-700 mb-4" strokeWidth={1} />
            <h3 className="text-xl font-light text-zinc-300 mb-2">Your Vault is Empty</h3>
            <p className="text-zinc-500 font-light">Purchase a beat or hire a producer to secure your first asset.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vaultItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden flex flex-col group hover:border-zinc-700 transition-all shadow-xl">
                
                {/* Artwork / Header */}
                <div className="h-48 relative bg-zinc-900 border-b border-zinc-800">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[url('/noise.png')] opacity-80">
                      <Music2 size={48} className="text-zinc-800" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded shadow-lg backdrop-blur-md border ${
                      item.licenseType === "EXCLUSIVE" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-white/20 text-white border-white/30"
                    }`}>
                      {item.licenseType.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-medium tracking-tight text-white mb-1 truncate">{item.title}</h3>
                  <p className="text-sm font-light text-zinc-400 mb-4">Prod. {item.producerName}</p>

                  <div className="bg-[#08080a] border border-zinc-800 rounded-xl p-4 mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] uppercase text-zinc-500 tracking-wider">Acquired On</span>
                      <span className="text-xs text-zinc-300 font-medium">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] uppercase text-zinc-500 tracking-wider">Amount</span>
                      <span className="text-xs text-zinc-300 font-medium">${parseFloat(item.amountPaid).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] uppercase text-zinc-500 tracking-wider">Hash</span>
                      <span className="text-[10px] font-mono text-emerald-500 truncate w-24">{item.licensedFileHash.slice(0, 12)}...</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto grid grid-cols-2 gap-3">
                    <a
                      href={`/api/licenses/${item.id}/download`}
                      target="_blank"
                      className="flex items-center justify-center gap-2 bg-white text-black text-xs font-bold px-4 py-3 rounded-xl hover:bg-zinc-200 transition-colors"
                    >
                      <DownloadCloud size={14} /> Audio
                    </a>
                    <button
                      onClick={() => handleDownloadPDF(item)}
                      className="flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-bold px-4 py-3 rounded-xl hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <FileText size={14} /> Certificate
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}