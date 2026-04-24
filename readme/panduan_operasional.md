# 📋 Panduan Operasional — RoomChain DApp
**Proyek: Decentralized Hospital Room Availability**
`C:\Users\Windows\sct\hospital-dapp`

---

## 🔁 Bagian 1 — Restart Setelah Laptop Mati / Restart

> [!IMPORTANT]
> Hardhat node bersifat **sementara (in-memory)**. Setiap kali laptop restart, blockchain lokal reset dari awal. Anda **wajib deploy ulang** kontrak dan akan mendapatkan **contract address baru**.

### Urutan Perintah (Jalankan 3 Terminal Terpisah)

**Terminal 1 — Jalankan Blockchain Lokal**
```bash
cd C:\Users\Windows\sct\hospital-dapp
npx hardhat node
```
> Biarkan terminal ini tetap terbuka selama sesi kerja. Jangan ditutup.

**Terminal 2 — Deploy Ulang Smart Contract**
```bash
cd C:\Users\Windows\sct\hospital-dapp
npx hardhat run scripts/deploy.js --network localhost
```
Catat output yang muncul:
```
CONTRACT_ADDRESS = 0x....   ← SALIN INI
WALLET_RS_UJI   = 0x....   ← Wallet RS uji coba (Account[1])
```

**Terminal 3 — Jalankan Frontend**
```bash
cd C:\Users\Windows\sct\hospital-dapp\frontend
npm run dev
```
Buka browser: **http://localhost:5173**

### Perbarui Contract Address di Frontend

Setelah mendapat address baru dari deploy, perbarui file:
```
C:\Users\Windows\sct\hospital-dapp\frontend\src\config.js
```
```javascript
export const CONTRACT_ADDRESS = "0xALAMAT_BARU_DI_SINI";
```
Simpan file → Vite akan otomatis reload browser.

---

## 🔑 Referensi Cepat — Address & Kunci

| Item | Nilai |
|------|-------|
| **Contract Address** (sesi terakhir) | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |
| **Owner / Admin Pusat** (Account[0]) | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| **RS Uji Coba** (Account[1]) | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| **RPC URL Hardhat** | `http://127.0.0.1:8545` |
| **Chain ID** | `31337` |
| **Frontend URL** | `http://localhost:5173` |

> [!CAUTION]
> Private key di bawah ini adalah akun uji coba Hardhat yang **bersifat publik**. Jangan gunakan di Mainnet atau simpan aset nyata di dalamnya.

| Akun | Private Key |
|------|------------|
| Account[0] — Owner | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| Account[1] — RS Uji Coba | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |

---

## ⚙️ Bagian 2 — Panduan Admin (Owner Kontrak)

> Admin Pusat = wallet Account[0] yang men-deploy kontrak. Hanya akun ini yang dapat menjalankan fungsi di bawah.

### 2A. Mendaftarkan Rumah Sakit Baru (`addHospital`)

**Via Hardhat Console:**
```bash
npx hardhat console --network localhost
```
```javascript
// Di dalam console:
const [owner] = await ethers.getSigners()
const contract = await ethers.getContractAt("HospitalRoom", "PASTE_CONTRACT_ADDRESS")

// Daftarkan RS baru
await contract.connect(owner).addHospital(
  "0xALAMAT_WALLET_RS_BARU",
  "Nama Rumah Sakit Lengkap"
)
// Output: TransactionResponse { hash: "0x..." }
```

**Verifikasi berhasil:**
```javascript
await contract.getRoomStatus("0xALAMAT_WALLET_RS_BARU")
// Pastikan isRegistered: true
```

> [!TIP]
> Setelah `addHospital` berhasil, staf RS tersebut bisa langsung login ke Panel Admin di frontend dan memperbarui status kamar.

---

### 2B. Mencabut Akses Rumah Sakit (`removeHospital`)

```javascript
await contract.connect(owner).removeHospital("0xALAMAT_WALLET_RS")
```

> Data historis RS tetap tersimpan on-chain (transparan). Hanya flag `isRegistered` yang diubah menjadi `false`. RS tersebut tidak lagi bisa memperbarui data.

---

### 2C. Melihat Semua RS Terdaftar

```javascript
// Daftar semua address RS
const semuaRS = await contract.getAllHospitals()
console.log(semuaRS)

// Jumlah total RS
const jumlah = await contract.totalHospitals()
console.log("Total RS:", jumlah.toString())

// Cek status RS tertentu
const status = await contract.getRoomStatus("0xALAMAT_RS")
console.log({
  nama:       status.name,
  tersedia:   status.availableRooms.toString(),
  total:      status.totalRooms.toString(),
  terdaftar:  status.isRegistered,
  penuh:      status.isFull,
})
```

---

### 2D. Memindahkan Ownership Kontrak (`transferOwnership`)

> Gunakan ini jika admin berganti. Setelah dijalankan, owner lama kehilangan seluruh akses admin.

```javascript
await contract.connect(owner).transferOwnership("0xALAMAT_OWNER_BARU")
```

---

## 🏥 Bagian 3 — Panduan Staf Rumah Sakit

> Staf RS = wallet yang sudah di-whitelist oleh Admin Pusat via `addHospital()`.

### 3A. Login ke Panel Admin (Via Frontend)

1. Buka **http://localhost:5173**
2. Klik tab **⚙️ Panel Admin (Wallet RS)**
3. Klik **🔗 Hubungkan MetaMask**
4. Pilih akun wallet yang sudah terdaftar
5. Sistem otomatis memverifikasi whitelist status
6. Jika terdaftar → formulir update muncul ✅
7. Jika belum terdaftar → pesan "Akses Ditolak" muncul ❌

### 3B. Memperbarui Status Kamar (`updateRoomStatus`)

**Via Frontend (cara utama):**
1. Login ke Panel Admin (langkah 3A)
2. Isi formulir:
   - **Kamar Tersedia**: jumlah kamar kosong saat ini
   - **Total Kapasitas**: total kapasitas seluruh kamar RS
3. Klik **📡 Broadcast ke Blockchain**
4. Konfirmasi transaksi di MetaMask
5. Tunggu konfirmasi → tx hash tampil → status diperbarui ✅

**Via Hardhat Console (untuk pengujian):**
```javascript
const [owner, hospital1] = await ethers.getSigners()
const contract = await ethers.getContractAt("HospitalRoom", "PASTE_CONTRACT_ADDRESS")

// Update: 15 kamar tersedia dari 30 total
await contract.connect(hospital1).updateRoomStatus(15, 30)

// Update: semua kamar penuh
await contract.connect(hospital1).updateRoomStatus(0, 30)
```

**Aturan Validasi:**
| Kondisi | Hasil |
|---------|-------|
| `availableRooms <= totalRooms` | ✅ Valid |
| `availableRooms > totalRooms`  | ❌ Revert: "available cannot exceed total" |
| `totalRooms == 0`              | ❌ Revert: "total rooms must be greater than 0" |
| Wallet tidak terdaftar         | ❌ Revert: "caller is not a registered hospital" |

---

## 👥 Bagian 4 — Panduan Pengguna / Masyarakat (Publik)

> Tidak memerlukan wallet, tidak ada biaya, akses langsung ke data on-chain.

### 4A. Melihat Status Kamar RS

1. Buka **http://localhost:5173**
2. Tab **🏥 Dashboard Publik** sudah aktif secara default
3. Klik tombol address RS yang muncul di bagian **"Rumah Sakit Terdaftar"**, ATAU
4. Ketik manual wallet address RS di kolom pencarian
5. Klik **🔍 Cari**

**Yang ditampilkan:**
| Informasi | Keterangan |
|-----------|-----------|
| Nama RS | Nama resmi yang terdaftar on-chain |
| 🟢 TERSEDIA | Masih ada kamar kosong (`availableRooms > 0`) |
| 🔴 PENUH | Tidak ada kamar kosong (`availableRooms == 0`) |
| Kamar Tersedia | Jumlah kamar yang kosong saat ini |
| Total Kapasitas | Total kapasitas seluruh kamar |
| Tingkat Keterisian | Persentase kamar yang terisi |
| Terakhir Diperbarui | Waktu terakhir staf RS memperbarui data |

> [!NOTE]
> Data diperbarui otomatis setiap **15 detik**. Tidak perlu refresh halaman manual.

### 4B. Interpretasi Status

```
🟢 TERSEDIA → Kamar masih ada, Anda bisa menghubungi RS
🔴 PENUH    → Tidak ada kamar kosong saat ini
⚪ TIDAK TERDAFTAR → Address yang dimasukkan belum terdaftar di sistem
```

---

## 🛠️ Bagian 5 — Pemecahan Masalah Umum

| Masalah | Kemungkinan Penyebab | Solusi |
|---------|---------------------|--------|
| "Akses Ditolak" di Panel Admin | Wallet belum di-whitelist | Minta Admin Pusat jalankan `addHospital()` |
| Dashboard tidak memuat data | Hardhat node tidak berjalan | Jalankan `npx hardhat node` di Terminal 1 |
| Contract address salah | Deploy ulang tapi config belum diperbarui | Update `CONTRACT_ADDRESS` di `src/config.js` |
| MetaMask tidak muncul | Ekstensi MetaMask belum terpasang | Install MetaMask dari metamask.io |
| Chain ID salah di MetaMask | MetaMask terhubung ke network lain | Switch ke Hardhat Local (Chain ID: 31337) |
| Frontend tidak reload setelah ubah config | Cache browser | Tekan `Ctrl+Shift+R` untuk hard refresh |

---

## 📁 Struktur Proyek

```
hospital-dapp/
├── contracts/
│   └── HospitalRoom.sol          ← Smart Contract utama
├── scripts/
│   └── deploy.js                 ← Script deploy (jalankan setiap restart)
├── artifacts/                    ← ABI hasil kompilasi (otomatis)
├── hardhat.config.js             ← Konfigurasi Hardhat
├── package.json
└── frontend/
    ├── src/
    │   ├── abi/
    │   │   └── HospitalRoom.json ← ABI untuk frontend
    │   ├── components/
    │   │   ├── PublicDashboard.jsx
    │   │   └── AdminPanel.jsx
    │   ├── hooks/
    │   │   └── useHospitalRoom.js
    │   ├── config.js             ← ⚠️ Update CONTRACT_ADDRESS setelah deploy ulang
    │   ├── App.jsx
    │   └── index.css
    └── index.html
```
