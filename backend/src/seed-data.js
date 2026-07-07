import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { prismaClient } from "./application/database.js";
import { redisClient } from "./application/redis.js";

dotenv.config();

const categoriesList = [
  "Elektronik",
  "Dokumen & Kartu",
  "Aksesoris & Perhiasan",
  "Tas & Dompet",
  "Kunci",
  "Buku & Alat Tulis",
  "Lain-lain"
];

const commentTemplates = [
  "Semoga cepat ketemu ya kak!",
  "Saya kemarin lihat barang mirip ini di deket tangga GKB.",
  "Sudah dilaporkan ke pos satpam terdekat belum kak?",
  "Bantu up biar cepet ketemu.",
  "Kemarin saya lewat parkiran emang ada yang ketinggalan disitu.",
  "Terima kasih sudah menginfokan, sangat membantu sekali.",
  "Keren kak kejujurannya, semoga berkah.",
  "Bagi yang merasa punya, harap bawa bukti KTM ya saat ambil.",
  "Coba tanya ke petugas kebersihan lantai 2 kak, biasanya disimpan mereka.",
  "Wah, punya temen saya kemarin ilang juga nih tipe ini. Saya tanyain dulu ya."
];

const claimProofTemplates = [
  "Saya memiliki bukti foto saat memakai jam tangan tersebut. Gantungan kunci mobil saya bergambar boneka beruang warna cokelat seperti yang ada di deskripsi.",
  "STNK motor tersebut atas nama saya sendiri (Budi Santoso). Saya bisa membawa KTP dan Buku Pemilik Kendaraan Bermotor (BPKB) asli saat pengambilan barang untuk dicocokkan nomor mesinnya.",
  "Dompet kulit cokelat tersebut berisi KTM saya atas nama Ani Lestari. Di dalamnya juga ada uang lembaran 50 ribu sebanyak 2 lembar dan struk belanja Indomaret bertanggal 18 Mei.",
  "KTM tersebut terjatuh saat saya menghadiri kuliah umum di Aula GKB. Foto pada KTM adalah foto saya dengan latar belakang merah, NIM 180403022.",
  "Ini adalah Binder kuliah saya. Di halaman pertama tertulis nama saya dan catatan tulisan tangan materi Kuliah Basis Data. Ada juga foto tiket kereta terlipat di saku belakang binder.",
  "Kalkulator Casio saya ada stiker kecil bergambar logo klub sepakbola Barcelona di bagian penutup belakangnya. Kondisi baterai agak lemah dan tombol nomor 7 agak seret saat ditekan.",
  "Cincin perak tersebut berukir inisial nama 'A.F' di bagian lingkar dalamnya. Cincin tersebut adalah kado ulang tahun saya dari orang tua.",
  "Laptop ASUS tersebut memiliki stiker Intel Core i7 di kanan bawah, dan ada goresan kecil berbentuk huruf V di bagian casing luar penutup layarnya."
];

const claimAdminNotes = [
  "Bukti kepemilikan sangat detail dan cocok dengan fisik barang yang diamankan di pos satpam.",
  "Nomor seri yang disebutkan di nota pembelian sesuai dengan yang tertera di barang temuan.",
  "Pemilik menunjukkan foto diri dengan barang tersebut sebelum hilang. Sangat valid.",
  "Foto bukti tanda pengenal (KTM) di dalam dompet terbukti identik dengan KTP pengklaim.",
  "Bukti kurang memadai. Deskripsi ciri khusus gantungan kunci tidak sesuai dengan fisik barang yang diamankan.",
  "Tolak. Pengklaim tidak dapat memberikan deskripsi isi dompet atau ciri fisik yang valid saat dikonfirmasi."
];

const claimImages = [
  "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500", // book/receipt placeholder
  "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=500", // object/receipt
  "https://images.unsplash.com/photo-1589758438368-0ad531db3366?w=500"  // document/proof
];

const itemsByCategory = {
  "Elektronik": [
    { title: "Powerbank Anker 10000mAh", description: "Ditemukan powerbank merk Anker warna hitam di atas meja perpustakaan lantai 2. Kondisi masih menyala, ada goresan tipis di bagian belakang.", image: "https://images.unsplash.com/photo-1609592424089-98e3364f9bfd?w=600" },
    { title: "TWS Xiaomi Redmi Buds 4", description: "Kehilangan TWS Xiaomi Redmi Buds 4 warna putih beserta case-nya di kantin Fakultas Teknik sekitar jam 12 siang. Bagi yang melihat mohon infonya.", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600" },
    { title: "Charger iPhone 20W Original", description: "Ditemukan charger iPhone 20W beserta kabel lightning di musholla Gedung GKB lantai 3. Kondisi kabel agak terkelupas sedikit.", image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600" },
    { title: "Flashdisk SanDisk Ultra 64GB", description: "Ditemukan flashdisk SanDisk 64GB warna merah hitam tertancap di PC Laboratorium Komputer 4. Isinya ada folder 'Tugas Akhir'.", image: "https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?w=600" },
    { title: "Mouse Wireless Logitech M331", description: "Kehilangan mouse wireless Logitech M331 warna abu-abu di area Gazebo Rektorat. Terakhir dipakai pagi hari saat kerja kelompok.", image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600" }
  ],
  "Dokumen & Kartu": [
    { title: "KTM Mahasiswa a.n. Muhammad Rian", description: "Ditemukan Kartu Tanda Mahasiswa (KTM) dengan nama Muhammad Rian, NIM 180403022, di koridor lantai 1 Gedung Dekanat.", image: "https://images.unsplash.com/photo-1589758438368-0ad531db3366?w=600" },
    { title: "KTP a.n. Siti Aminah", description: "Menemukan KTP warga DKI Jakarta atas nama Siti Aminah di dekat area parkir motor luar perpustakaan.", image: "https://images.unsplash.com/photo-1589758438368-0ad531db3366?w=600" },
    { title: "SIM C a.n. Ahmad Fauzi", description: "Ditemukan SIM C atas nama Ahmad Fauzi di area tangga darurat Gedung Kuliah Bersama B.", image: "https://images.unsplash.com/photo-1589758438368-0ad531db3366?w=600" },
    { title: "STNK Motor Yamaha Mio Soul", description: "Kehilangan STNK motor Yamaha Mio Soul dengan nomor polisi B 6789 XYZ. Diperkirakan jatuh di sekitar jalan utama kampus.", image: "https://images.unsplash.com/photo-1589758438368-0ad531db3366?w=600" },
    { title: "Kartu ATM Mandiri Gold", description: "Ditemukan kartu ATM Mandiri warna emas di dekat mesin ATM Center seberang Koperasi Mahasiswa.", image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=600" }
  ],
  "Aksesoris & Perhiasan": [
    { title: "Cincin Perak Permata Biru", description: "Ditemukan cincin perak dengan hiasan permata biru kecil di wastafel toilet wanita Gedung FEB.", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600" },
    { title: "Jam Tangan Casio G-Shock Hitam", description: "Kehilangan jam tangan Casio G-Shock warna hitam doff di lapangan basket luar ruangan. Ada bekas goresan di bagian strap.", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600" },
    { title: "Kacamata Frame Bulat Hitam", description: "Ditemukan kacamata dengan frame bulat warna hitam di bangku halte bus kampus. Lensa terlihat minus tebal.", image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600" },
    { title: "Gelang Manik-Manik Warna-Warni", description: "Menemukan gelang dari manik-manik kayu warna-warni di selasar arah Gedung FISIP.", image: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=600" }
  ],
  "Tas & Dompet": [
    { title: "Dompet Kulit Cokelat Braun Buffel", description: "Ditemukan dompet kulit merk Braun Buffel warna cokelat di koridor lantai dasar FEB. Isinya ada beberapa uang tunai dan kartu identitas.", image: "https://images.unsplash.com/photo-1627124118123-e4d31abb09d0?w=600" },
    { title: "Tas Ransel Eiger Hitam", description: "Kehilangan tas ransel Eiger warna hitam ukuran 25L berisi buku kuliah and binder biru di bangku lobi utama Gedung Ilmu Komputer.", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600" },
    { title: "Pouch Makeup Merah Muda", description: "Ditemukan pouch kosmetik/makeup warna pink dengan gambar kelinci di toilet lantai 2 Gedung Vokasi.", image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600" },
    { title: "Totebag Putih Bahan Kanvas", description: "Ditemukan totebag putih kanvas dengan tulisan 'Save Earth' di area taman lingkar kampus. Isinya botol minum dan jas hujan.", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600" }
  ],
  "Kunci": [
    { title: "Kunci Motor Honda Vario dengan Gantungan", description: "Ditemukan kunci motor Honda Vario beserta gantungan kunci berbentuk boneka Stitch di meja resepsionis perpustakaan.", image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600" },
    { title: "Gantungan Kunci Doraemon + Kunci Rumah", description: "Kehilangan seikat kunci (kunci rumah dan kunci lemari) dengan gantungan karet bergambar Doraemon di area kantin vokasi.", image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600" },
    { title: "Kunci Kosan dengan Tali Lanyard Merah", description: "Menemukan sepasang kunci dengan lanyard merah bertuliskan 'Indonesia' di dekat loket pembayaran administrasi.", image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600" },
    { title: "Kunci Mobil Toyota Hitam", description: "Ditemukan remote kunci mobil Toyota warna hitam di area parkir basement Gedung Pascasarjana.", image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600" }
  ],
  "Buku & Alat Tulis": [
    { title: "Binder Kulit A5 Warna Cokelat", description: "Ditemukan binder kulit A5 warna cokelat di ruang kelas 302 Gedung GKB B. Isinya catatan kuliah metode penelitian.", image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600" },
    { title: "Kotak Pensil Kain Motif Kotak", description: "Kehilangan tempat pensil berbahan kain motif kotak-kotak hitam putih di perpustakaan lantai 3 zona tenang.", image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600" },
    { title: "Buku Catatan Hitam Moleskine", description: "Menemukan buku catatan (notebook) bersampul hitam merk Moleskine di bangku taman depan Gedung Rektorat.", image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600" },
    { title: "Kalkulator Casio FX-991EX Classwiz", description: "Kehilangan kalkulator Casio FX-991EX Classwiz warna hitam di Laboratorium Fisika Dasar setelah praktikum siang.", image: "https://images.unsplash.com/photo-1574634534894-89d7576c8259?w=600" }
  ],
  "Lain-lain": [
    { title: "Payung Lipat Biru Dongker", description: "Ditemukan payung lipat warna biru dongker bermerk Jari-Jari di dekat rak sepatu masjid kampus.", image: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600" },
    { title: "Tumbler Corkcicle Biru Toska", description: "Kehilangan tumbler Corkcicle warna biru toska (turquoise) kapasitas 16oz di ruang seminar Gedung Dekanat.", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600" },
    { title: "Jaket Hoodie Uniqlo Abu-Abu", description: "Ditemukan jaket hoodie Uniqlo warna abu-abu ukuran L di kursi penonton stadion olahraga kampus.", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600" },
    { title: "Jas Almamater Kampus Ukuran L", description: "Menemukan jas almamater kampus ukuran L di ruang rapat BEM Gedung Pusat Kegiatan Mahasiswa.", image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600" }
  ]
};

const locations = [
  "Perpustakaan Pusat Lantai 2",
  "Kantin FEB",
  "Gedung Kuliah Bersama (GKB) A Ruang 102",
  "Masjid Ulul Albab",
  "Lapangan Olahraga Kampus",
  "Laboratorium Informatika 3",
  "Gazebo Rektorat",
  "Halte Bus Kampus Depan",
  "Lobi Utama Gedung Vokasi",
  "Area Parkir Motor FIA",
  "Stadion Utama Universitas",
  "Auditorium Rektorat Lantai 4"
];

async function main() {
  console.log("=== MEMULAI GENERASI DATA DUMMY ===");
  
  // 1. Buat Kategori jika belum ada
  console.log("Menyiapkan kategori...");
  for (const catName of categoriesList) {
    await prismaClient.category.upsert({
      where: { name: catName },
      update: {},
      create: { name: catName }
    });
  }
  const dbCategories = await prismaClient.category.findMany();
  
  // 2. Buat Pengguna jika belum ada
  console.log("Menyiapkan pengguna...");
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  const dummyUsersData = [
    { nim_nip: "100001", name: "Budi Santoso", email: "budi.santoso@ui.ac.id", password: hashedPassword, role: "user", phone_number: "081234567890" },
    { nim_nip: "100002", name: "Ani Lestari", email: "ani.lestari@ui.ac.id", password: hashedPassword, role: "user", phone_number: "081234567891" },
    { nim_nip: "100003", name: "Chandra Wijaya", email: "chandra.wijaya@ui.ac.id", password: hashedPassword, role: "user", phone_number: "081234567892" },
    { nim_nip: "100004", name: "Dewi Sari", email: "dewi.sari@ui.ac.id", password: hashedPassword, role: "user", phone_number: "081234567893" },
    { nim_nip: "100005", name: "Eko Prasetyo", email: "eko.prasetyo@ui.ac.id", password: hashedPassword, role: "user", phone_number: "081234567894" },
    { nim_nip: "100006", name: "Fitri Handayani", email: "fitri.handayani@ui.ac.id", password: hashedPassword, role: "user", phone_number: "081234567895" },
    { nim_nip: "100007", name: "Guntur Wibowo", email: "guntur.wibowo@ui.ac.id", password: hashedPassword, role: "user", phone_number: "081234567896" },
    { nim_nip: "100008", name: "Hendra Wijaya", email: "hendra.wijaya@ui.ac.id", password: hashedPassword, role: "user", phone_number: "081234567897" },
    { nim_nip: "100009", name: "Indah Permata", email: "indah.permata@ui.ac.id", password: hashedPassword, role: "user", phone_number: "081234567898" },
    { nim_nip: "100010", name: "Joko Susilo", email: "joko.susilo@ui.ac.id", password: hashedPassword, role: "user", phone_number: "081234567899" }
  ];

  for (const userData of dummyUsersData) {
    await prismaClient.user.upsert({
      where: { nim_nip: userData.nim_nip },
      update: {},
      create: userData
    });
  }
  const dbUsers = await prismaClient.user.findMany({
    where: { nim_nip: { in: dummyUsersData.map(u => u.nim_nip) } }
  });

  // Buat Admin khusus untuk proses verifikasi
  const adminUserData = {
    nim_nip: "000000",
    name: "Campus Admin",
    email: "admin@lostfound.ac.id",
    password: hashedPassword,
    role: "admin",
    phone_number: "08111222333"
  };
  const dbAdmin = await prismaClient.user.upsert({
    where: { nim_nip: adminUserData.nim_nip },
    update: {},
    create: adminUserData
  });

  // 3. Hapus data lama agar database bersih
  console.log("Membersihkan data klaim lama...");
  await prismaClient.claim.deleteMany({});
  
  console.log("Membersihkan item dummy lama (judul mengandung #)...");
  await prismaClient.item.deleteMany({
    where: { title: { contains: "#" } }
  });

  // 4. Generate 100 Item
  console.log("Membuat 100 item baru...");
  const itemTypes = ["lost", "found"];
  const categoryNames = Object.keys(itemsByCategory);

  const itemsToCreate = [];
  for (let i = 1; i <= 100; i++) {
    const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
    const catName = categoryNames[Math.floor(Math.random() * categoryNames.length)];
    const templates = itemsByCategory[catName];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    const dbCat = dbCategories.find(c => c.name === catName);
    const dbUser = dbUsers[Math.floor(Math.random() * dbUsers.length)];
    
    const title = `${type === "lost" ? "[HILANG]" : "[TEMUAN]"} ${template.title} #${i}`;
    const description = `${template.description} (Urutan Laporan #${i} - Harap hubungi jika merasa memiliki/melihat).`;
    const location = locations[Math.floor(Math.random() * locations.length)];
    
    const dateLimit = 30 * 24 * 60 * 60 * 1000;
    const dateTime = new Date(Date.now() - Math.floor(Math.random() * dateLimit));
    const createdAt = new Date(dateTime.getTime() + 60 * 60 * 1000);
    
    let status;
    if (type === "lost") {
      // Hilang: searching atau resolved
      status = Math.random() > 0.20 ? "searching" : "resolved";
    } else {
      // Temuan: pending_verification, available, atau returned (nanti terupdate oleh approved claim)
      status = Math.random() > 0.20 ? "available" : "pending_verification";
    }
    
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const imagePath = template.image;
    
    itemsToCreate.push({
      user_id: dbUser.id,
      category_id: dbCat.id,
      type: type,
      title: title,
      slug: slug,
      description: description,
      location: location,
      date_time: dateTime,
      status: status,
      image_path: imagePath,
      created_at: createdAt,
      updated_at: createdAt
    });
  }

  // Masukkan item ke database
  const createdItems = [];
  for (const itemData of itemsToCreate) {
    const item = await prismaClient.item.create({ data: itemData });
    createdItems.push(item);
  }
  console.log(`Berhasil membuat ${createdItems.length} item.`);

  // 5. Tambahkan Boosts & Diskusi secara acak
  console.log("Menambahkan dukungan (boosts) dan tanggapan (diskusi) secara acak...");
  for (const item of createdItems) {
    const numBoosts = Math.floor(Math.random() * 8);
    const shuffledUsers = [...dbUsers].sort(() => 0.5 - Math.random());
    const boostUsers = shuffledUsers.slice(0, numBoosts);

    for (const bUser of boostUsers) {
      await prismaClient.boost.create({
        data: {
          item_id: item.id,
          user_id: bUser.id
        }
      }).catch(() => {});
    }

    const numComments = Math.floor(Math.random() * 4);
    for (let c = 0; c < numComments; c++) {
      const commentUser = dbUsers[Math.floor(Math.random() * dbUsers.length)];
      const text = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];
      
      await prismaClient.comment.create({
        data: {
          item_id: item.id,
          user_id: commentUser.id,
          text: text
        }
      });
    }
  }

  // 6. Tambahkan Klaim secara acak untuk barang temuan (found)
  console.log("Menambahkan klaim (claims) untuk barang temuan secara acak...");
  const foundItems = createdItems.filter(item => item.type === "found");
  
  for (const item of foundItems) {
    // 45% peluang barang temuan mendapat klaim
    if (Math.random() > 0.45) continue;

    // Pilih user pengklaim secara acak (selain pembuat postingan temuan)
    const eligibleClaimants = dbUsers.filter(u => u.id !== item.user_id);
    if (eligibleClaimants.length === 0) continue;
    const claimant = eligibleClaimants[Math.floor(Math.random() * eligibleClaimants.length)];

    // Susun deskripsi bukti kepemilikan (buat panjang agar memicu 'Lihat Selengkapnya')
    const proofDesc = claimProofTemplates[Math.floor(Math.random() * claimProofTemplates.length)] + 
      " Laporan pengajuan klaim ini disimulasikan secara otomatis menggunakan database seeder untuk menguji keselarasan antarmuka, limitasi pemotongan teks deskripsi bukti, serta tampilan foto lampiran pendukung.";

    // Opsional foto bukti
    const hasImage = Math.random() > 0.40;
    const proofImage = hasImage ? claimImages[Math.floor(Math.random() * claimImages.length)] : null;

    // Tentukan status klaim secara acak
    const randStatus = Math.random();
    let claimStatus = "pending";
    let adminNotes = null;
    let processedById = null;
    let processedAt = null;

    if (randStatus < 0.40) {
      claimStatus = "approved";
      adminNotes = claimAdminNotes[Math.floor(Math.random() * 4)];
      processedById = dbAdmin.id;
      processedAt = new Date();
      
      // Jika klaim approved, ubah status barang temuan tersebut menjadi 'returned'
      await prismaClient.item.update({
        where: { id: item.id },
        data: { status: "returned" }
      });
    } else if (randStatus < 0.70) {
      claimStatus = "rejected";
      adminNotes = claimAdminNotes[4 + Math.floor(Math.random() * 2)];
      processedById = dbAdmin.id;
      processedAt = new Date();
    }

    await prismaClient.claim.create({
      data: {
        item_id: item.id,
        user_id: claimant.id,
        proof_description: proofDesc,
        proof_image_path: proofImage,
        status: claimStatus,
        admin_notes: adminNotes,
        processed_by_id: processedById,
        processed_at: processedAt
      }
    }).catch(() => {});
  }

  // 7. Bersihkan Redis cache agar data baru langsung terdeteksi
  console.log("Membersihkan Redis cache...");
  if (redisClient.flushAll && typeof redisClient.flushAll === 'function') {
    await redisClient.flushAll();
    console.log("Redis cache berhasil dikosongkan.");
  } else {
    let cursor = '0';
    do {
      const reply = await redisClient.scan(cursor, { MATCH: 'items:*', COUNT: 100 });
      cursor = reply.cursor;
      if (reply.keys.length > 0) {
        await redisClient.del(reply.keys);
      }
    } while (cursor !== '0');
    console.log("Redis cache manual berhasil dikosongkan.");
  }

  console.log("=== GENERASI DATA DUMMY SELESAI DENGAN SUKSES ===");
}

main()
  .catch((e) => {
    console.error("Terjadi error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
    process.exit(0);
  });
