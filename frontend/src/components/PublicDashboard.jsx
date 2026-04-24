import { useState, useEffect, useCallback } from "react";
import { useHospitalRoom } from "../hooks/useHospitalRoom";
import { TEST_HOSPITAL_WALLET } from "../config";

/**
 * Dashboard publik — siapa pun bisa melihat status kamar RS.
 * Tidak memerlukan wallet. Data diambil langsung dari blockchain via JsonRpcProvider.
 */
export default function PublicDashboard() {
  const { fetchRoomStatus, fetchAllHospitals, loading, error } = useHospitalRoom();

  const [searchInput,   setSearchInput]   = useState(TEST_HOSPITAL_WALLET);
  const [statusData,    setStatusData]    = useState(null);
  const [allHospitals,  setAllHospitals]  = useState([]);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Muat daftar semua RS saat pertama render
  useEffect(() => {
    fetchAllHospitals().then(setAllHospitals);
  }, [fetchAllHospitals]);

  // Auto-refresh setiap 15 detik jika ada RS yang sedang ditampilkan
  useEffect(() => {
    if (!statusData) return;
    const interval = setInterval(() => handleSearch(searchInput), 15000);
    return () => clearInterval(interval);
  }, [statusData, searchInput]);

  const handleSearch = useCallback(async (address) => {
    const trimmed = address.trim();
    if (!trimmed) return;
    const result = await fetchRoomStatus(trimmed);
    setStatusData(result);
    setLastRefreshed(new Date());
  }, [fetchRoomStatus]);

  const formatTimestamp = (unix) => {
    if (!unix) return "-";
    return new Date(unix * 1000).toLocaleString("id-ID", {
      dateStyle: "medium", timeStyle: "short"
    });
  };

  const occupancyPercent = statusData
    ? statusData.totalRooms > 0
      ? Math.round(((statusData.totalRooms - statusData.availableRooms) / statusData.totalRooms) * 100)
      : 0
    : 0;

  return (
    <div className="space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 text-sm px-4 py-1.5 rounded-full mb-4">
          <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
          Data Real-Time dari Blockchain
        </div>
        <h2 className="text-3xl font-bold text-slate-800">Dashboard Ketersediaan Kamar</h2>
        <p className="text-slate-500 mt-2 text-sm">
          Data bersumber langsung dari smart contract — transparan, imutabel, tanpa perantara.
        </p>
      </div>

      {/* ── Daftar RS Terdaftar ────────────────────────────────────────── */}
      {allHospitals.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Rumah Sakit Terdaftar ({allHospitals.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {allHospitals.map((addr) => (
              <button
                key={addr}
                onClick={() => { setSearchInput(addr); handleSearch(addr); }}
                className="text-xs font-mono bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 hover:border-teal-300 text-slate-600 px-3 py-1.5 rounded-lg transition-all duration-200"
              >
                {addr.slice(0, 6)}…{addr.slice(-4)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input Pencarian ────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch(searchInput)}
          placeholder="Masukkan wallet address rumah sakit (0x...)"
          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all shadow-sm font-mono"
        />
        <button
          onClick={() => handleSearch(searchInput)}
          disabled={loading}
          className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm active:scale-95 flex items-center gap-2 min-w-[100px] justify-center"
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : "🔍 Cari"}
        </button>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
          <span className="text-red-500 mt-0.5">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Kartu Status ───────────────────────────────────────────────── */}
      {statusData && (
        <div className={`rounded-2xl border-2 shadow-lg p-6 transition-all duration-500 ${
          !statusData.isRegistered
            ? "bg-slate-50 border-slate-300"
            : statusData.isFull
              ? "bg-red-50 border-red-300"
              : "bg-emerald-50 border-emerald-300"
        }`}>
          {/* Nama & Badge Status */}
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-800">
                {statusData.name || "Rumah Sakit"}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-mono break-all">
                {searchInput}
              </p>
            </div>
            {statusData.isRegistered ? (
              <span className={`px-4 py-2 rounded-xl text-sm font-bold tracking-wide shadow-sm ${
                statusData.isFull
                  ? "bg-red-500 text-white"
                  : "bg-emerald-500 text-white"
              }`}>
                {statusData.isFull ? "🔴 PENUH" : "🟢 TERSEDIA"}
              </span>
            ) : (
              <span className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-400 text-white">
                ⚪ TIDAK TERDAFTAR
              </span>
            )}
          </div>

          {statusData.isRegistered && (
            <>
              {/* Statistik Kamar */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Kamar Tersedia", value: statusData.availableRooms, color: "text-emerald-700" },
                  { label: "Total Kapasitas", value: statusData.totalRooms,     color: "text-slate-700"   },
                  { label: "Terisi",          value: `${occupancyPercent}%`,    color: "text-orange-600"  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white/70 rounded-xl p-4 text-center border border-white/80 shadow-sm">
                    <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mb-5">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Tingkat Keterisian</span>
                  <span>{occupancyPercent}%</span>
                </div>
                <div className="w-full h-3 bg-white/70 rounded-full overflow-hidden border border-white/80">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      occupancyPercent >= 90 ? "bg-red-500" :
                      occupancyPercent >= 70 ? "bg-orange-400" : "bg-emerald-500"
                    }`}
                    style={{ width: `${occupancyPercent}%` }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-200/80 pt-4 mt-2">
            <span>
              🕒 Terakhir diperbarui: <strong>{formatTimestamp(statusData.lastUpdated)}</strong>
            </span>
            {lastRefreshed && (
              <span>Auto-refresh aktif · {lastRefreshed.toLocaleTimeString("id-ID")}</span>
            )}
          </div>
        </div>
      )}

      {/* ── Placeholder awal ───────────────────────────────────────────── */}
      {!statusData && !loading && !error && (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-4">🏥</div>
          <p className="text-sm">Masukkan wallet address rumah sakit untuk melihat status kamar.</p>
        </div>
      )}

    </div>
  );
}
