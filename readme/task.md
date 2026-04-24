# Task: Decentralized Hospital Room DApp

## Phase 1 — Planning
- [x] Receive requirements and execution directive
- [x] Write Implementation Plan artifact (v1)
- [x] Security revision: remove self-register, apply Ownable + `addHospital()` (anti-Sybil)
- [x] User approved — proceed to execution

## Phase 2 — Smart Contract (Hardhat)
- [x] Initialize Hardhat project in `c:\Users\Windows\sct\hospital-dapp`
- [x] Write `HospitalRoom.sol` (^0.8.20, Ownable)
  - [x] `struct RoomInfo` + `mapping(address => RoomInfo)` state
  - [x] `onlyOwner` modifier (from Ownable) + `onlyRegisteredHospital` modifier
  - [x] `addHospital(address, name)` — owner-only whitelist
  - [x] `removeHospital(address)` — owner-only revoke
  - [x] `updateRoomStatus(available, total)` — whitelisted hospital only
  - [x] `getRoomStatus(address)` — public view function
  - [x] Events: `HospitalAdded`, `HospitalRemoved`, `RoomStatusUpdated`
- [x] Write Hardhat deployment script `scripts/deploy.js`
- [x] Compile contract (`npx hardhat compile`) — ✅ 3 Solidity files compiled successfully
- [x] Deploy to local Hardhat node — ✅ `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- [x] Copy ABI + contract address to frontend

## Phase 3 — React Frontend
- [x] Initialize React app with Vite + Tailwind CSS in `hospital-dapp/frontend`
- [x] Create project structure:
  - [x] `src/abi/HospitalRoom.json`
  - [x] `src/hooks/useHospitalRoom.js` (Ethers.js v6 hook)
  - [x] `src/components/PublicDashboard.jsx`
  - [x] `src/components/AdminPanel.jsx`
  - [x] `src/App.jsx`
  - [x] `src/config.js` (contract address & RPC URL)
- [x] Implement Public Dashboard (read-only, no wallet required)
- [x] Implement Admin Panel (MetaMask wallet connect + whitelist check + update status)
- [x] Style with Tailwind CSS (medical/professional theme)
- [x] Dev server running at `http://localhost:5173`

## Phase 4 — Verifikasi
- [x] Compile contract — ✅ 3 Solidity files compiled
- [x] Deploy ke local node — ✅ contract address confirmed
- [x] Browser test: Dashboard load tanpa wallet — ✅ RS Maju Sehat data terbaca
- [x] Browser test: Admin Panel menampilkan tombol Hubungkan MetaMask — ✅
- [ ] Browser test: Admin Panel connect MetaMask + update status (memerlukan MetaMask di browser)
