// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/HospitalRoom.sol";

/**
 * @title HospitalRoomTest
 * @notice Unit test komprehensif untuk kontrak HospitalRoom menggunakan Foundry.
 *
 * Cakupan pengujian:
 *  ✅ Deployment & Ownership
 *  ✅ addHospital() — happy path & revert cases
 *  ✅ removeHospital() — happy path & revert cases
 *  ✅ updateRoomStatus() — happy path & revert cases
 *  ✅ getRoomStatus() — semua field return value
 *  ✅ getAllHospitals() & totalHospitals()
 *  ✅ Event emissions (HospitalAdded, HospitalRemoved, RoomStatusUpdated)
 *  ✅ Access control (onlyOwner, onlyRegisteredHospital)
 *  ✅ Edge cases (zero address, empty name, overflow logic, dll.)
 */
contract HospitalRoomTest is Test {

    // =========================================================================
    // EVENTS — Dideklarasikan ulang agar bisa digunakan dengan vm.expectEmit
    // =========================================================================

    event HospitalAdded(address indexed hospital, string name);
    event HospitalRemoved(address indexed hospital);
    event RoomStatusUpdated(
        address indexed hospital,
        uint256 availableRooms,
        uint256 totalRooms,
        uint256 timestamp
    );

    // =========================================================================
    // SETUP — Variabel & Actors
    // =========================================================================

    HospitalRoom public hospitalRoom;

    // Actors
    address public owner;         // Deployer / Kemenkes
    address public hospital1;     // RS Umum Pusat
    address public hospital2;     // RS Swasta
    address public randomUser;    // Pengguna acak tanpa hak akses
    address public anotherWallet; // Wallet lain

    // Konstanta nama RS
    string constant HOSPITAL1_NAME = "RS Umum Pusat Nasional";
    string constant HOSPITAL2_NAME = "RS Swasta Harapan Bunda";

    // =========================================================================
    // FOUNDRY SETUP
    // =========================================================================

    function setUp() public {
        // Buat address unik untuk setiap aktor
        owner         = makeAddr("owner");
        hospital1     = makeAddr("hospital1");
        hospital2     = makeAddr("hospital2");
        randomUser    = makeAddr("randomUser");
        anotherWallet = makeAddr("anotherWallet");

        // Deploy kontrak sebagai `owner`
        vm.prank(owner);
        hospitalRoom = new HospitalRoom();
    }

    // =========================================================================
    // HELPER FUNCTIONS
    // =========================================================================

    /// @dev Shortcut: daftarkan hospital1 sebagai RS resmi
    function _addHospital1() internal {
        vm.prank(owner);
        hospitalRoom.addHospital(hospital1, HOSPITAL1_NAME);
    }

    /// @dev Shortcut: daftarkan hospital2 sebagai RS resmi
    function _addHospital2() internal {
        vm.prank(owner);
        hospitalRoom.addHospital(hospital2, HOSPITAL2_NAME);
    }

    /// @dev Shortcut: daftarkan hospital1 lalu update status kamarnya
    function _addAndUpdateHospital1(uint256 available, uint256 total) internal {
        _addHospital1();
        vm.prank(hospital1);
        hospitalRoom.updateRoomStatus(available, total);
    }

    // =========================================================================
    // 1. DEPLOYMENT & OWNERSHIP
    // =========================================================================

    function test_DeploymentSetsOwnerCorrectly() public view {
        assertEq(hospitalRoom.owner(), owner, "Owner harus merupakan deployer");
    }

    function test_InitialHospitalListIsEmpty() public view {
        assertEq(hospitalRoom.totalHospitals(), 0, "Daftar RS awal harus kosong");
        assertEq(hospitalRoom.getAllHospitals().length, 0, "Array RS awal harus kosong");
    }

    // =========================================================================
    // 2. addHospital() — Happy Path
    // =========================================================================

    function test_AddHospital_SuccessfullyRegisters() public {
        _addHospital1();

        // Verifikasi data tersimpan dengan benar
        (
            string memory name,
            uint256 totalRooms,
            uint256 availableRooms,
            bool isRegistered,
            ,
            bool isFull
        ) = hospitalRoom.getRoomStatus(hospital1);

        assertEq(name, HOSPITAL1_NAME, "Nama RS harus sesuai");
        assertEq(totalRooms, 0, "Total kamar awal harus 0");
        assertEq(availableRooms, 0, "Kamar tersedia awal harus 0");
        assertTrue(isRegistered, "RS harus terdaftar");
        assertTrue(isFull, "Kamar dianggap penuh jika availableRooms == 0");
    }

    function test_AddHospital_IncrementsTotalCount() public {
        assertEq(hospitalRoom.totalHospitals(), 0);

        _addHospital1();
        assertEq(hospitalRoom.totalHospitals(), 1, "Total RS harus menjadi 1");

        _addHospital2();
        assertEq(hospitalRoom.totalHospitals(), 2, "Total RS harus menjadi 2");
    }

    function test_AddHospital_AppearsInAllHospitalsList() public {
        _addHospital1();
        _addHospital2();

        address[] memory list = hospitalRoom.getAllHospitals();
        assertEq(list.length, 2, "Daftar harus berisi 2 RS");
        assertEq(list[0], hospital1, "RS pertama harus hospital1");
        assertEq(list[1], hospital2, "RS kedua harus hospital2");
    }

    function test_AddHospital_SetsLastUpdatedToCurrentBlock() public {
        uint256 beforeTimestamp = block.timestamp;
        _addHospital1();

        (, , , , uint256 lastUpdated, ) = hospitalRoom.getRoomStatus(hospital1);
        assertGe(lastUpdated, beforeTimestamp, "lastUpdated harus >= timestamp sebelum tx");
        assertLe(lastUpdated, block.timestamp, "lastUpdated harus <= timestamp saat ini");
    }

    // =========================================================================
    // 3. addHospital() — Event Emission
    // =========================================================================

    function test_AddHospital_EmitsHospitalAddedEvent() public {
        // Ekspektasi event: hospital = hospital1, name = HOSPITAL1_NAME
        vm.expectEmit(true, false, false, true);
        emit HospitalAdded(hospital1, HOSPITAL1_NAME);

        vm.prank(owner);
        hospitalRoom.addHospital(hospital1, HOSPITAL1_NAME);
    }

    // =========================================================================
    // 4. addHospital() — Revert Cases
    // =========================================================================

    function test_AddHospital_RevertsIfCallerIsNotOwner() public {
        vm.prank(randomUser);
        vm.expectRevert();
        hospitalRoom.addHospital(hospital1, HOSPITAL1_NAME);
    }

    function test_AddHospital_RevertsIfAddressIsZero() public {
        vm.prank(owner);
        vm.expectRevert("HospitalRoom: invalid address");
        hospitalRoom.addHospital(address(0), HOSPITAL1_NAME);
    }

    function test_AddHospital_RevertsIfNameIsEmpty() public {
        vm.prank(owner);
        vm.expectRevert("HospitalRoom: name cannot be empty");
        hospitalRoom.addHospital(hospital1, "");
    }

    function test_AddHospital_RevertsIfAlreadyRegistered() public {
        _addHospital1(); // Daftarkan pertama kali

        vm.prank(owner);
        vm.expectRevert("HospitalRoom: hospital already registered");
        hospitalRoom.addHospital(hospital1, "Nama Duplikat"); // Daftar ulang
    }

    // =========================================================================
    // 5. removeHospital() — Happy Path
    // =========================================================================

    function test_RemoveHospital_SetsIsRegisteredToFalse() public {
        _addHospital1();

        vm.prank(owner);
        hospitalRoom.removeHospital(hospital1);

        (, , , bool isRegistered, , ) = hospitalRoom.getRoomStatus(hospital1);
        assertFalse(isRegistered, "isRegistered harus menjadi false setelah dicabut");
    }

    function test_RemoveHospital_PreservesHistoricalData() public {
        // Daftarkan dan update status kamar
        _addAndUpdateHospital1(50, 100);

        // Cabut akses
        vm.prank(owner);
        hospitalRoom.removeHospital(hospital1);

        // Data historis tetap tersimpan (hanya isRegistered = false)
        (
            string memory name,
            uint256 totalRooms,
            uint256 availableRooms,
            bool isRegistered,
            ,

        ) = hospitalRoom.getRoomStatus(hospital1);

        assertEq(name, HOSPITAL1_NAME, "Nama historis harus tetap tersimpan");
        assertEq(totalRooms, 100, "Total kamar historis harus tetap");
        assertEq(availableRooms, 50, "Kamar tersedia historis harus tetap");
        assertFalse(isRegistered, "Status registrasi harus false");
    }

    function test_RemoveHospital_DoesNotRemoveFromList() public {
        // List hospitalList tidak diubah (data on-chain untuk transparansi)
        _addHospital1();
        _addHospital2();

        vm.prank(owner);
        hospitalRoom.removeHospital(hospital1);

        assertEq(hospitalRoom.totalHospitals(), 2, "totalHospitals tidak berkurang setelah remove");
    }

    // =========================================================================
    // 6. removeHospital() — Event Emission
    // =========================================================================

    function test_RemoveHospital_EmitsHospitalRemovedEvent() public {
        _addHospital1();

        vm.expectEmit(true, false, false, false);
        emit HospitalRemoved(hospital1);

        vm.prank(owner);
        hospitalRoom.removeHospital(hospital1);
    }

    // =========================================================================
    // 7. removeHospital() — Revert Cases
    // =========================================================================

    function test_RemoveHospital_RevertsIfCallerIsNotOwner() public {
        _addHospital1();

        vm.prank(randomUser);
        vm.expectRevert();
        hospitalRoom.removeHospital(hospital1);
    }

    function test_RemoveHospital_RevertsIfHospitalNotRegistered() public {
        // hospital1 belum pernah didaftarkan
        vm.prank(owner);
        vm.expectRevert("HospitalRoom: hospital not registered");
        hospitalRoom.removeHospital(hospital1);
    }

    function test_RemoveHospital_RevertsIfAlreadyRemoved() public {
        _addHospital1();

        // Cabut pertama kali
        vm.prank(owner);
        hospitalRoom.removeHospital(hospital1);

        // Cabut kedua kali — harus revert
        vm.prank(owner);
        vm.expectRevert("HospitalRoom: hospital not registered");
        hospitalRoom.removeHospital(hospital1);
    }

    // =========================================================================
    // 8. updateRoomStatus() — Happy Path
    // =========================================================================

    function test_UpdateRoomStatus_UpdatesDataCorrectly() public {
        _addHospital1();

        vm.prank(hospital1);
        hospitalRoom.updateRoomStatus(75, 100);

        (, uint256 totalRooms, uint256 availableRooms, , , bool isFull) =
            hospitalRoom.getRoomStatus(hospital1);

        assertEq(totalRooms, 100, "Total kamar harus 100");
        assertEq(availableRooms, 75, "Kamar tersedia harus 75");
        assertFalse(isFull, "RS tidak penuh jika masih ada kamar tersedia");
    }

    function test_UpdateRoomStatus_WhenFullAvailableIsZero() public {
        _addHospital1();

        vm.prank(hospital1);
        hospitalRoom.updateRoomStatus(0, 50); // Semua kamar terisi

        (, , uint256 availableRooms, , , bool isFull) =
            hospitalRoom.getRoomStatus(hospital1);

        assertEq(availableRooms, 0, "Kamar tersedia harus 0");
        assertTrue(isFull, "isFull harus true jika availableRooms == 0");
    }

    function test_UpdateRoomStatus_WhenAvailableEqualsTotal() public {
        _addHospital1();

        // availableRooms == totalRooms (semua kamar kosong)
        vm.prank(hospital1);
        hospitalRoom.updateRoomStatus(200, 200);

        (, uint256 totalRooms, uint256 availableRooms, , , ) =
            hospitalRoom.getRoomStatus(hospital1);

        assertEq(totalRooms, 200, "Total kamar harus 200");
        assertEq(availableRooms, 200, "Kamar tersedia harus 200");
    }

    function test_UpdateRoomStatus_UpdatesLastUpdatedTimestamp() public {
        _addHospital1();

        // Set timestamp ke nilai yang diketahui secara eksplisit
        uint256 expectedTimestamp = 1_700_000_000; // Unix timestamp yang jelas berbeda
        vm.warp(expectedTimestamp);

        vm.prank(hospital1);
        hospitalRoom.updateRoomStatus(30, 100);

        (, , , , uint256 lastUpdated, ) = hospitalRoom.getRoomStatus(hospital1);

        // lastUpdated harus persis sama dengan nilai setelah warp
        assertEq(lastUpdated, expectedTimestamp, "lastUpdated harus = timestamp saat updateRoomStatus dipanggil");
    }

    function test_UpdateRoomStatus_CanUpdateMultipleTimes() public {
        _addHospital1();

        vm.prank(hospital1);
        hospitalRoom.updateRoomStatus(100, 200);

        vm.prank(hospital1);
        hospitalRoom.updateRoomStatus(50, 150);

        vm.prank(hospital1);
        hospitalRoom.updateRoomStatus(0, 100);

        (, uint256 totalRooms, uint256 availableRooms, , , bool isFull) =
            hospitalRoom.getRoomStatus(hospital1);

        assertEq(totalRooms, 100, "Total kamar terakhir harus 100");
        assertEq(availableRooms, 0, "Kamar tersedia terakhir harus 0");
        assertTrue(isFull, "RS harus penuh setelah update terakhir");
    }

    // =========================================================================
    // 9. updateRoomStatus() — Event Emission
    // =========================================================================

    function test_UpdateRoomStatus_EmitsRoomStatusUpdatedEvent() public {
        _addHospital1();

        vm.expectEmit(true, false, false, true);
        emit RoomStatusUpdated(hospital1, 40, 100, block.timestamp);

        vm.prank(hospital1);
        hospitalRoom.updateRoomStatus(40, 100);
    }

    // =========================================================================
    // 10. updateRoomStatus() — Revert Cases
    // =========================================================================

    function test_UpdateRoomStatus_RevertsIfCallerNotRegistered() public {
        // randomUser belum pernah didaftarkan
        vm.prank(randomUser);
        vm.expectRevert("HospitalRoom: caller is not a registered hospital");
        hospitalRoom.updateRoomStatus(10, 50);
    }

    function test_UpdateRoomStatus_RevertsIfCallerWasRemoved() public {
        _addHospital1();

        // Owner mencabut akses hospital1
        vm.prank(owner);
        hospitalRoom.removeHospital(hospital1);

        // hospital1 mencoba update — harus revert
        vm.prank(hospital1);
        vm.expectRevert("HospitalRoom: caller is not a registered hospital");
        hospitalRoom.updateRoomStatus(10, 50);
    }

    function test_UpdateRoomStatus_RevertsIfAvailableExceedsTotal() public {
        _addHospital1();

        vm.prank(hospital1);
        vm.expectRevert("HospitalRoom: available cannot exceed total");
        hospitalRoom.updateRoomStatus(101, 100); // available > total
    }

    function test_UpdateRoomStatus_RevertsIfTotalRoomsIsZero() public {
        _addHospital1();

        vm.prank(hospital1);
        vm.expectRevert("HospitalRoom: total rooms must be greater than 0");
        hospitalRoom.updateRoomStatus(0, 0); // total = 0
    }

    function test_UpdateRoomStatus_RevertsIfOwnerTriesToUpdate() public {
        // Owner tidak terdaftar sebagai RS, harus revert
        vm.prank(owner);
        vm.expectRevert("HospitalRoom: caller is not a registered hospital");
        hospitalRoom.updateRoomStatus(10, 50);
    }

    // =========================================================================
    // 11. Isolasi Data Antar RS
    // =========================================================================

    function test_EachHospitalHasIndependentData() public {
        _addHospital1();
        _addHospital2();

        // hospital1 update kamarnya
        vm.prank(hospital1);
        hospitalRoom.updateRoomStatus(30, 100);

        // hospital2 update kamarnya dengan nilai berbeda
        vm.prank(hospital2);
        hospitalRoom.updateRoomStatus(80, 200);

        // Verifikasi data hospital1 tidak terpengaruh update hospital2
        (, uint256 total1, uint256 avail1, , , ) = hospitalRoom.getRoomStatus(hospital1);
        (, uint256 total2, uint256 avail2, , , ) = hospitalRoom.getRoomStatus(hospital2);

        assertEq(total1, 100, "Data hospital1 tidak boleh berubah");
        assertEq(avail1, 30, "Data hospital1 tidak boleh berubah");
        assertEq(total2, 200, "Data hospital2 harus sesuai update-nya");
        assertEq(avail2, 80, "Data hospital2 harus sesuai update-nya");
    }

    function test_HospitalCannotUpdateAnotherHospitalData() public {
        _addHospital1();
        _addHospital2();

        // hospital1 update data miliknya sendiri (normal)
        vm.prank(hospital1);
        hospitalRoom.updateRoomStatus(50, 100);

        // hospital2 tidak bisa "memalsukan" jadi hospital1 karena msg.sender tetap hospital2
        // Cukup verifikasi bahwa data hospital1 tidak berubah
        vm.prank(hospital2);
        hospitalRoom.updateRoomStatus(999, 1000);

        (, uint256 total1, uint256 avail1, , , ) = hospitalRoom.getRoomStatus(hospital1);
        assertEq(total1, 100, "Total kamar hospital1 tidak berubah");
        assertEq(avail1, 50, "Kamar tersedia hospital1 tidak berubah");
    }

    // =========================================================================
    // 12. getRoomStatus() — Unregistered Address
    // =========================================================================

    function test_GetRoomStatus_ReturnsDefaultForUnregisteredAddress() public view {
        (
            string memory name,
            uint256 totalRooms,
            uint256 availableRooms,
            bool isRegistered,
            uint256 lastUpdated,
            bool isFull
        ) = hospitalRoom.getRoomStatus(randomUser);

        assertEq(bytes(name).length, 0, "Nama harus kosong untuk address tidak terdaftar");
        assertEq(totalRooms, 0, "Total kamar default 0");
        assertEq(availableRooms, 0, "Kamar tersedia default 0");
        assertFalse(isRegistered, "isRegistered harus false untuk address tidak terdaftar");
        assertEq(lastUpdated, 0, "lastUpdated default 0");
        assertTrue(isFull, "isFull true karena availableRooms == 0");
    }

    // =========================================================================
    // 13. Fuzz Testing — updateRoomStatus()
    // =========================================================================

    /**
     * @notice Fuzz test: updateRoomStatus harus selalu sukses jika
     *         available <= total AND total > 0.
     */
    function testFuzz_UpdateRoomStatus_ValidInput(
        uint256 available,
        uint256 total
    ) public {
        // Batasi range agar wajar
        total     = bound(total,     1, 10_000);
        available = bound(available, 0, total);

        _addHospital1();

        vm.prank(hospital1);
        hospitalRoom.updateRoomStatus(available, total);

        (, uint256 storedTotal, uint256 storedAvail, , , ) =
            hospitalRoom.getRoomStatus(hospital1);

        assertEq(storedTotal, total, "Total kamar harus tersimpan benar");
        assertEq(storedAvail, available, "Kamar tersedia harus tersimpan benar");
    }

    /**
     * @notice Fuzz test: updateRoomStatus harus SELALU revert jika
     *         available > total.
     */
    function testFuzz_UpdateRoomStatus_RevertsWhenAvailableExceedsTotal(
        uint256 available,
        uint256 total
    ) public {
        total     = bound(total,     0, 9_999);
        available = bound(available, total + 1, 10_000);

        _addHospital1();

        vm.prank(hospital1);
        vm.expectRevert();
        hospitalRoom.updateRoomStatus(available, total);
    }

    // =========================================================================
    // 14. Ownership Transfer (dari Ownable OpenZeppelin)
    // =========================================================================

    function test_OwnerCanTransferOwnership() public {
        vm.prank(owner);
        hospitalRoom.transferOwnership(anotherWallet);

        // Setelah transferOwnership, pemilik baru harus bisa addHospital
        vm.prank(anotherWallet);
        hospitalRoom.addHospital(hospital1, HOSPITAL1_NAME);

        (, , , bool isRegistered, , ) = hospitalRoom.getRoomStatus(hospital1);
        assertTrue(isRegistered, "Pemilik baru harus bisa mendaftarkan RS");
    }

    function test_PreviousOwnerCannotAddHospitalAfterTransfer() public {
        vm.prank(owner);
        hospitalRoom.transferOwnership(anotherWallet);

        // Pemilik lama tidak lagi bisa addHospital
        vm.prank(owner);
        vm.expectRevert();
        hospitalRoom.addHospital(hospital1, HOSPITAL1_NAME);
    }
}
