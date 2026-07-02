# 🏥 Capstone Project: DApp Ketersediaan Kamar Rumah Sakit Terdesentralisasi
**Solidity ^0.8.20 | Hardhat | Ethers.js v6 | React + Tailwind CSS**

---

## 📐 Arsitektur Sistem

```mermaid
flowchart TD
    A["Admin Pusat / Deployer Contract"]
    B["Staf Rumah Sakit - Wallet Terdaftar"]
    C["Status Kamar RS - Data On-Chain"]
    D["Masyarakat / Pasien - Publik"]

    A -->|"addHospital - Mendaftarkan wallet ke whitelist"| B
    B -->|"updateRoomStatus - Memperbarui data on-chain"| C
    D -->|"getRoomStatus - Membaca data, read-only, gratis"| C
    C -->|"Menampilkan: Tersedia atau Penuh, jumlah dan nama RS"| D
```

---

## 🔑 Komponen Teknis Utama

| Fitur | Implementasi | File |
|-------|-------------|------|
| Integritas Data | `struct RoomInfo` + `mapping(address => RoomInfo)` | HospitalRoom.sol |
| Kontrol Akses | `Ownable` (owner) + modifier `onlyRegisteredHospital` | HospitalRoom.sol |
| Pencegahan Sybil Attack | Tidak ada self-register — hanya `addHospital()` oleh owner | HospitalRoom.sol |
| Pembaruan Trustless | `updateRoomStatus()` langsung menulis on-chain tanpa perantara | HospitalRoom.sol |
| Transparansi Publik | Fungsi `view` terbuka — tidak memerlukan wallet atau gas | HospitalRoom.sol |
| Audit Trail | Setiap aksi penting memancarkan `event` on-chain | HospitalRoom.sol |

---

## 🧠 Penjelasan Alur Logika Fungsi Utama

### 1. `addHospital(address, name)` — Khusus Owner (Admin Pusat)
> Satu-satunya cara untuk mendaftarkan wallet rumah sakit. Tidak ada self-registration. Mencegah Sybil Attack secara struktural.

```
Admin Pusat memanggil addHospital(0xStafRS, "RS Maju Sehat")
    → Modifier onlyOwner: require(msg.sender == owner) ✓
    → Validasi: address tidak nol, nama tidak kosong, belum terdaftar
    → hospitalData[0xStafRS] = RoomInfo{ name, totalRooms: 0, availableRooms: 0, isRegistered: true }
    → hospitalList.push(0xStafRS)
    → emit HospitalAdded(0xStafRS, "RS Maju Sehat")
```

### 2. `removeHospital(address)` — Khusus Owner (Admin Pusat)
> Mencabut akses wallet rumah sakit. Data historis tetap tersimpan on-chain untuk transparansi — hanya flag `isRegistered` yang diubah.

```
Admin Pusat memanggil removeHospital(0xStafRS)
    → Modifier onlyOwner ✓
    → Validasi: hospitalData[0xStafRS].isRegistered == true ✓
    → hospitalData[0xStafRS].isRegistered = false   ← Akses dicabut
    → emit HospitalRemoved(0xStafRS)                ← Audit trail tetap ada
```

### 3. `updateRoomStatus(available, total)` — Trustless Automation ⚡
> Staf RS yang wallet-nya sudah di-whitelist memperbarui data kamar secara langsung on-chain. Tidak ada perantara, tidak bisa dimanipulasi.

```
Staf RS (0xStafRS) memanggil updateRoomStatus(15, 30)
    → Modifier onlyRegisteredHospital: hospitalData[msg.sender].isRegistered == true ✓
    → Validasi: 15 <= 30 ✓ dan 30 > 0 ✓
    → info.availableRooms = 15
    → info.totalRooms     = 30
    → info.lastUpdated    = block.timestamp          ← Dicatat otomatis
    → emit RoomStatusUpdated(0xStafRS, 15, 30, timestamp)
```

### 4. `getRoomStatus(address)` — Publik, Tanpa Gas untuk Pemanggil
> Siapa pun — termasuk pasien tanpa wallet — dapat membaca data secara real-time langsung dari blockchain.

```
Pasien memanggil getRoomStatus(0xStafRS)
    → Fungsi view, tidak ada transaksi, tidak ada gas
    → Mengembalikan: (name, totalRooms, availableRooms, isRegistered, lastUpdated, isFull)
    → isFull = (availableRooms == 0)   ← Dihitung otomatis on-chain
    → Contoh: ("RS Maju Sehat", 30, 15, true, 1712900000, false)
```

### 5. `getAllHospitals()` + `totalHospitals()` — Publik
> Digunakan oleh frontend dashboard untuk menampilkan semua RS terdaftar secara dinamis.

```
getAllHospitals()   → address[] semua wallet RS yang pernah terdaftar
totalHospitals()   → uint256 jumlah total RS dalam sistem
```

---

## 🚀 Langkah Menjalankan Proyek (Hardhat Local Node)

### Step 1 — Kompilasi Smart Contract
```bash
cd C:\Users\Windows\sct\hospital-dapp
npx hardhat compile
```
✅ Hasil yang diharapkan: `Compiled 1 Solidity file successfully`

### Step 2 — Jalankan Local Blockchain Node
```bash
# Biarkan terminal ini tetap terbuka sepanjang sesi pengembangan
npx hardhat node
```
✅ Akan menampilkan 20 akun uji coba beserta private key-nya.

### Step 3 — Deploy Smart Contract
```bash
# Buka terminal baru
npx hardhat run scripts/deploy.js --network localhost
```
✅ Hasil yang diharapkan:
```
HospitalRoom deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Test hospital registered: 0x70997970C51812dc3A010C7d01b50e0d17dc7944
```

### Step 4 — Salin Contract Address ke Frontend
Salin nilai `CONTRACT_ADDRESS` yang tercetak ke file konfigurasi frontend.

### Step 5 — Urutan Pengujian Fungsional

```
Gunakan Hardhat Console: npx hardhat console --network localhost

1. [Owner]      addHospital(0xAccount1, "RS Maju Sehat")
2. [Staf RS]    updateRoomStatus(15, 30)         ← availableRooms=15, totalRooms=30
3. [Publik]     getRoomStatus(0xAccount1)        ← Tampilkan status: Tersedia (15/30)
4. [Staf RS]    updateRoomStatus(0, 30)          ← Semua kamar terisi
5. [Publik]     getRoomStatus(0xAccount1)        ← Tampilkan status: Penuh (0/30)
6. [Penyerang]  updateRoomStatus(5, 10)          ← REVERT: bukan RS terdaftar ❌
7. [Penyerang]  addHospital(0xFake, "RS Palsu")  ← REVERT: bukan owner ❌
```

> [!TIP]
> Gunakan Account[0] sebagai Owner (Admin Pusat), Account[1] sebagai Staf RS terdaftar, dan Account[2] sebagai Penyerang untuk mensimulasikan skenario Sybil Attack yang diblokir.

---

## 🛡️ Security Checklist

- [x] **Anti-Sybil Attack** — Tidak ada self-register; hanya owner yang bisa whitelist wallet RS
- [x] **Ownable Pattern** — Owner (deployer) terpisah jelas dari entitas operasional
- [x] **Kontrol Akses Berlapis** — `onlyOwner` untuk manajemen RS, `onlyRegisteredHospital` untuk update data
- [x] **Validasi Input** — Semua fungsi dilindungi oleh `require` guard yang spesifik
- [x] **Data Imutabel** — Data historis tetap on-chain meskipun akses RS dicabut
- [x] **Reentrancy Safe** — Tidak ada transfer ETH atau callback eksternal
- [x] **Audit Trail Lengkap** — Semua aksi kritis (tambah RS, cabut RS, update kamar) dipancarkan sebagai `event`

---

- [HospitalRoom.sol](../contracts/HospitalRoom.sol)
- [deploy.js](../scripts/deploy.js)
- [hardhat.config.js](../hardhat.config.js)

---

## 🗺️ Dokumentasi Arsitektur Sistem

### Diagram Alir: Input → Proses → Output

```mermaid
flowchart TD

    %% ─── ADMIN PUSAT ───────────────────────────────────────────
    subgraph ADMIN["👤 ADMIN PUSAT (Owner / Deployer)"]
        A1([MULAI])
        A2[/"MASUKAN: address wallet RS, nama RS"/]
        A3{"caller == owner?"}
        A4["Validasi: address != 0x0, nama != kosong"]
        A5{"Sudah terdaftar?"}
        A6["hospitalData[addr] = RoomInfo tersimpan"]
        A7["hospitalList.push, totalHospitals++"]
        A8[/"KELUARAN: emit HospitalAdded, isRegistered = true"/]
        A9([SELESAI])
        AR1["REVERT: Bukan Owner"]
        AR2["REVERT: Sudah Ada"]

        A1 --> A2 --> A3
        A3 -->|"Tidak"| AR1
        A3 -->|"Ya"| A4 --> A5
        A5 -->|"Ya"| AR2
        A5 -->|"Tidak"| A6 --> A7 --> A8 --> A9
    end

    %% ─── STAF RUMAH SAKIT ──────────────────────────────────────
    subgraph STAF["🏥 STAF RUMAH SAKIT (Wallet Terdaftar)"]
        B1([MULAI])
        B2[/"MASUKAN: kamar tersedia, total kapasitas"/]
        B3{"isRegistered[msg.sender]?"}
        B4["Validasi: total > 0"]
        B5{"available <= total?"}
        B6["Update on-chain: availableRooms, totalRooms"]
        B7["lastUpdated = block.timestamp"]
        B8[/"KELUARAN: emit RoomStatusUpdated"/]
        B9([SELESAI])
        BR1["REVERT: Bukan RS Terdaftar"]
        BR2["REVERT: Melebihi Kapasitas"]

        B1 --> B2 --> B3
        B3 -->|"Tidak"| BR1
        B3 -->|"Ya"| B4 --> B5
        B5 -->|"Tidak"| BR2
        B5 -->|"Ya"| B6 --> B7 --> B8 --> B9
    end

    %% ─── PASIEN / MASYARAKAT ───────────────────────────────────
    subgraph PUBLIK["👥 PASIEN / MASYARAKAT (Publik — Tanpa Wallet)"]
        C1([MULAI])
        C2[/"MASUKAN: address RS yang ingin dicek"/]
        C3["getRoomStatus: view function, tanpa gas, tanpa transaksi"]
        C4["Baca RoomInfo dari mapping on-chain"]
        C5["Hitung: isFull = available == 0"]
        C6[/"KELUARAN: nama, totalRooms, availableRooms, isFull"/]
        C7["Tampilkan badge: TERSEDIA atau PENUH"]
        C8([SELESAI])

        C1 --> C2 --> C3 --> C4 --> C5 --> C6 --> C7 --> C8
    end

    style AR1 fill:#b91c1c,color:#fff,stroke:#7f1d1d
    style AR2 fill:#b91c1c,color:#fff,stroke:#7f1d1d
    style BR1 fill:#b91c1c,color:#fff,stroke:#7f1d1d
    style BR2 fill:#b91c1c,color:#fff,stroke:#7f1d1d
    style A1 fill:#1e293b,color:#fff,stroke:#475569
    style A9 fill:#1e293b,color:#fff,stroke:#475569
    style B1 fill:#1e293b,color:#fff,stroke:#475569
    style B9 fill:#1e293b,color:#fff,stroke:#475569
    style C1 fill:#1e293b,color:#fff,stroke:#475569
    style C8 fill:#1e293b,color:#fff,stroke:#475569
```

---

### Tabel Cara Kerja Program — Berdasarkan Peran

#### 👥 Peran: PUBLIK (Pasien / Masyarakat)

| Langkah | Aktor | Aksi | Layer | Fungsi Kontrak | Output |
|--------:|-------|------|-------|---------------|--------|
| 1 | Pasien | Membuka `localhost:5173` di browser | Frontend | — | Halaman Dashboard Publik tampil |
| 2 | Pasien | Melihat daftar RS terdaftar secara otomatis | Frontend → SC | `getAllHospitals()` | Tombol address RS muncul |
| 3 | Pasien | Klik tombol address RS **atau** ketik address manual | Frontend | — | Input address terisi |
| 4 | Pasien | Klik tombol **🔍 Cari** | Frontend | — | Request dikirim ke blockchain |
| 5 | — | Frontend memanggil kontrak (read-only, tanpa wallet) | Ethers.js → SC | `getRoomStatus(address)` | Data kamar dikembalikan |
| 6 | — | Smart contract membaca `RoomInfo` dari `mapping` | Blockchain | — | Return: nama, tersedia, total, isFull |
| 7 | Pasien | Melihat kartu status kamar | Frontend | — | Badge **🟢 TERSEDIA** atau **🔴 PENUH** |
| 8 | — | Dashboard auto-refresh setiap 15 detik | Frontend | `getRoomStatus()` | Data selalu terkini tanpa reload manual |

> **Biaya:** Rp 0 / $0 — fungsi `view` tidak memerlukan gas. Tidak perlu wallet, tidak perlu akun.

---

#### 🔑 Peran: ADMIN PUSAT (Owner / Deployer Contract)

| Langkah | Aktor | Aksi | Layer | Fungsi Kontrak | Output |
|--------:|-------|------|-------|---------------|--------|
| 1 | Admin Pusat | Buka Hardhat Console atau Panel Admin | Terminal / Frontend | — | Koneksi ke node lokal |
| 2 | Admin Pusat | Siapkan address wallet RS yang akan didaftarkan | — | — | Address: `0xWalletRS` |
| 3 | Admin Pusat | Panggil `addHospital(address, name)` | Hardhat Console / SC | `addHospital()` | Transaksi dikirim ke blockchain |
| 4 | — | Modifier `onlyOwner` memverifikasi caller | Smart Contract | `require(msg.sender == owner)` | Lulus ✅ atau Revert ❌ |
| 5 | — | Data RS disimpan ke `mapping(address => RoomInfo)` | Blockchain | — | `isRegistered = true` |
| 6 | — | Event `HospitalAdded` dipancarkan | Blockchain | `emit HospitalAdded(address, name)` | Audit trail on-chain |
| 7 | Admin Pusat | Untuk cabut akses: panggil `removeHospital(address)` | SC | `removeHospital()` | `isRegistered = false`, data historis tetap ada |

> **Catatan keamanan:** Tidak ada self-register. Hanya wallet yang sama persis dengan deployer contract (Account[0] Hardhat) yang dapat menjalankan langkah ini.

---

#### 🏥 Peran: STAF RUMAH SAKIT (Wallet Terdaftar)

| Langkah | Aktor | Aksi | Layer | Fungsi Kontrak | Output |
|--------:|-------|------|-------|---------------|--------|
| 1 | Staf RS | Buka `localhost:5173` → klik tab **⚙️ Panel Admin** | Frontend | — | Halaman Panel Admin tampil |
| 2 | Staf RS | Klik **🔗 Hubungkan MetaMask** | Frontend → MetaMask | `eth_requestAccounts` | Popup MetaMask muncul |
| 3 | Staf RS | Pilih akun wallet yang sudah di-whitelist → konfirmasi | MetaMask | — | `connectedAddress` tersimpan di state |
| 4 | — | Frontend otomatis cek status wallet via BrowserProvider | Ethers.js → SC | `getRoomStatus(address)` | `isRegistered` dicek |
| 5a | — | Jika `isRegistered = true` | Frontend | — | ✅ Formulir update kamar muncul |
| 5b | — | Jika `isRegistered = false` | Frontend | — | ❌ Pesan "Akses Ditolak" muncul |
| 6 | Staf RS | Isi formulir: **Kamar Tersedia** + **Total Kapasitas** | Frontend | — | Validasi: tersedia ≤ total |
| 7 | Staf RS | Klik **📡 Broadcast ke Blockchain** | Frontend → MetaMask | — | Popup konfirmasi MetaMask |
| 8 | Staf RS | Konfirmasi transaksi di MetaMask | MetaMask | — | Transaksi ditandatangani & dikirim |
| 9 | — | Modifier `onlyRegisteredHospital` diverifikasi on-chain | Smart Contract | `require(isRegistered[msg.sender])` | Lulus ✅ atau Revert ❌ |
| 10 | — | Data `availableRooms`, `totalRooms`, `lastUpdated` diperbarui | Blockchain | — | State on-chain berubah |
| 11 | — | Event `RoomStatusUpdated` dipancarkan | Blockchain | `emit RoomStatusUpdated(...)` | Audit trail permanen |
| 12 | Staf RS | Panel Admin menampilkan tx hash konfirmasi | Frontend | — | ✅ "Status berhasil diperbarui!" |
| 13 | Pasien | Dashboard Publik menampilkan data terbaru | Frontend → SC | `getRoomStatus()` | Badge status kamar diperbarui |

---

## 🔷 Diagram Use Case dan Cara Kerja

### Use Case Diagram — Interaksi Aktor dengan DApp

```mermaid
flowchart LR
    %% AKTOR
    AP(["Admin Pusat - Owner / Deployer"])
    SR(["Staf RS - Wallet Terdaftar"])
    PS(["Pasien - Publik / Tanpa Wallet"])

    %% USE CASE NODE
    UC1["Mendaftarkan RS - addHospital"]
    UC2["Mencabut Akses RS - removeHospital"]
    UC3["Melihat Semua RS - getAllHospitals"]
    UC4["Update Status Kamar - updateRoomStatus"]
    UC5["Melihat Ketersediaan - getRoomStatus"]
    UC6["Melihat Total RS - totalHospitals"]

    %% RELASI ADMIN PUSAT
    AP -->|"Hanya owner - onlyOwner modifier"| UC1
    AP -->|"Cabut whitelist - onlyOwner modifier"| UC2
    AP -->|"Pantau sistem - view function"| UC3

    %% RELASI STAF RS
    SR -->|"Wallet wajib terdaftar - onlyRegisteredHospital"| UC4
    SR -->|"Cek status RS sendiri - view function"| UC5

    %% RELASI PASIEN
    PS -->|"Tanpa wallet, tanpa gas - gratis"| UC5
    PS -->|"Pantau jumlah RS - view function"| UC6

    %% STYLING AKTOR
    style AP fill:#fde68a,stroke:#f59e0b,color:#000
    style SR fill:#bfdbfe,stroke:#3b82f6,color:#000
    style PS fill:#bbf7d0,stroke:#22c55e,color:#000

    %% STYLING USE CASE
    style UC1 fill:#6366f1,stroke:#4338ca,color:#fff
    style UC2 fill:#ef4444,stroke:#b91c1c,color:#fff
    style UC3 fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style UC4 fill:#0d9488,stroke:#0f766e,color:#fff
    style UC5 fill:#10b981,stroke:#059669,color:#fff
    style UC6 fill:#64748b,stroke:#475569,color:#fff
```

---

### Tabel Cara Kerja Sistem

| Aktor | Aksi / Fitur | Eksekusi Smart Contract | Output Visual |
|-------|-------------|------------------------|---------------|
| **Admin Pusat** | Mendaftarkan RS baru dengan alamat wallet & nama RS | `addHospital(address wallet, string name)` — dilindungi modifier `onlyOwner`; data disimpan ke `mapping(address => RoomInfo)` dan `hospitalList[]` | Event `HospitalAdded` terpancar; wallet RS masuk whitelist; RS baru muncul di daftar dashboard |
| **Admin Pusat** | Mencabut akses RS yang sudah tidak aktif | `removeHospital(address wallet)` — modifier `onlyOwner`; hanya mengubah flag `isRegistered = false`, data historis tetap on-chain | Event `HospitalRemoved` terpancar; RS tidak lagi bisa update kamar; data lama tetap transparan |
| **Admin Pusat** | Memantau seluruh RS yang terdaftar dalam sistem | `getAllHospitals()` — fungsi `view`, gratis, mengembalikan array seluruh address RS | Tabel/daftar semua wallet RS ditampilkan di panel admin |
| **Staf RS** | Memperbarui jumlah kamar tersedia dan total kapasitas | `updateRoomStatus(uint available, uint total)` — modifier `onlyRegisteredHospital`; menulis `availableRooms`, `totalRooms`, `lastUpdated` ke blockchain | Event `RoomStatusUpdated` terpancar; MetaMask konfirmasi tx; dashboard publik refresh otomatis |
| **Staf RS** | Mengecek status kamar RS miliknya sendiri sebelum update | `getRoomStatus(address)` — fungsi `view`, tanpa gas; mengembalikan `(name, totalRooms, availableRooms, isRegistered, lastUpdated, isFull)` | Kartu status RS dengan badge **🟢 TERSEDIA** atau **🔴 PENUH** beserta angka kapasitas |
| **Pasien** | Melihat ketersediaan kamar RS tertentu secara real-time | `getRoomStatus(address)` — fungsi `view`; tidak memerlukan wallet atau gas; data dibaca langsung dari blockchain | Badge **🟢 TERSEDIA (X/Y kamar)** atau **🔴 PENUH (0/Y kamar)** beserta timestamp pembaruan terakhir |
| **Pasien** | Memantau total rumah sakit yang bergabung dalam sistem | `totalHospitals()` — fungsi `view`, gratis; mengembalikan `uint256` jumlah RS | Angka total RS ditampilkan di header dashboard publik |
