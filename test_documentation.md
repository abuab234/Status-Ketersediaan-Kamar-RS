# Unit Test HospitalRoom.sol — Foundry

Dokumentasi lengkap unit test untuk smart contract **HospitalRoom** menggunakan **Foundry** (test ditulis dalam Solidity).

---

## Struktur File

```
hospital-dapp/
├── contracts/
│   └── HospitalRoom.sol        ← Smart contract utama
├── test/
│   └── HospitalRoom.t.sol      ← Unit test Foundry (Solidity)
├── lib/
│   └── forge-std/              ← Foundry standard library (auto-diinstall)
├── foundry.toml                ← Konfigurasi Foundry
└── package.json                ← Scripts npm diupdate
```

---

## Cara Menjalankan Test

### Prasyarat: Install Foundry

**Pertama kali saja**, jalankan perintah berikut untuk install `forge-std`:

```powershell
# Pastikan PATH ke Foundry sudah ditambahkan terlebih dahulu
$env:Path += ";$env:USERPROFILE\.foundry\bin"

# Install forge-std (library testing)
forge install foundry-rs/forge-std --no-commit
```

### Menjalankan Semua Test

```powershell
$env:Path += ";$env:USERPROFILE\.foundry\bin"
forge test --via-ir -vv
```

### Opsi Lain

| Perintah | Keterangan |
|---|---|
| `forge test -vv` | Tampilkan log test (verbosity level 2) |
| `forge test -vvvv` | Tampilkan trace lengkap untuk debug |
| `forge test --gas-report` | Tampilkan laporan gas tiap fungsi |
| `forge test --fuzz-runs 1000` | Jalankan fuzz test dengan 1000 iterasi |
| `forge test --match-test test_AddHospital` | Jalankan hanya test tertentu |
| `forge test --match-contract HospitalRoomTest` | Jalankan seluruh test di satu file |

---

## Cakupan Test (Test Coverage)

### 1. Deployment & Ownership

| Test | Deskripsi |
|---|---|
| `test_DeploymentSetsOwnerCorrectly` | Deployer otomatis menjadi owner |
| `test_InitialHospitalListIsEmpty` | Daftar RS kosong saat pertama deploy |

### 2. `addHospital()` — Fungsi Pendaftaran RS

| Test | Deskripsi |
|---|---|
| `test_AddHospital_SuccessfullyRegisters` | RS berhasil terdaftar dengan data benar |
| `test_AddHospital_IncrementsTotalCount` | Counter totalHospitals bertambah |
| `test_AddHospital_AppearsInAllHospitalsList` | RS muncul di getAllHospitals() |
| `test_AddHospital_SetsLastUpdatedToCurrentBlock` | lastUpdated diset ke block.timestamp |
| `test_AddHospital_EmitsHospitalAddedEvent` | Event HospitalAdded terpancar |
| `test_AddHospital_RevertsIfCallerIsNotOwner` | ❌ Non-owner tidak bisa daftarkan RS |
| `test_AddHospital_RevertsIfAddressIsZero` | ❌ Reject address(0) |
| `test_AddHospital_RevertsIfNameIsEmpty` | ❌ Reject nama kosong |
| `test_AddHospital_RevertsIfAlreadyRegistered` | ❌ Reject duplikat registrasi |

### 3. `removeHospital()` — Pencabutan Akses RS

| Test | Deskripsi |
|---|---|
| `test_RemoveHospital_SetsIsRegisteredToFalse` | isRegistered menjadi false |
| `test_RemoveHospital_PreservesHistoricalData` | Data historis tetap tersimpan |
| `test_RemoveHospital_DoesNotRemoveFromList` | hospitalList tidak berubah |
| `test_RemoveHospital_EmitsHospitalRemovedEvent` | Event HospitalRemoved terpancar |
| `test_RemoveHospital_RevertsIfCallerIsNotOwner` | ❌ Non-owner tidak bisa hapus |
| `test_RemoveHospital_RevertsIfHospitalNotRegistered` | ❌ Reject RS yang tidak ada |
| `test_RemoveHospital_RevertsIfAlreadyRemoved` | ❌ Reject hapus dua kali |

### 4. `updateRoomStatus()` — Update Status Kamar

| Test | Deskripsi |
|---|---|
| `test_UpdateRoomStatus_UpdatesDataCorrectly` | Data kamar tersimpan dengan benar |
| `test_UpdateRoomStatus_WhenFullAvailableIsZero` | isFull = true saat available = 0 |
| `test_UpdateRoomStatus_WhenAvailableEqualsTotal` | available = total (semua kosong) |
| `test_UpdateRoomStatus_UpdatesLastUpdatedTimestamp` | Timestamp diperbarui |
| `test_UpdateRoomStatus_CanUpdateMultipleTimes` | RS bisa update berkali-kali |
| `test_UpdateRoomStatus_EmitsRoomStatusUpdatedEvent` | Event RoomStatusUpdated terpancar |
| `test_UpdateRoomStatus_RevertsIfCallerNotRegistered` | ❌ Non-RS tidak bisa update |
| `test_UpdateRoomStatus_RevertsIfCallerWasRemoved` | ❌ RS yang dicabut tidak bisa update |
| `test_UpdateRoomStatus_RevertsIfAvailableExceedsTotal` | ❌ available > total ditolak |
| `test_UpdateRoomStatus_RevertsIfTotalRoomsIsZero` | ❌ total = 0 ditolak |
| `test_UpdateRoomStatus_RevertsIfOwnerTriesToUpdate` | ❌ Owner tidak terdaftar sebagai RS |

### 5. Isolasi Data Antar RS

| Test | Deskripsi |
|---|---|
| `test_EachHospitalHasIndependentData` | Data tiap RS independen satu sama lain |
| `test_HospitalCannotUpdateAnotherHospitalData` | RS tidak bisa ubah data RS lain |

### 6. View Functions

| Test | Deskripsi |
|---|---|
| `test_GetRoomStatus_ReturnsDefaultForUnregisteredAddress` | Return default untuk address tidak terdaftar |

### 7. Fuzz Testing 🎲

| Test | Deskripsi |
|---|---|
| `testFuzz_UpdateRoomStatus_ValidInput` | Selalu berhasil untuk input valid (256 run) |
| `testFuzz_UpdateRoomStatus_RevertsWhenAvailableExceedsTotal` | Selalu revert jika available > total |

### 8. Ownership Transfer

| Test | Deskripsi |
|---|---|
| `test_OwnerCanTransferOwnership` | Pemilik baru bisa addHospital |
| `test_PreviousOwnerCannotAddHospitalAfterTransfer` | Pemilik lama tidak bisa addHospital |

---

## Konsep Foundry yang Digunakan

| Cheatcode | Fungsi |
|---|---|
| `vm.prank(addr)` | Eksekusi transaksi berikutnya dari `addr` |
| `vm.expectRevert(msg)` | Ekspektasi revert dengan pesan tertentu |
| `vm.expectEmit(...)` | Ekspektasi event terpancar |
| `vm.warp(timestamp)` | Manipulasi `block.timestamp` |
| `makeAddr("name")` | Buat address deterministik dari string |
| `bound(x, min, max)` | Batasi nilai fuzz ke range tertentu |

---

## Total: **27 Unit Test + 2 Fuzz Test = 29 Test Cases**
