# DApp Informasi Ketersediaan Kamar Rumah Sakit Terdesentralisasi

Sebuah DApp full-stack yang menyimpan data ketersediaan kamar rumah sakit secara **on-chain** demi imutabilitas, transparansi, dan akses tanpa kepercayaan pihak ketiga — tanpa perantara. Pasien dapat melihat status secara real-time tanpa biaya (tanpa wallet); staf rumah sakit memperbarui data melalui wallet terdaftar mereka.

> [!WARNING]
> **Revisi Keamanan Diterapkan:** Pola self-register (`registerHospital`) telah **dihapus total** — pola ini rentan terhadap **Sybil Attack** (sembarang address dapat berpura-pura menjadi rumah sakit). Digantikan dengan **Ownable pattern**: hanya `owner` kontrak (deployer) yang dapat memasukkan wallet rumah sakit ke dalam whitelist melalui fungsi `addHospital()`.

> [!IMPORTANT]
> **Lokasi proyek:** `C:\Users\Windows\sct\hospital-dapp`
> - Smart contract + Hardhat di: `hospital-dapp/` (root)
> - React frontend di: `hospital-dapp/frontend/`

---

## Perubahan yang Diajukan

### Smart Contract — Proyek Hardhat

#### [BARU] `HospitalRoom.sol`

Logika inti kontrak:

| Elemen | Keterangan |
|--------|-----------|
| **Pewarisan** | `Ownable` — deployer otomatis menjadi `owner`, tidak dapat diubah sembarangan |
| **State** | `mapping(address => RoomInfo)` di mana `RoomInfo = { totalRooms, availableRooms, isRegistered, name }` |
| **Enum** | `Status { AVAILABLE, FULL }` diturunkan dari kondisi `availableRooms > 0` |
| **Modifier** | `onlyOwner` (dari Ownable) · `onlyRegisteredHospital` — membatalkan transaksi jika `!isRegistered[msg.sender]` |
| **`addHospital(address, name)`** | **Khusus owner.** Memasukkan wallet rumah sakit ke whitelist. Mencegah Sybil Attack — tidak ada self-registration. |
| **`removeHospital(address)`** | **Khusus owner.** Mencabut akses rumah sakit. |
| **`updateRoomStatus(available, total)`** | Hanya untuk wallet RS yang sudah di-whitelist; memancarkan event `RoomStatusUpdated` |
| **`getRoomStatus(address)`** | `view` — publik, tidak membebankan gas kepada pemanggil, mengembalikan `RoomInfo` lengkap |
| **Events** | `HospitalAdded(address, name)` · `HospitalRemoved(address)` · `RoomStatusUpdated(address, available, total, timestamp)` |

#### [BARU] `scripts/deploy.js`
Script deployment Hardhat — men-deploy `HospitalRoom.sol` ke localhost, mencetak contract address, dan memanggil `addHospital()` untuk satu wallet rumah sakit uji coba (Account[1]) demi kemudahan pengujian lokal.

#### [BARU] `hardhat.config.js`
Dikonfigurasi untuk `solidity: "0.8.20"`, dengan `networks.localhost` mengarah ke `http://127.0.0.1:8545`.

---

### React Frontend — Vite + Tailwind CSS

#### [BARU] `frontend/src/abi/HospitalRoom.json`
ABI yang disalin dari artefak Hardhat setelah kompilasi berhasil.

#### [BARU] `frontend/src/hooks/useHospitalRoom.js`
Hook Ethers.js v6 yang merangkum:
- `getProvider()` — `JsonRpcProvider` (hanya baca, tidak memerlukan wallet)
- `getSigner()` — `BrowserProvider` MetaMask untuk operasi tulis
- `fetchStatus(address)` — memanggil `getRoomStatus` melalui provider read-only
- `connectWallet()` — memicu popup MetaMask
- `updateStatus(available, total)` — memanggil `updateRoomStatus` menggunakan signer

#### [BARU] `frontend/src/components/PublicDashboard.jsx`
- Tidak memerlukan wallet — menggunakan `JsonRpcProvider` read-only
- Input: wallet address rumah sakit → mengambil dan menampilkan status
- Indikator visual: **🟢 Tersedia** (lencana hijau) / **🔴 Penuh** (lencana merah)
- Menampilkan: `availableRooms / totalRooms`, nama rumah sakit, timestamp terakhir diperbarui
- Pembaruan otomatis dengan interval `useEffect` React (setiap 15 detik)

#### [BARU] `frontend/src/components/AdminPanel.jsx`
- Tombol Connect Wallet (MetaMask) — menampilkan address yang terhubung
- Mendeteksi apakah wallet yang terhubung sudah di-whitelist melalui field `isRegistered` pada `getRoomStatus`
- Jika **belum di-whitelist**: menampilkan peringatan — "Wallet belum terdaftar, hubungi administrator"
- Jika **sudah di-whitelist**: menampilkan formulir — input `availableRooms` + `totalRooms` → submit memanggil `updateRoomStatus`
- Menampilkan tx hash saat berhasil dan memperbarui data dashboard secara otomatis

#### [BARU] `frontend/src/App.jsx`
Tata letak berbasis tab: **Dashboard** (publik) | **Admin** (memerlukan wallet).

#### [BARU] `frontend/tailwind.config.js` + `frontend/src/index.css`
Palet warna bernuansa medis-profesional — navy/teal sebagai warna utama, kartu putih bersih, warna lencana status.

---

## Rencana Verifikasi

### Pengujian Otomatis (Hardhat)

```bash
# 1. Kompilasi — harus bebas error
cd C:\Users\Windows\sct\hospital-dapp
npx hardhat compile

# 2. Jalankan local node (biarkan terminal ini tetap terbuka)
npx hardhat node

# 3. Deploy ke local node
npx hardhat run scripts/deploy.js --network localhost
```
Hasil yang diharapkan: Contract address tercetak, contoh: `HospitalRoom deployed to: 0x5FbDB...`

### Verifikasi Manual — Smart Contract (Hardhat Console)

```bash
npx hardhat console --network localhost
```
Kemudian di dalam console:
```javascript
const [owner, hospital1, attacker] = await ethers.getSigners()
const HospitalRoom = await ethers.getContractFactory("HospitalRoom")
const contract = await HospitalRoom.attach("TEMPEL_DEPLOYED_ADDRESS")

// ✅ Owner memasukkan rumah sakit ke whitelist
await contract.connect(owner).addHospital(hospital1.address, "RS Maju")

// ✅ Rumah sakit yang sudah di-whitelist memperbarui status
await contract.connect(hospital1).updateRoomStatus(10, 20)

// ✅ Pembacaan publik (tidak memerlukan wallet)
await contract.getRoomStatus(hospital1.address)
// Hasil: { totalRooms: 20, availableRooms: 10, isRegistered: true, name: "RS Maju" }

// ❌ Sybil Attack diblokir — penyerang mencoba self-update
await contract.connect(attacker).updateRoomStatus(5, 10)
// Hasil: revert "Not a registered hospital"

// ❌ Non-owner mencoba menambah rumah sakit
await contract.connect(attacker).addHospital(attacker.address, "RS Palsu")
// Hasil: revert "Ownable: caller is not the owner"
```

### Verifikasi Manual — Frontend

```bash
cd C:\Users\Windows\sct\hospital-dapp\frontend
npm run dev
# Terbuka di http://localhost:5173
```

| Skenario Uji | Langkah-Langkah | Hasil yang Diharapkan |
|---|---|---|
| **Dashboard Publik — tanpa wallet** | Buka halaman, tempel address RS yang sudah di-whitelist, klik Cari | Menampilkan lencana status kamar tanpa prompt MetaMask |
| **Admin — wallet sudah di-whitelist** | Klik tab Admin → Connect Wallet (Account[1] dari Hardhat) → Isi formulir → Submit | Popup MetaMask muncul; setelah konfirmasi, tx hash ditampilkan; Dashboard mencerminkan data baru |
| **Admin — wallet belum di-whitelist** | Hubungkan wallet yang belum ditambahkan oleh owner | Peringatan: "Wallet belum terdaftar, hubungi administrator" — formulir disembunyikan |
| **Kontrol Akses** | Hardhat console: non-owner memanggil `addHospital` | Revert: `"Ownable: caller is not the owner"` |
