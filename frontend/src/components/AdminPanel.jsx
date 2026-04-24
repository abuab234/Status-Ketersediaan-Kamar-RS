import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useHospitalRoom }  from "../hooks/useHospitalRoom";
import ABI                  from "../abi/HospitalRoom.json";
import { CONTRACT_ADDRESS } from "../config";

/**
 * Panel Admin — hanya dapat diakses oleh wallet RS yang sudah di-whitelist oleh owner.
 *
 * Perbaikan (bug-fix):
 *   Pengecekan `isRegistered` sekarang menggunakan BrowserProvider (MetaMask) secara
 *   langsung, bukan JsonRpcProvider dari hook. Ini menghilangkan race condition di mana
 *   walletStatus tetap null secara silent ketika kedua provider aktif bersamaan.
 */
export default function AdminPanel() {
  const { connectWallet, updateRoomStatus } = useHospitalRoom();

  // ── State lokal yang terpisah dari hook publik ──────────────────────────
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [walletStatus,     setWalletStatus]     = useState(null);   // null = belum di-cek
  const [statusLoading,    setStatusLoading]    = useState(false);
  const [statusError,      setStatusError]      = useState(null);

  const [formData,      setFormData]      = useState({ available: "", total: "" });
  const [txHash,        setTxHash]        = useState(null);
  const [txError,       setTxError]       = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [connectError,  setConnectError]  = useState(null);

  // ── Baca status wallet langsung via BrowserProvider (MetaMask) ──────────
  // Ini menghindari konflik dengan JsonRpcProvider read-only di hook publik.
  const checkWalletStatus = useCallback(async (address) => {
    if (!window.ethereum || !address) return;
    setStatusLoading(true);
    setStatusError(null);
    setWalletStatus(null);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const res      = await contract.getRoomStatus(address);
      setWalletStatus({
        name:           res.name,
        totalRooms:     Number(res.totalRooms),
        availableRooms: Number(res.availableRooms),
        isRegistered:   res.isRegistered,
        lastUpdated:    Number(res.lastUpdated),
        isFull:         res.isFull,
      });
    } catch (err) {
      setStatusError("Gagal memeriksa status wallet: " + (err.reason || err.message));
    } finally {
      setStatusLoading(false);
    }
  }, []);

  // Jalankan pengecekan setiap kali connectedAddress berubah
  useEffect(() => {
    if (connectedAddress) checkWalletStatus(connectedAddress);
  }, [connectedAddress, checkWalletStatus]);

  // Dengarkan pergantian akun MetaMask dari luar komponen
  useEffect(() => {
    if (!window.ethereum) return;
    const handler = (accounts) => {
      if (accounts.length === 0) {
        setConnectedAddress(null);
        setWalletStatus(null);
        setTxHash(null);
      } else {
        setConnectedAddress(accounts[0]);
      }
    };
    window.ethereum.on("accountsChanged", handler);
    return () => window.ethereum.removeListener("accountsChanged", handler);
  }, []);

  // ── Hubungkan wallet ────────────────────────────────────────────────────
  const handleConnect = async () => {
    setConnectError(null);
    try {
      const addr = await connectWallet();
      setConnectedAddress(addr);
    } catch (err) {
      setConnectError(err.message);
    }
  };

  // ── Submit update status kamar ──────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTxHash(null);
    setTxError(null);

    const available = parseInt(formData.available, 10);
    const total     = parseInt(formData.total,     10);

    if (isNaN(available) || isNaN(total) || available < 0 || total <= 0) {
      setTxError("Masukkan angka yang valid. Total kamar harus lebih dari 0.");
      return;
    }
    if (available > total) {
      setTxError("Kamar tersedia tidak boleh melebihi total kamar.");
      return;
    }

    setSubmitLoading(true);
    try {
      const hash = await updateRoomStatus(available, total);
      setTxHash(hash);
      setFormData({ available: "", total: "" });
      // Refresh status setelah update berhasil
      await checkWalletStatus(connectedAddress);
    } catch (err) {
      setTxError(err.reason || err.data?.message || err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const shortAddr = (addr) => addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";

  const formatTimestamp = (unix) =>
    unix ? new Date(unix * 1000).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-";

  const occupancyPct = walletStatus?.totalRooms > 0
    ? Math.round(((walletStatus.totalRooms - walletStatus.availableRooms) / walletStatus.totalRooms) * 100)
    : 0;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-xl mx-auto">

      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800">Panel Admin</h2>
        <p className="text-slate-500 mt-2 text-sm">
          Khusus staf rumah sakit yang wallet-nya telah didaftarkan oleh admin sistem.
        </p>
      </div>

      {/* ── Step 1: Belum terhubung ──────────────────────────────────────── */}
      {!connectedAddress ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          <div className="text-5xl">🦊</div>
          <h3 className="text-lg font-bold text-slate-700">Hubungkan Wallet</h3>
          <p className="text-sm text-slate-500">
            Gunakan akun MetaMask yang telah didaftarkan oleh Admin Pusat.
          </p>
          <button
            onClick={handleConnect}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 shadow-sm"
          >
            🔗 Hubungkan MetaMask
          </button>
          {connectError && (
            <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {connectError}
            </p>
          )}
        </div>
      ) : (
        <>
          {/* ── Info wallet terhubung ──────────────────────────────── */}
          <div className={`rounded-2xl border-2 p-4 flex items-center justify-between gap-3 transition-colors duration-300 ${
            statusLoading          ? "bg-slate-50   border-slate-200" :
            walletStatus?.isRegistered ? "bg-emerald-50 border-emerald-300" :
                                        "bg-amber-50  border-amber-300"
          }`}>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Wallet Terhubung</p>
              <p className="font-mono text-slate-800 font-bold text-sm mt-0.5">{shortAddr(connectedAddress)}</p>
              {statusLoading && (
                <p className="text-xs mt-1 text-slate-400 animate-pulse">Memeriksa status di blockchain…</p>
              )}
              {!statusLoading && walletStatus && (
                <p className={`text-xs mt-1 font-medium ${walletStatus.isRegistered ? "text-emerald-700" : "text-amber-700"}`}>
                  {walletStatus.isRegistered
                    ? `✅ Terdaftar sebagai: ${walletStatus.name}`
                    : "⚠️ Wallet ini belum terdaftar dalam sistem"}
                </p>
              )}
              {!statusLoading && statusError && (
                <p className="text-xs mt-1 text-red-500">{statusError}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              {statusError && (
                <button
                  onClick={() => checkWalletStatus(connectedAddress)}
                  className="text-xs text-teal-600 border border-teal-300 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-all"
                >
                  🔄 Coba lagi
                </button>
              )}
              <button
                onClick={() => { setConnectedAddress(null); setWalletStatus(null); setTxHash(null); setTxError(null); }}
                className="text-xs text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-all"
              >
                Putuskan
              </button>
            </div>
          </div>

          {/* ── Loading skeleton saat cek status ─────────────────── */}
          {statusLoading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-10 bg-slate-100 rounded-xl"></div>
              <div className="h-10 bg-slate-100 rounded-xl"></div>
              <div className="h-12 bg-slate-200 rounded-xl"></div>
            </div>
          )}

          {/* ── Akses Ditolak: wallet tidak terdaftar ────────────── */}
          {!statusLoading && walletStatus && !walletStatus.isRegistered && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 text-center space-y-2">
              <div className="text-3xl">🔒</div>
              <h3 className="font-bold text-amber-800">Akses Ditolak</h3>
              <p className="text-sm text-amber-700">
                Wallet <span className="font-mono font-bold">{shortAddr(connectedAddress)}</span> belum
                terdaftar dalam sistem. Hubungi Admin Pusat untuk mendaftarkan wallet Anda via fungsi{" "}
                <code className="bg-amber-100 px-1 rounded">addHospital()</code>.
              </p>
            </div>
          )}

          {/* ── FORMULIR UPDATE KAMAR: wallet terdaftar ──────────── */}
          {!statusLoading && walletStatus?.isRegistered && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Perbarui Status Kamar</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Data yang disubmit akan langsung tercatat on-chain — transparan dan tidak dapat diubah secara retroaktif.
                </p>
              </div>

              {/* Status saat ini */}
              {walletStatus.totalRooms > 0 && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Status Saat Ini</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: "Tersedia",   value: walletStatus.availableRooms, cls: "text-emerald-600" },
                      { label: "Total",      value: walletStatus.totalRooms,     cls: "text-slate-700"   },
                      { label: "Status",     value: walletStatus.isFull ? "PENUH" : "TERSEDIA",
                        cls: walletStatus.isFull ? "text-red-500" : "text-emerald-500" },
                    ].map(({ label, value, cls }) => (
                      <div key={label}>
                        <p className={`text-2xl font-extrabold ${cls}`}>{value}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                  {walletStatus.lastUpdated > 0 && (
                    <p className="text-xs text-slate-400 mt-3 text-center">
                      🕒 Diperbarui: <strong>{formatTimestamp(walletStatus.lastUpdated)}</strong>
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          occupancyPct >= 90 ? "bg-red-500" :
                          occupancyPct >= 70 ? "bg-orange-400" : "bg-emerald-500"
                        }`}
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 text-right">{occupancyPct}% terisi</p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Kamar Tersedia <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number" min="0"
                      value={formData.available}
                      onChange={(e) => setFormData(p => ({ ...p, available: e.target.value }))}
                      required placeholder="cth: 15"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Total Kapasitas <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number" min="1"
                      value={formData.total}
                      onChange={(e) => setFormData(p => ({ ...p, total: e.target.value }))}
                      required placeholder="cth: 30"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"
                    />
                  </div>
                </div>

                {txError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                    ⚠️ {txError}
                  </div>
                )}

                {txHash && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 space-y-1">
                    <p className="text-emerald-700 font-semibold text-sm">✅ Status berhasil diperbarui!</p>
                    <p className="text-xs text-slate-500 font-mono break-all">Tx Hash: {txHash}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 shadow-sm flex items-center justify-center gap-2"
                >
                  {submitLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Menunggu konfirmasi MetaMask…
                    </>
                  ) : "📡 Broadcast ke Blockchain"}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
