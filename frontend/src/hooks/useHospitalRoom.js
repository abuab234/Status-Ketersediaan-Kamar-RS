import { useState, useCallback } from "react";
import { ethers } from "ethers";
import ABI from "../abi/HospitalRoom.json";
import { CONTRACT_ADDRESS, RPC_URL } from "../config";

/**
 * Hook terpusat untuk semua interaksi dengan smart contract HospitalRoom.
 * - getContract()        → instance read-only menggunakan JsonRpcProvider (tanpa wallet)
 * - getSignedContract()  → instance write menggunakan BrowserProvider MetaMask
 */
export function useHospitalRoom() {
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState(null);

  // ── Koneksi read-only (publik, tanpa wallet) ─────────────────────────────
  const getContract = useCallback(() => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  }, []);

  // ── Koneksi write (memerlukan MetaMask) ──────────────────────────────────
  const getSignedContract = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask tidak terdeteksi");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer   = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  }, []);

  // ── Mengambil status kamar satu RS (read-only) ───────────────────────────
  const fetchRoomStatus = useCallback(async (hospitalAddress) => {
    setError(null);
    setLoading(true);
    try {
      const contract = getContract();
      const result   = await contract.getRoomStatus(hospitalAddress);
      return {
        name:           result.name,
        totalRooms:     Number(result.totalRooms),
        availableRooms: Number(result.availableRooms),
        isRegistered:   result.isRegistered,
        lastUpdated:    Number(result.lastUpdated),
        isFull:         result.isFull,
      };
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  // ── Mengambil semua address RS terdaftar ─────────────────────────────────
  const fetchAllHospitals = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const contract = getContract();
      return await contract.getAllHospitals();
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  // ── Menghubungkan wallet MetaMask ────────────────────────────────────────
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask tidak terdeteksi. Pasang ekstensi MetaMask terlebih dahulu.");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    return accounts[0];
  }, []);

  // ── Memperbarui status kamar (hanya RS terdaftar) ────────────────────────
  const updateRoomStatus = useCallback(async (availableRooms, totalRooms) => {
    setError(null);
    setLoading(true);
    try {
      const contract = await getSignedContract();
      const tx       = await contract.updateRoomStatus(availableRooms, totalRooms);
      await tx.wait();
      return tx.hash;
    } catch (err) {
      // Ekstrak pesan error dari revert Solidity jika ada
      const msg = err?.reason || err?.data?.message || err.message;
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [getSignedContract]);

  return { fetchRoomStatus, fetchAllHospitals, connectWallet, updateRoomStatus, loading, error };
}
