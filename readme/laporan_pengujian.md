# Laporan Hasil Pengujian Smart Contract
## `HospitalRoom.sol` — Foundry Unit Testing

> **Proyek:** Decentralized Hospital Room Availability (Capstone)
> **Framework Pengujian:** Foundry v1.7.1 (Solidity)
> **Versi Solidity:** 0.8.20
> **Tanggal Pengujian:** 08 Juni 2026
> **Total Test:** 36 test cases (34 unit test + 2 fuzz test)
> **Hasil Keseluruhan:** ✅ **36 LULUS / 0 GAGAL / 0 DILEWATI**

---

## Ringkasan Eksekusi

| Kategori | Jumlah Test | Lulus | Gagal | Status |
|---|:---:|:---:|:---:|:---:|
| Pengujian Fungsional | 17 | 17 | 0 | ✅ PASS |
| Pengujian Boundary Value | 9 | 9 | 0 | ✅ PASS |
| Pengujian Exception Handling | 12 | 12 | 0 | ✅ PASS |
| Pengujian State Transition | 9 | 9 | 0 | ✅ PASS |
| Pengujian Keamanan | 10 | 10 | 0 | ✅ PASS |
| **TOTAL** | **36** | **36** | **0** | ✅ **ALL PASS** |

> ⚠️ Beberapa test masuk ke lebih dari satu kategori (overlap normal dalam pengujian smart contract).

---

## 1. Pengujian Fungsional

> Memverifikasi bahwa setiap fungsi kontrak berjalan sesuai spesifikasi bisnis yang diharapkan.

| No | ID Test | Fungsi yang Diuji | Skenario | Input | Output yang Diharapkan | Hasil | Gas |
|:--:|---|---|---|---|---|:--:|---:|
| 1 | `test_DeploymentSetsOwnerCorrectly` | Constructor | Deploy kontrak | Deployer = `owner` | `owner()` mengembalikan address deployer | ✅ PASS | 10,623 |
| 2 | `test_InitialHospitalListIsEmpty` | `totalHospitals()` `getAllHospitals()` | State awal kontrak | — | `totalHospitals() = 0`, array kosong | ✅ PASS | 14,456 |
| 3 | `test_AddHospital_SuccessfullyRegisters` | `addHospital()` | Daftarkan RS baru | `hospital1`, `"RS Umum Pusat Nasional"` | `isRegistered = true`, nama tersimpan, `totalRooms = 0` | ✅ PASS | 173,680 |
| 4 | `test_AddHospital_IncrementsTotalCount` | `addHospital()` `totalHospitals()` | Daftarkan 2 RS | 2 address berbeda | Counter bertambah: 0 → 1 → 2 | ✅ PASS | 307,500 |
| 5 | `test_AddHospital_AppearsInAllHospitalsList` | `addHospital()` `getAllHospitals()` | Daftarkan 2 RS | `hospital1`, `hospital2` | Keduanya muncul di array dengan urutan benar | ✅ PASS | 298,681 |
| 6 | `test_AddHospital_SetsLastUpdatedToCurrentBlock` | `addHospital()` | Timestamp saat registrasi | `hospital1`, nama valid | `lastUpdated` = `block.timestamp` saat pendaftaran | ✅ PASS | 170,351 |
| 7 | `test_RemoveHospital_SetsIsRegisteredToFalse` | `removeHospital()` | Cabut akses RS | `hospital1` (terdaftar) | `isRegistered` berubah menjadi `false` | ✅ PASS | 192,304 |
| 8 | `test_RemoveHospital_PreservesHistoricalData` | `removeHospital()` | Cabut akses, cek data historis | `hospital1` dengan 50/100 kamar | Nama, total & available kamar tetap tersimpan | ✅ PASS | 269,566 |
| 9 | `test_RemoveHospital_DoesNotRemoveFromList` | `removeHospital()` `totalHospitals()` | Cabut 1 dari 2 RS | `hospital1`, `hospital2` | `totalHospitals()` tetap 2 (data on-chain permanen) | ✅ PASS | 311,349 |
| 10 | `test_UpdateRoomStatus_UpdatesDataCorrectly` | `updateRoomStatus()` | Update kamar normal | available=75, total=100 | `totalRooms=100`, `availableRooms=75`, `isFull=false` | ✅ PASS | 243,080 |
| 11 | `test_UpdateRoomStatus_WhenFullAvailableIsZero` | `updateRoomStatus()` | Semua kamar terisi | available=0, total=50 | `availableRooms=0`, `isFull=true` | ✅ PASS | 222,693 |
| 12 | `test_UpdateRoomStatus_WhenAvailableEqualsTotal` | `updateRoomStatus()` | Semua kamar kosong | available=200, total=200 | `totalRooms=200`, `availableRooms=200` | ✅ PASS | 243,379 |
| 13 | `test_UpdateRoomStatus_UpdatesLastUpdatedTimestamp` | `updateRoomStatus()` | Verifikasi timestamp update | warp ke `1_700_000_000`, update kamar | `lastUpdated = 1_700_000_000` | ✅ PASS | 245,917 |
| 14 | `test_UpdateRoomStatus_CanUpdateMultipleTimes` | `updateRoomStatus()` | Update kamar berulang kali | 3x update: 100/200 → 50/150 → 0/100 | Nilai terakhir yang tersimpan = 0/100 | ✅ PASS | 312,387 |
| 15 | `test_GetRoomStatus_ReturnsDefaultForUnregisteredAddress` | `getRoomStatus()` | Baca status RS tidak terdaftar | Address acak | Semua nilai default (nama kosong, angka 0, `isRegistered=false`) | ✅ PASS | 21,396 |
| 16 | `test_EachHospitalHasIndependentData` | `updateRoomStatus()` `getRoomStatus()` | Isolasi data antar RS | hospital1: 30/100, hospital2: 80/200 | Data masing-masing RS tidak saling mempengaruhi | ✅ PASS | 463,965 |
| 17 | `test_HospitalCannotUpdateAnotherHospitalData` | `updateRoomStatus()` | RS coba ubah data RS lain | hospital2 update, cek data hospital1 | Data hospital1 tidak berubah | ✅ PASS | 445,583 |

**Hasil: 17/17 LULUS ✅**

---

## 2. Pengujian Boundary Value

> Memverifikasi perilaku kontrak pada nilai batas (nol, maksimum, sama, tepat satu di atas/bawah batas).

| No | ID Test | Nilai Batas yang Diuji | Kondisi | Input | Perilaku yang Diharapkan | Hasil | Gas |
|:--:|---|---|---|---|---|:--:|---:|
| 1 | `test_AddHospital_RevertsIfAddressIsZero` | `address(0)` | Address minimum (nol) | `_hospital = address(0)` | Revert: `"HospitalRoom: invalid address"` | ✅ PASS | 36,713 |
| 2 | `test_AddHospital_RevertsIfNameIsEmpty` | String kosong `""` | Panjang nama = 0 byte | `_name = ""` | Revert: `"HospitalRoom: name cannot be empty"` | ✅ PASS | 37,543 |
| 3 | `test_UpdateRoomStatus_WhenFullAvailableIsZero` | `available = 0` | Batas bawah available (minimum) | available=0, total=50 | Berhasil; `isFull = true` | ✅ PASS | 222,693 |
| 4 | `test_UpdateRoomStatus_WhenAvailableEqualsTotal` | `available = total` | Tepat di batas atas available | available=200, total=200 | Berhasil; semua kamar kosong | ✅ PASS | 243,379 |
| 5 | `test_UpdateRoomStatus_RevertsIfAvailableExceedsTotal` | `available > total` | Satu di atas batas atas | available=101, total=100 | Revert: `"HospitalRoom: available cannot exceed total"` | ✅ PASS | 182,182 |
| 6 | `test_UpdateRoomStatus_RevertsIfTotalRoomsIsZero` | `total = 0` | Batas bawah total kamar | available=0, total=0 | Revert: `"HospitalRoom: total rooms must be greater than 0"` | ✅ PASS | 181,788 |
| 7 | `testFuzz_UpdateRoomStatus_ValidInput` | Range [1–10.000] | Seluruh rentang input valid | available ∈ [0, total], total ∈ [1, 10.000] | Selalu berhasil untuk input valid (256 iterasi acak) | ✅ PASS | μ 243,145 |
| 8 | `testFuzz_UpdateRoomStatus_RevertsWhenAvailableExceedsTotal` | `available > total` | Semua input di atas batas | available ∈ [total+1, 10.000] | Selalu revert (256 iterasi acak) | ✅ PASS | μ 182,893 |
| 9 | `test_RemoveHospital_RevertsIfAlreadyRemoved` | `isRegistered = false` | Status batas setelah pencabutan | RS yang sudah dicabut aksesnya | Revert: `"HospitalRoom: hospital not registered"` | ✅ PASS | 206,890 |

**Hasil: 9/9 LULUS ✅**

---

## 3. Pengujian Exception Handling

> Memverifikasi bahwa kontrak me-revert transaksi dengan pesan error yang tepat pada setiap kondisi invalid.

| No | ID Test | Fungsi | Kondisi Pemicu Exception | Pesan Error yang Diharapkan | Jenis Revert | Hasil | Gas |
|:--:|---|---|---|---|---|:--:|---:|
| 1 | `test_AddHospital_RevertsIfCallerIsNotOwner` | `addHospital()` | Dipanggil oleh non-owner | `OwnableUnauthorizedAccount` (OpenZeppelin) | Custom Error | ✅ PASS | 38,399 |
| 2 | `test_AddHospital_RevertsIfAddressIsZero` | `addHospital()` | `_hospital = address(0)` | `"HospitalRoom: invalid address"` | require string | ✅ PASS | 36,713 |
| 3 | `test_AddHospital_RevertsIfNameIsEmpty` | `addHospital()` | `_name = ""` | `"HospitalRoom: name cannot be empty"` | require string | ✅ PASS | 37,543 |
| 4 | `test_AddHospital_RevertsIfAlreadyRegistered` | `addHospital()` | RS sudah terdaftar sebelumnya | `"HospitalRoom: hospital already registered"` | require string | ✅ PASS | 185,461 |
| 5 | `test_RemoveHospital_RevertsIfCallerIsNotOwner` | `removeHospital()` | Dipanggil oleh non-owner | `OwnableUnauthorizedAccount` (OpenZeppelin) | Custom Error | ✅ PASS | 183,559 |
| 6 | `test_RemoveHospital_RevertsIfHospitalNotRegistered` | `removeHospital()` | RS belum pernah terdaftar | `"HospitalRoom: hospital not registered"` | require string | ✅ PASS | 40,017 |
| 7 | `test_RemoveHospital_RevertsIfAlreadyRemoved` | `removeHospital()` | RS sudah dicabut sebelumnya | `"HospitalRoom: hospital not registered"` | require string | ✅ PASS | 206,890 |
| 8 | `test_UpdateRoomStatus_RevertsIfCallerNotRegistered` | `updateRoomStatus()` | Caller belum terdaftar sebagai RS | `"HospitalRoom: caller is not a registered hospital"` | require string | ✅ PASS | 35,113 |
| 9 | `test_UpdateRoomStatus_RevertsIfCallerWasRemoved` | `updateRoomStatus()` | Caller sudah dicabut aksesnya | `"HospitalRoom: caller is not a registered hospital"` | require string | ✅ PASS | 204,350 |
| 10 | `test_UpdateRoomStatus_RevertsIfAvailableExceedsTotal` | `updateRoomStatus()` | `available > total` | `"HospitalRoom: available cannot exceed total"` | require string | ✅ PASS | 182,182 |
| 11 | `test_UpdateRoomStatus_RevertsIfTotalRoomsIsZero` | `updateRoomStatus()` | `total = 0` | `"HospitalRoom: total rooms must be greater than 0"` | require string | ✅ PASS | 181,788 |
| 12 | `test_UpdateRoomStatus_RevertsIfOwnerTriesToUpdate` | `updateRoomStatus()` | Owner bukan RS terdaftar | `"HospitalRoom: caller is not a registered hospital"` | require string | ✅ PASS | 35,135 |

**Hasil: 12/12 LULUS ✅**

---

## 4. Pengujian State Transition

> Memverifikasi bahwa kontrak berpindah dari satu state ke state lain dengan benar, dan state tidak dapat dimanipulasi secara tidak sah.

```
Diagram State Transition HospitalRoom:

  [DEPLOY] ──addHospital()──► [REGISTERED]
     │         [onlyOwner]         │
     │                             ├──updateRoomStatus()──► [DATA UPDATED]
     │                             │   [onlyRegistered]     (dapat berulang)
     │                             │
     │                             └──removeHospital()──► [REMOVED]
     │                                 [onlyOwner]         isRegistered=false
     │                                                     data historis tetap
     └──transferOwnership()──► [OWNER BARU]
           [onlyOwner]          hak akses berpindah
```

| No | ID Test | State Awal | Aksi / Transaksi | State Akhir yang Diharapkan | Verifikasi | Hasil | Gas |
|:--:|---|---|---|---|---|:--:|---:|
| 1 | `test_DeploymentSetsOwnerCorrectly` | Belum ada kontrak | Deploy kontrak | `owner = deployer` | `owner()` == deployer address | ✅ PASS | 10,623 |
| 2 | `test_InitialHospitalListIsEmpty` | Kontrak baru | Deploy kontrak | `hospitalList = []`, `totalHospitals = 0` | Semua counter = 0 | ✅ PASS | 14,456 |
| 3 | `test_AddHospital_SuccessfullyRegisters` | RS tidak terdaftar | `addHospital(hospital1, nama)` | `isRegistered = true`, `totalRooms = 0` | Semua field sesuai ekspektasi | ✅ PASS | 173,680 |
| 4 | `test_RemoveHospital_SetsIsRegisteredToFalse` | RS terdaftar (`isRegistered=true`) | `removeHospital(hospital1)` | `isRegistered = false` | Field berubah ke false | ✅ PASS | 192,304 |
| 5 | `test_RemoveHospital_PreservesHistoricalData` | RS terdaftar, 50/100 kamar | `removeHospital(hospital1)` | `isRegistered=false`, data kamar tetap ada | Nama, total, available tidak berubah | ✅ PASS | 269,566 |
| 6 | `test_UpdateRoomStatus_UpdatesDataCorrectly` | RS terdaftar, 0/0 kamar | `updateRoomStatus(75, 100)` | `totalRooms=100`, `availableRooms=75` | Data kamar ter-update dengan benar | ✅ PASS | 243,080 |
| 7 | `test_UpdateRoomStatus_CanUpdateMultipleTimes` | RS terdaftar | 3x `updateRoomStatus()` berturut | Nilai terakhir: `0/100`, `isFull=true` | Setiap update menimpa yang sebelumnya | ✅ PASS | 312,387 |
| 8 | `test_OwnerCanTransferOwnership` | `owner = A` | `transferOwnership(B)` | `owner = B`, B dapat `addHospital()` | B berhasil mendaftarkan RS | ✅ PASS | 201,209 |
| 9 | `test_PreviousOwnerCannotAddHospitalAfterTransfer` | `owner = A` → transfer ke B | A memanggil `addHospital()` | Revert — A bukan owner lagi | Transaksi A di-revert oleh modifier | ✅ PASS | 70,057 |

**Hasil: 9/9 LULUS ✅**

---

## 5. Pengujian Keamanan

> Memverifikasi mekanisme access control, perlindungan dari serangan Sybil, isolasi data, dan ketahanan model keamanan secara keseluruhan.

| No | ID Test | Vektor Serangan / Risiko | Skenario Serangan | Perlindungan yang Diuji | Hasil | Gas |
|:--:|---|---|---|---|:--:|---:|
| 1 | `test_AddHospital_RevertsIfCallerIsNotOwner` | **Privilege Escalation** | Non-owner mencoba daftarkan RS | `onlyOwner` modifier (OpenZeppelin Ownable) | ✅ PASS | 38,399 |
| 2 | `test_RemoveHospital_RevertsIfCallerIsNotOwner` | **Privilege Escalation** | Non-owner mencoba cabut akses RS | `onlyOwner` modifier | ✅ PASS | 183,559 |
| 3 | `test_UpdateRoomStatus_RevertsIfCallerNotRegistered` | **Unauthorized Write** | Wallet sembarang mencoba tulis data | `onlyRegisteredHospital` modifier | ✅ PASS | 35,113 |
| 4 | `test_UpdateRoomStatus_RevertsIfCallerWasRemoved` | **Revoked Access Bypass** | RS yang dicabut mencoba update data | `isRegistered=false` → modifier revert | ✅ PASS | 204,350 |
| 5 | `test_UpdateRoomStatus_RevertsIfOwnerTriesToUpdate` | **Role Confusion** | Owner (bukan RS) mencoba update data | Role separation: owner ≠ registered hospital | ✅ PASS | 35,135 |
| 6 | `test_HospitalCannotUpdateAnotherHospitalData` | **Data Spoofing** | RS A mencoba ubah data RS B | `msg.sender` sebagai mapping key, tidak bisa dipalsukan | ✅ PASS | 445,583 |
| 7 | `test_EachHospitalHasIndependentData` | **Cross-Contamination** | Update RS A tidak boleh mempengaruhi RS B | Isolasi data per-address di mapping | ✅ PASS | 463,965 |
| 8 | `test_AddHospital_RevertsIfAlreadyRegistered` | **Sybil Attack / Duplikasi** | Daftarkan address yang sudah terdaftar | `require(!isRegistered)` mencegah duplikasi | ✅ PASS | 185,461 |
| 9 | `test_OwnerCanTransferOwnership` | **Ownership Management** | Transfer kepemilikan ke wallet baru | `transferOwnership()` berfungsi dengan benar | ✅ PASS | 201,209 |
| 10 | `test_PreviousOwnerCannotAddHospitalAfterTransfer` | **Stale Privileges** | Owner lama masih gunakan hak akses | Hak akses langsung dicabut setelah transfer | ✅ PASS | 70,057 |

**Hasil: 10/10 LULUS ✅**

---

## Laporan Gas Usage (Berdasarkan 36 Test Cases)

> Data konsumsi gas per fungsi kontrak diambil dari gas report Foundry.

| Fungsi | Min Gas | Rata-rata | Median | Maks Gas | Jumlah Dipanggil |
|---|---:|---:|---:|---:|:---:|
| `addHospital()` | 24,441 | 141,726 | 142,958 | 142,958 | 548 |
| `updateRoomStatus()` | 23,817 | 47,667 | 52,286 | 74,998 | 532 |
| `getRoomStatus()` | 11,717 | 11,799 | 11,800 | 11,800 | 271 |
| `removeHospital()` | 23,998 | 25,565 | 25,588 | 26,282 | 9 |
| `transferOwnership()` | 28,557 | 28,557 | 28,557 | 28,557 | 2 |
| `getAllHospitals()` | 2,602 | 4,906 | 4,906 | 7,210 | 2 |
| `totalHospitals()` | 2,251 | 2,251 | 2,251 | 2,251 | 5 |
| `owner()` | 2,416 | 2,416 | 2,416 | 2,416 | 1 |
| **Deployment Cost** | — | **705,805** | — | — | — |

---

## Kesimpulan Akhir

| Aspek Pengujian | Nilai |
|---|---|
| Total Test Case | **36** |
| Test Lulus | **36 (100%)** |
| Test Gagal | **0 (0%)** |
| Fuzz Test Runs | 256 iterasi × 2 fungsi = **512 runs** |
| Durasi Pengujian | **55.65ms** (CPU: 132.12ms) |
| Kondisi Revert yang Ditangkap | **12 kondisi** |
| Fungsi Publik yang Diuji | **7 fungsi** |
| Access Control | ✅ Terlindungi (`onlyOwner` + `onlyRegisteredHospital`) |
| Anti-Sybil Attack | ✅ Tidak ada self-register |
| Isolasi Data | ✅ Per-address mapping |
| Event Audit Trail | ✅ 3 event terpancar dan terverifikasi |
| Ownership Transfer | ✅ Berfungsi dan mencabut hak lama |
