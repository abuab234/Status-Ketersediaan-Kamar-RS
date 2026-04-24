const hre = require("hardhat");

async function main() {
  const [owner, testHospital] = await hre.ethers.getSigners();

  console.log("=".repeat(60));
  console.log("Men-deploy kontrak HospitalRoom...");
  console.log("Owner (deployer) :", owner.address);
  console.log("=".repeat(60));

  // Deploy kontrak
  const HospitalRoom = await hre.ethers.getContractFactory("HospitalRoom");
  const hospitalRoom = await HospitalRoom.deploy();
  await hospitalRoom.waitForDeployment();

  const contractAddress = await hospitalRoom.getAddress();
  console.log("\n✅ HospitalRoom berhasil di-deploy ke:", contractAddress);

  // Daftarkan satu RS uji coba (Account[1]) untuk kemudahan pengujian lokal
  // Di lingkungan produksi: owner memanggil addHospital() secara manual melalui Admin Panel
  console.log("\nMendaftarkan RS uji coba (Account[1])...");
  const tx = await hospitalRoom.addHospital(
    testHospital.address,
    "RS Maju Sehat (Uji Coba)"
  );
  await tx.wait();
  console.log("✅ RS uji coba berhasil didaftarkan:", testHospital.address);

  // Tampilkan status awal
  const status = await hospitalRoom.getRoomStatus(testHospital.address);
  console.log("\nStatus Kamar Awal:", {
    nama:           status.name,
    totalKamar:     status.totalRooms.toString(),
    kamarTersedia:  status.availableRooms.toString(),
    terdaftar:      status.isRegistered,
  });

  console.log("\n" + "=".repeat(60));
  console.log("SALIN NILAI INI KE KONFIGURASI FRONTEND:");
  console.log("CONTRACT_ADDRESS =", contractAddress);
  console.log("WALLET_RS_UJI   =", testHospital.address);
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
