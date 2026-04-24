// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HospitalRoom
 * @author Capstone Project — Decentralized Hospital Room Availability
 * @notice Sistem informasi ketersediaan kamar rumah sakit secara on-chain.
 *         Transparansi penuh: publik dapat membaca data tanpa wallet.
 *         Keamanan ketat: hanya owner (deployer) yang bisa mendaftarkan RS,
 *         dan hanya wallet RS terdaftar yang bisa memperbarui datanya sendiri.
 *
 * @dev Security Model:
 *   - Ownable pattern: owner = deployer (Kemenkes / Administrator Sistem).
 *   - Anti-Sybil: TIDAK ada self-register. Registrasi RS hanya via `addHospital()` oleh owner.
 *   - `onlyRegisteredHospital` modifier: RS hanya bisa update data miliknya sendiri.
 *   - Semua perubahan direkam sebagai on-chain Events untuk audit trail.
 */
contract HospitalRoom is Ownable {

    // =========================================================================
    // TIPE DATA
    // =========================================================================

    /**
     * @notice Informasi ketersediaan kamar satu rumah sakit.
     * @param name           Nama resmi rumah sakit
     * @param totalRooms     Total kapasitas kamar yang tersedia
     * @param availableRooms Jumlah kamar yang saat ini kosong
     * @param isRegistered   true jika wallet RS sudah didaftarkan oleh owner
     * @param lastUpdated    Timestamp Unix terakhir kali data diperbarui
     */
    struct RoomInfo {
        string  name;
        uint256 totalRooms;
        uint256 availableRooms;
        bool    isRegistered;
        uint256 lastUpdated;
    }

    // =========================================================================
    // STATE VARIABLES
    // =========================================================================

    /// @notice Mapping: wallet address RS → data kamar RS tersebut
    mapping(address => RoomInfo) private hospitalData;

    /// @notice Daftar semua address RS yang pernah didaftarkan (untuk iterasi publik)
    address[] private hospitalList;

    // =========================================================================
    // EVENTS
    // =========================================================================

    /**
     * @notice Dipancarkan saat owner mendaftarkan rumah sakit baru.
     * @param hospital  Address wallet RS
     * @param name      Nama resmi RS
     */
    event HospitalAdded(address indexed hospital, string name);

    /**
     * @notice Dipancarkan saat owner mencabut akses rumah sakit.
     * @param hospital  Address wallet RS yang dicabut
     */
    event HospitalRemoved(address indexed hospital);

    /**
     * @notice Dipancarkan saat RS memperbarui status kamar.
     * @param hospital       Address wallet RS yang melakukan update
     * @param availableRooms Jumlah kamar tersedia setelah update
     * @param totalRooms     Total kamar setelah update
     * @param timestamp      Waktu Unix saat update terjadi
     */
    event RoomStatusUpdated(
        address indexed hospital,
        uint256 availableRooms,
        uint256 totalRooms,
        uint256 timestamp
    );

    // =========================================================================
    // MODIFIERS
    // =========================================================================

    /**
     * @dev Hanya wallet rumah sakit yang telah didaftarkan oleh owner.
     *      Mencegah Sybil Attack — tidak ada pihak luar yang bisa input data.
     */
    modifier onlyRegisteredHospital() {
        require(
            hospitalData[msg.sender].isRegistered,
            "HospitalRoom: caller is not a registered hospital"
        );
        _;
    }

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    /**
     * @notice Inisialisasi kontrak. Deployer otomatis menjadi `owner`.
     * @dev Ownable constructor dipanggil dengan `msg.sender` sebagai initial owner.
     */
    constructor() Ownable(msg.sender) {}

    // =========================================================================
    // FUNGSI ACCESS CONTROL — Owner Only
    // =========================================================================

    /**
     * @notice Mendaftarkan wallet rumah sakit baru ke dalam whitelist sistem.
     * @dev Hanya `owner` (Kemenkes / admin) yang bisa memanggil fungsi ini.
     *      Mencegah Sybil Attack — wallet tidak bisa self-register.
     * @param _hospital  Address wallet resmi RS yang akan didaftarkan
     * @param _name      Nama resmi rumah sakit
     */
    function addHospital(address _hospital, string calldata _name)
        external
        onlyOwner
    {
        require(_hospital != address(0), "HospitalRoom: invalid address");
        require(bytes(_name).length > 0,  "HospitalRoom: name cannot be empty");
        require(
            !hospitalData[_hospital].isRegistered,
            "HospitalRoom: hospital already registered"
        );

        hospitalData[_hospital] = RoomInfo({
            name:           _name,
            totalRooms:     0,
            availableRooms: 0,
            isRegistered:   true,
            lastUpdated:    block.timestamp
        });

        hospitalList.push(_hospital);
        emit HospitalAdded(_hospital, _name);
    }

    /**
     * @notice Mencabut akses wallet rumah sakit dari sistem.
     * @dev Hanya `owner` yang bisa memanggil. Data historis tetap tersimpan
     *      on-chain untuk transparansi, hanya `isRegistered` yang di-set false.
     * @param _hospital  Address wallet RS yang akan dicabut aksesnya
     */
    function removeHospital(address _hospital)
        external
        onlyOwner
    {
        require(
            hospitalData[_hospital].isRegistered,
            "HospitalRoom: hospital not registered"
        );

        hospitalData[_hospital].isRegistered = false;
        emit HospitalRemoved(_hospital);
    }

    // =========================================================================
    // FUNGSI UPDATE — Registered Hospital Only
    // =========================================================================

    /**
     * @notice Memperbarui status ketersediaan kamar oleh rumah sakit terdaftar.
     * @dev Hanya wallet RS yang sudah di-whitelist oleh owner yang bisa memperbarui.
     *      RS hanya bisa update data miliknya sendiri (msg.sender sebagai key).
     *      Trustless: perubahan langsung tercatat on-chain dan tidak bisa dimanipulasi.
     * @param _availableRooms  Jumlah kamar yang saat ini kosong
     * @param _totalRooms      Total kapasitas kamar RS
     */
    function updateRoomStatus(uint256 _availableRooms, uint256 _totalRooms)
        external
        onlyRegisteredHospital
    {
        require(
            _availableRooms <= _totalRooms,
            "HospitalRoom: available cannot exceed total"
        );
        require(_totalRooms > 0, "HospitalRoom: total rooms must be greater than 0");

        RoomInfo storage info = hospitalData[msg.sender];
        info.availableRooms = _availableRooms;
        info.totalRooms     = _totalRooms;
        info.lastUpdated    = block.timestamp;

        emit RoomStatusUpdated(msg.sender, _availableRooms, _totalRooms, block.timestamp);
    }

    // =========================================================================
    // FUNGSI VIEW — Publik, Gas-Free untuk Caller
    // =========================================================================

    /**
     * @notice Mengembalikan data lengkap status kamar suatu rumah sakit.
     * @dev Fungsi `view`, tidak mengonsumsi gas jika dipanggil dari luar.
     *      Siapapun (termasuk pasien tanpa wallet) bisa mengakses data ini.
     * @param _hospital     Address wallet RS yang ingin dilihat statusnya
     * @return name         Nama resmi rumah sakit
     * @return totalRooms   Total kapasitas kamar
     * @return availableRooms Jumlah kamar tersedia saat ini
     * @return isRegistered Status registrasi dalam sistem
     * @return lastUpdated  Timestamp terakhir update (Unix)
     * @return isFull       true jika availableRooms == 0
     */
    function getRoomStatus(address _hospital)
        external
        view
        returns (
            string  memory name,
            uint256 totalRooms,
            uint256 availableRooms,
            bool    isRegistered,
            uint256 lastUpdated,
            bool    isFull
        )
    {
        RoomInfo memory info = hospitalData[_hospital];
        return (
            info.name,
            info.totalRooms,
            info.availableRooms,
            info.isRegistered,
            info.lastUpdated,
            info.availableRooms == 0
        );
    }

    /**
     * @notice Mengembalikan daftar semua address RS yang pernah terdaftar.
     * @dev Berguna untuk frontend dashboard publik — iterasi semua RS.
     * @return Array of hospital wallet addresses
     */
    function getAllHospitals() external view returns (address[] memory) {
        return hospitalList;
    }

    /**
     * @notice Mengembalikan jumlah total RS yang pernah terdaftar.
     * @return Jumlah RS (uint256)
     */
    function totalHospitals() external view returns (uint256) {
        return hospitalList.length;
    }
}
