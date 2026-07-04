# BAB I — PENDAHULUAN

---

## 1.1 Latar Belakang Masalah

Ketersediaan informasi kamar rumah sakit yang akurat dan real-time merupakan salah satu kebutuhan mendasar dalam sistem layanan kesehatan modern. Ketika seorang pasien atau keluarganya membutuhkan perawatan darurat, keterlambatan dalam mendapatkan informasi ketersediaan kamar dapat berdampak serius terhadap keselamatan jiwa. Di Indonesia, permasalahan ini masih kerap terjadi karena sistem informasi rumah sakit yang ada umumnya bersifat terpusat (*centralized*), tertutup, dan tidak dapat diakses secara publik dengan mudah.

Sistem terpusat memiliki sejumlah kelemahan mendasar. Pertama, data hanya tersimpan pada satu server tunggal yang rentan terhadap kegagalan sistem (*single point of failure*), serangan siber, maupun manipulasi data oleh pihak yang tidak bertanggung jawab. Kedua, tidak ada jaminan integritas data — informasi yang ditampilkan kepada publik dapat berbeda dengan kondisi aktual di lapangan. Ketiga, masyarakat harus menghubungi rumah sakit satu per satu melalui telepon atau datang langsung untuk mengetahui ketersediaan kamar, yang tentu saja tidak efisien.

Perkembangan teknologi *blockchain* dan *smart contract* menawarkan solusi yang menjanjikan atas permasalahan tersebut. Teknologi *blockchain* memungkinkan penyimpanan data yang bersifat terdesentralisasi, transparan, tidak dapat diubah (*immutable*), dan dapat diaudit oleh siapapun tanpa memerlukan kepercayaan pada pihak ketiga. Dengan memanfaatkan *smart contract* berbasis Solidity pada jaringan Ethereum-compatible, logika bisnis dapat dieksekusi secara otomatis, konsisten, dan terbuka untuk diverifikasi publik.

Berdasarkan permasalahan tersebut, penelitian ini mengembangkan sebuah **Decentralized Application (DApp)** untuk memantau ketersediaan kamar rumah sakit secara transparan dan real-time. Sistem ini memanfaatkan *smart contract* Solidity yang berjalan di atas jaringan Hardhat lokal, dikombinasikan dengan antarmuka pengguna berbasis React.js, sehingga informasi ketersediaan kamar dapat diakses oleh seluruh lapisan masyarakat tanpa biaya, tanpa akun, dan tanpa perantara.

---

## 1.2 Rumusan Masalah

Berdasarkan latar belakang yang telah diuraikan, rumusan masalah dalam penelitian ini adalah sebagai berikut:

1. Bagaimana merancang dan mengimplementasikan *smart contract* berbasis Solidity yang mampu mengelola data ketersediaan kamar rumah sakit secara terdesentralisasi dengan kontrol akses berbasis peran (*role-based access control*)?

2. Bagaimana mekanisme keamanan sistem dapat menjamin bahwa hanya pihak yang berwenang — yaitu Admin Pusat (*owner/deployer*) dan Staf Rumah Sakit yang telah terdaftar (*whitelist*) — yang dapat memodifikasi data pada blockchain?

3. Bagaimana membangun antarmuka pengguna (*frontend*) yang dapat terhubung ke *smart contract* dan menampilkan informasi ketersediaan kamar secara real-time kepada masyarakat umum tanpa memerlukan wallet atau akun blockchain?

4. Bagaimana memvalidasi kebenaran dan keandalan sistem melalui pengujian fungsional, pengujian keamanan, pengujian *boundary value*, dan pengujian *state transition* pada *smart contract*?

---

## 1.3 Batasan Masalah

Untuk memfokuskan ruang lingkup penelitian dan menghindari pembahasan yang terlalu luas, penelitian ini memberikan batasan-batasan sebagai berikut:

1. **Jaringan Blockchain:** Sistem dikembangkan dan diuji pada jaringan lokal Hardhat (*Hardhat Network*), bukan pada jaringan Ethereum Mainnet atau testnet publik seperti Sepolia atau Goerli.

2. **Bahasa Pemrograman *Smart Contract*:** *Smart contract* ditulis menggunakan bahasa Solidity versi `^0.8.20` dan dikompilasi serta di-*deploy* menggunakan framework Hardhat.

3. **Data yang Dikelola:** Sistem hanya mengelola data ketersediaan kamar rawat inap, yang meliputi nama rumah sakit, jumlah kamar tersedia (*availableRooms*), total kapasitas kamar (*totalRooms*), status penuh (*isFull*), dan waktu pembaruan terakhir (*lastUpdated*). Sistem tidak mencakup data rekam medis, data pasien, atau informasi klinis lainnya.

4. **Peran Pengguna:** Sistem hanya mendefinisikan tiga peran, yaitu Admin Pusat (*owner/deployer contract*), Staf Rumah Sakit (*wallet terdaftar/whitelist*), dan Masyarakat Umum/Pasien (*publik, tanpa wallet*). Tidak ada mekanisme registrasi mandiri (*self-register*) bagi rumah sakit.

5. **Frontend:** Antarmuka pengguna dibangun menggunakan React.js dengan Ethers.js v6 sebagai *library* penghubung ke blockchain. Integrasi wallet menggunakan MetaMask Browser Extension. Sistem tidak dikembangkan dalam bentuk aplikasi mobile.

6. **Pengujian:** Pengujian dilakukan menggunakan framework Hardhat dan Chai/Mocha untuk unit testing *smart contract*. Pengujian tidak mencakup pengujian beban (*load testing*) dalam skala jaringan publik.

7. **Keamanan:** Sistem mengandalkan mekanisme keamanan bawaan *smart contract* (modifier `onlyOwner` dan `onlyRegisteredHospital`) serta audit *on-chain* melalui event. Sistem tidak mengimplementasikan enkripsi end-to-end atau mekanisme keamanan jaringan tambahan.

---

## 1.4 Tujuan

Penelitian ini memiliki tujuan-tujuan sebagai berikut:

1. **Merancang arsitektur sistem** DApp ketersediaan kamar rumah sakit yang terdesentralisasi dengan pemisahan peran yang jelas antara Admin Pusat, Staf Rumah Sakit, dan Masyarakat Umum.

2. **Mengimplementasikan *smart contract*** `HospitalRoom.sol` berbasis Solidity yang mencakup fungsi pendaftaran rumah sakit, pembaruan status kamar, pembacaan data ketersediaan, serta mekanisme kontrol akses berbasis modifier.

3. **Membangun antarmuka pengguna** (*frontend*) berbasis React.js yang terhubung ke *smart contract* melalui Ethers.js v6, sehingga data ketersediaan kamar dapat diakses secara real-time oleh masyarakat tanpa biaya transaksi.

4. **Melakukan pengujian menyeluruh** terhadap *smart contract* meliputi pengujian fungsional, pengujian *boundary value*, pengujian *exception handling*, pengujian *state transition*, dan pengujian keamanan untuk memastikan sistem bekerja sesuai spesifikasi.

5. **Mendokumentasikan** seluruh proses perancangan, implementasi, dan pengujian sistem sebagai referensi pengembangan DApp di bidang layanan kesehatan publik.

---

## 1.5 Manfaat

### 1.5.1 Manfaat bagi Masyarakat / Pasien

- Masyarakat dapat mengakses informasi ketersediaan kamar rumah sakit secara **real-time**, **gratis**, dan **tanpa memerlukan akun atau wallet** hanya dengan mengakses aplikasi melalui browser.
- Mengurangi waktu yang terbuang akibat pencarian kamar rumah sakit secara manual melalui telepon atau kunjungan langsung, terutama dalam kondisi darurat medis.
- Meningkatkan **transparansi** informasi layanan kesehatan publik, karena data tersimpan di blockchain dan dapat diverifikasi oleh siapapun.

### 1.5.2 Manfaat bagi Rumah Sakit / Staf

- Staf rumah sakit dapat **memperbarui data ketersediaan kamar** secara langsung ke blockchain melalui antarmuka yang sederhana, tanpa perlu berkoordinasi dengan sistem pusat.
- Setiap pembaruan data tercatat secara permanen sebagai **audit trail on-chain** melalui event `RoomStatusUpdated`, sehingga memudahkan pertanggungjawaban dan pelaporan.
- Mengurangi beban komunikasi telepon dari masyarakat yang menanyakan ketersediaan kamar.

### 1.5.3 Manfaat bagi Pengelola Sistem / Admin Pusat

- Admin Pusat dapat mengelola **whitelist** rumah sakit yang berhak memperbarui data dengan mekanisme `addHospital` dan `removeHospital` yang aman karena dilindungi modifier `onlyOwner`.
- Sistem bersifat **self-executing** — logika kontrol akses dijalankan otomatis oleh *smart contract* tanpa campur tangan manual, sehingga mengurangi risiko kesalahan administrasi.
- Seluruh aktivitas sistem terekam secara transparan di blockchain, memudahkan pengawasan dan audit.

### 1.5.4 Manfaat bagi Akademik dan Pengembangan Ilmu

- Penelitian ini berkontribusi sebagai **referensi implementasi** penggunaan teknologi blockchain Solidity dalam domain layanan kesehatan publik (*healthcare DApp*).
- Memberikan **contoh nyata** penerapan konsep *role-based access control* (RBAC) dan *event-driven architecture* pada *smart contract*.
- Menjadi landasan pengembangan lebih lanjut, seperti integrasi dengan jaringan testnet publik, implementasi oracle untuk data eksternal, atau pengembangan fitur reservasi kamar berbasis blockchain.

---

> **Catatan:** Penelitian ini merupakan bagian dari proyek *capstone* yang mengintegrasikan konsep-konsep teknologi *blockchain*, *smart contract*, dan pengembangan aplikasi terdesentralisasi (*DApp*) dalam konteks nyata di bidang layanan kesehatan publik Indonesia.
