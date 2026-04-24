import { useState } from "react";
import PublicDashboard  from "./components/PublicDashboard";
import AdminPanel       from "./components/AdminPanel";
import { CONTRACT_ADDRESS } from "./config";

const TABS = [
  { id: "dashboard", label: "🏥 Dashboard Publik", desc: "Tanpa wallet" },
  { id: "admin",     label: "⚙️ Panel Admin",      desc: "Wallet RS" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100">

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white text-lg">⛓️</span>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-800 leading-none">RoomChain</h1>
              <p className="text-xs text-slate-400 leading-none mt-0.5">Ketersediaan Kamar RS · On-Chain</p>
            </div>
          </div>

          {/* Tab navigasi */}
          <nav className="flex bg-slate-100 rounded-xl p-1 gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white text-teal-700 shadow-sm border border-slate-200/80"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 text-xs font-normal ${activeTab === tab.id ? "text-teal-400" : "text-slate-400"}`}>
                  ({tab.desc})
                </span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Konten Utama ─────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        {activeTab === "dashboard" ? <PublicDashboard /> : <AdminPanel />}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 mt-16 py-6 text-center">
        <p className="text-xs text-slate-400">
          Ditenagai oleh{" "}
          <span className="font-semibold text-teal-600">Ethereum (Hardhat Local Node)</span>
          {" · "}
          Smart Contract:{" "}
          <code className="font-mono text-slate-500 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
            {CONTRACT_ADDRESS.slice(0, 6)}…{CONTRACT_ADDRESS.slice(-5)}
          </code>
          {" · "}
          Data bersifat imutabel &amp; transparan
        </p>
      </footer>
    </div>
  );
}
