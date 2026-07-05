export type Dars = {
  id: string;
  title: string;
  duration_minutes: number;
  order_index: number;
  /** YouTube video ID (unlisted di produksi, placeholder di mock) */
  youtube_id: string;
};

export type Module = {
  id: string;
  title: string;
  order_index: number;
  dars: Dars[];
};

export type MockClass = {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  base_price: number;
  discount_price: number | null;
  status: 'published' | 'draft';
  instructor: {
    name: string;
    bio: string;
    photo_url: string;
  };
  modules: Module[];
};

export const MOCK_CLASSES: MockClass[] = [
  {
    id: 'fiqih-thaharah',
    title: 'Fiqih Thaharah: Dari Dasar Hingga Mahir',
    description:
      'Kelas ini membahas tuntas bab thaharah (bersuci) mulai dari pengertian najis, jenis-jenis air, wudhu, tayamum, hingga mandi wajib. Setiap pembahasan disertai dalil shahih dan praktik langsung agar dapat diamalkan dalam kehidupan sehari-hari.',
    cover_image:
      'https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&q=80&w=800&h=500',
    base_price: 299000,
    discount_price: 149000,
    status: 'published',
    instructor: {
      name: 'Ustadz Ahmad Zainuddin, Lc.',
      bio: 'Lulusan Universitas Al-Azhar Kairo, spesialisasi Fiqih dan Ushul Fiqih. Aktif mengajar di pesantren dan kajian online sejak 2015.',
      photo_url: 'https://ui-avatars.com/api/?name=Ahmad+Zainuddin&background=166534&color=fff&size=128',
    },
    modules: [
      {
        id: 'mod-th-1',
        title: 'Pengantar: Konsep Thaharah dalam Islam',
        order_index: 1,
        dars: [
          { id: 'd-th-1-1', title: 'Pengertian Thaharah dan Urgensinya', duration_minutes: 18, order_index: 1 , youtube_id: 'jNQXAC9IVRw' },
          { id: 'd-th-1-2', title: 'Pembagian Air dan Hukumnya', duration_minutes: 22, order_index: 2 , youtube_id: 'dQw4w9WgXcQ' },
          { id: 'd-th-1-3', title: 'Macam-Macam Najis dan Cara Menyucikan', duration_minutes: 25, order_index: 3 , youtube_id: '_OBlgSz8sSM' },
        ],
      },
      {
        id: 'mod-th-2',
        title: 'Wudhu: Rukun, Syarat, dan Pembatal',
        order_index: 2,
        dars: [
          { id: 'd-th-2-1', title: 'Rukun-Rukun Wudhu', duration_minutes: 30, order_index: 1 , youtube_id: 'kJQP7kiw5Fk' },
          { id: 'd-th-2-2', title: 'Sunah-Sunah Wudhu', duration_minutes: 20, order_index: 2 , youtube_id: 'jNQXAC9IVRw' },
          { id: 'd-th-2-3', title: 'Perkara yang Membatalkan Wudhu', duration_minutes: 28, order_index: 3 , youtube_id: 'dQw4w9WgXcQ' },
          { id: 'd-th-2-4', title: 'Praktik Wudhu yang Benar', duration_minutes: 15, order_index: 4 , youtube_id: '_OBlgSz8sSM' },
        ],
      },
      {
        id: 'mod-th-3',
        title: 'Tayamum dan Mandi Wajib',
        order_index: 3,
        dars: [
          { id: 'd-th-3-1', title: 'Sebab dan Tata Cara Tayamum', duration_minutes: 24, order_index: 1 , youtube_id: 'kJQP7kiw5Fk' },
          { id: 'd-th-3-2', title: 'Penyebab Mandi Wajib (Hadats Besar)', duration_minutes: 22, order_index: 2 , youtube_id: 'jNQXAC9IVRw' },
          { id: 'd-th-3-3', title: 'Rukun dan Tata Cara Mandi Wajib', duration_minutes: 26, order_index: 3 , youtube_id: 'dQw4w9WgXcQ' },
        ],
      },
      {
        id: 'mod-th-4',
        title: 'Studi Kasus Kontemporer',
        order_index: 4,
        dars: [
          { id: 'd-th-4-1', title: 'Thaharah di Fasilitas Umum Modern', duration_minutes: 20, order_index: 1 , youtube_id: '_OBlgSz8sSM' },
          { id: 'd-th-4-2', title: 'Soal Jawab: Pertanyaan Umum Seputar Thaharah', duration_minutes: 35, order_index: 2 , youtube_id: 'kJQP7kiw5Fk' },
        ],
      },
    ],
  },
  {
    id: 'fiqih-shalat',
    title: 'Fiqih Shalat: Kajian Mendalam & Kontemporer',
    description:
      'Kajian mendalam tentang shalat mulai dari syarat sah, rukun, hingga persoalan kontemporer: shalat di pesawat, shalat musafir, jamak-qashar, dan shalat orang sakit. Dirancang untuk mereka yang ingin memahami shalat bukan sekadar menghafal gerakannya.',
    cover_image:
      'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&q=80&w=800&h=500',
    base_price: 349000,
    discount_price: null,
    status: 'published',
    instructor: {
      name: 'Ustadz Muhammad Ihsan, M.Ag.',
      bio: 'Magister Studi Islam UIN Jakarta. Pengajar di beberapa lembaga kajian Islam dan penulis buku fiqih praktis.',
      photo_url: 'https://ui-avatars.com/api/?name=Muhammad+Ihsan&background=166534&color=fff&size=128',
    },
    modules: [
      {
        id: 'mod-sh-1',
        title: 'Fondasi Shalat dalam Al-Quran dan Sunnah',
        order_index: 1,
        dars: [
          { id: 'd-sh-1-1', title: 'Kewajiban Shalat dan Dalilnya', duration_minutes: 20, order_index: 1 , youtube_id: 'jNQXAC9IVRw' },
          { id: 'd-sh-1-2', title: 'Syarat Wajib dan Syarat Sah Shalat', duration_minutes: 28, order_index: 2 , youtube_id: 'dQw4w9WgXcQ' },
        ],
      },
      {
        id: 'mod-sh-2',
        title: 'Rukun Shalat: Dari Takbir hingga Salam',
        order_index: 2,
        dars: [
          { id: 'd-sh-2-1', title: 'Takbiratul Ihram dan Niat', duration_minutes: 22, order_index: 1 , youtube_id: '_OBlgSz8sSM' },
          { id: 'd-sh-2-2', title: 'Bacaan-Bacaan dalam Shalat', duration_minutes: 30, order_index: 2 , youtube_id: 'kJQP7kiw5Fk' },
          { id: 'd-sh-2-3', title: 'Ruku, Sujud, dan Tasyahud', duration_minutes: 25, order_index: 3 , youtube_id: 'jNQXAC9IVRw' },
        ],
      },
      {
        id: 'mod-sh-3',
        title: 'Shalat Jamak, Qashar, dan Musafir',
        order_index: 3,
        dars: [
          { id: 'd-sh-3-1', title: 'Ketentuan Musafir dalam Fiqih', duration_minutes: 24, order_index: 1 , youtube_id: 'dQw4w9WgXcQ' },
          { id: 'd-sh-3-2', title: 'Tata Cara Jamak dan Qashar', duration_minutes: 27, order_index: 2 , youtube_id: '_OBlgSz8sSM' },
          { id: 'd-sh-3-3', title: 'Shalat di Pesawat dan Kendaraan', duration_minutes: 19, order_index: 3 , youtube_id: 'kJQP7kiw5Fk' },
        ],
      },
      {
        id: 'mod-sh-4',
        title: 'Fiqih Shalat untuk Kondisi Khusus',
        order_index: 4,
        dars: [
          { id: 'd-sh-4-1', title: 'Shalat Orang Sakit dan Cara-Caranya', duration_minutes: 22, order_index: 1 , youtube_id: 'jNQXAC9IVRw' },
          { id: 'd-sh-4-2', title: 'Qadha Shalat yang Terlewat', duration_minutes: 20, order_index: 2 , youtube_id: 'dQw4w9WgXcQ' },
        ],
      },
    ],
  },
  {
    id: 'fiqih-puasa',
    title: 'Fiqih Puasa Ramadhan & Puasa Sunnah',
    description:
      'Panduan lengkap puasa Ramadhan dan puasa sunnah: rukun, syarat, hal yang membatalkan, fidyah, kaffarah, hingga adab dan hikmah puasa. Dilengkapi pembahasan khusus untuk ibu hamil, musafir, dan orang yang bekerja berat.',
    cover_image:
      'https://images.unsplash.com/photo-1532634993-15f421e42ec0?auto=format&fit=crop&q=80&w=800&h=500',
    base_price: 279000,
    discount_price: 179000,
    status: 'published',
    instructor: {
      name: 'Ustadz Ahmad Zainuddin, Lc.',
      bio: 'Lulusan Universitas Al-Azhar Kairo, spesialisasi Fiqih dan Ushul Fiqih. Aktif mengajar di pesantren dan kajian online sejak 2015.',
      photo_url: 'https://ui-avatars.com/api/?name=Ahmad+Zainuddin&background=166534&color=fff&size=128',
    },
    modules: [
      {
        id: 'mod-pu-1',
        title: 'Pengantar Puasa dalam Islam',
        order_index: 1,
        dars: [
          { id: 'd-pu-1-1', title: 'Keutamaan dan Hikmah Puasa', duration_minutes: 18, order_index: 1 , youtube_id: '_OBlgSz8sSM' },
          { id: 'd-pu-1-2', title: 'Rukun dan Syarat Sah Puasa', duration_minutes: 22, order_index: 2 , youtube_id: 'kJQP7kiw5Fk' },
        ],
      },
      {
        id: 'mod-pu-2',
        title: 'Hal-Hal yang Membatalkan Puasa',
        order_index: 2,
        dars: [
          { id: 'd-pu-2-1', title: 'Pembatal Puasa yang Disepakati', duration_minutes: 25, order_index: 1 , youtube_id: 'jNQXAC9IVRw' },
          { id: 'd-pu-2-2', title: 'Persoalan Kontemporer: Suntik, Inhaler, Dll.', duration_minutes: 28, order_index: 2 , youtube_id: 'dQw4w9WgXcQ' },
          { id: 'd-pu-2-3', title: 'Kaffarah dan Fidyah', duration_minutes: 20, order_index: 3 , youtube_id: '_OBlgSz8sSM' },
        ],
      },
      {
        id: 'mod-pu-3',
        title: 'Puasa untuk Kondisi Khusus',
        order_index: 3,
        dars: [
          { id: 'd-pu-3-1', title: 'Puasa bagi Ibu Hamil dan Menyusui', duration_minutes: 22, order_index: 1 , youtube_id: 'kJQP7kiw5Fk' },
          { id: 'd-pu-3-2', title: 'Puasa bagi Musafir dan Orang Sakit', duration_minutes: 20, order_index: 2 , youtube_id: 'jNQXAC9IVRw' },
        ],
      },
      {
        id: 'mod-pu-4',
        title: 'Puasa-Puasa Sunnah',
        order_index: 4,
        dars: [
          { id: 'd-pu-4-1', title: 'Puasa Senin-Kamis dan Ayyamul Bidh', duration_minutes: 18, order_index: 1 , youtube_id: 'dQw4w9WgXcQ' },
          { id: 'd-pu-4-2', title: 'Puasa Syawal, Arafah, dan Asyura', duration_minutes: 22, order_index: 2 , youtube_id: '_OBlgSz8sSM' },
        ],
      },
    ],
  },
  {
    id: 'fiqih-zakat',
    title: 'Fiqih Zakat: Hitung, Bayar, dan Optimalkan',
    description:
      'Belajar fiqih zakat secara praktis: zakat fitrah, zakat maal, zakat profesi, dan zakat perusahaan. Dilengkapi cara menghitung nisab dan haul, distribusi kepada 8 asnaf, serta perbedaan pendapat ulama kontemporer.',
    cover_image:
      'https://images.unsplash.com/photo-1579621970795-87facc2f976d?auto=format&fit=crop&q=80&w=800&h=500',
    base_price: 199000,
    discount_price: null,
    status: 'published',
    instructor: {
      name: 'Ustadz Farid Hamzah, Lc., M.E.I.',
      bio: 'Spesialis Fiqih Muamalah dan Ekonomi Islam. Konsultan lembaga zakat dan wakaf nasional.',
      photo_url: 'https://ui-avatars.com/api/?name=Farid+Hamzah&background=166534&color=fff&size=128',
    },
    modules: [
      {
        id: 'mod-zk-1',
        title: 'Dasar-Dasar Zakat dalam Islam',
        order_index: 1,
        dars: [
          { id: 'd-zk-1-1', title: 'Pengertian, Dalil, dan Hikmah Zakat', duration_minutes: 20, order_index: 1 , youtube_id: 'kJQP7kiw5Fk' },
          { id: 'd-zk-1-2', title: 'Syarat Wajib Zakat', duration_minutes: 18, order_index: 2 , youtube_id: 'jNQXAC9IVRw' },
          { id: 'd-zk-1-3', title: 'Delapan Golongan Penerima Zakat', duration_minutes: 24, order_index: 3 , youtube_id: 'dQw4w9WgXcQ' },
        ],
      },
      {
        id: 'mod-zk-2',
        title: 'Zakat Fitrah dan Zakat Maal',
        order_index: 2,
        dars: [
          { id: 'd-zk-2-1', title: 'Ketentuan dan Tata Cara Zakat Fitrah', duration_minutes: 22, order_index: 1 , youtube_id: '_OBlgSz8sSM' },
          { id: 'd-zk-2-2', title: 'Zakat Emas, Perak, dan Uang', duration_minutes: 25, order_index: 2 , youtube_id: 'kJQP7kiw5Fk' },
          { id: 'd-zk-2-3', title: 'Zakat Perdagangan dan Investasi', duration_minutes: 28, order_index: 3 , youtube_id: 'jNQXAC9IVRw' },
        ],
      },
      {
        id: 'mod-zk-3',
        title: 'Zakat Profesi & Kontemporer',
        order_index: 3,
        dars: [
          { id: 'd-zk-3-1', title: 'Dalil dan Kontroversi Zakat Profesi', duration_minutes: 26, order_index: 1 , youtube_id: 'dQw4w9WgXcQ' },
          { id: 'd-zk-3-2', title: 'Cara Menghitung Zakat Profesi', duration_minutes: 20, order_index: 2 , youtube_id: '_OBlgSz8sSM' },
        ],
      },
    ],
  },
  {
    id: 'fiqih-muamalah',
    title: 'Fiqih Muamalah: Jual Beli, Akad & Riba',
    description:
      'Memahami prinsip dasar muamalah Islami: akad jual beli yang sah dan yang dilarang, bunga bank, cicilan, asuransi, dan investasi dalam kacamata fiqih. Sangat relevan bagi profesional muda, pengusaha, dan siapa saja yang ingin bermuamalah sesuai syariat.',
    cover_image:
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800&h=500',
    base_price: 399000,
    discount_price: 249000,
    status: 'published',
    instructor: {
      name: 'Ustadz Farid Hamzah, Lc., M.E.I.',
      bio: 'Spesialis Fiqih Muamalah dan Ekonomi Islam. Konsultan lembaga zakat dan wakaf nasional.',
      photo_url: 'https://ui-avatars.com/api/?name=Farid+Hamzah&background=166534&color=fff&size=128',
    },
    modules: [
      {
        id: 'mod-mu-1',
        title: 'Prinsip-Prinsip Muamalah dalam Islam',
        order_index: 1,
        dars: [
          { id: 'd-mu-1-1', title: 'Kaidah Dasar Muamalah', duration_minutes: 22, order_index: 1 , youtube_id: 'kJQP7kiw5Fk' },
          { id: 'd-mu-1-2', title: 'Rukun dan Syarat Akad', duration_minutes: 20, order_index: 2 , youtube_id: 'jNQXAC9IVRw' },
        ],
      },
      {
        id: 'mod-mu-2',
        title: 'Jual Beli yang Sah dan yang Dilarang',
        order_index: 2,
        dars: [
          { id: 'd-mu-2-1', title: 'Jual Beli yang Disepakati Boleh', duration_minutes: 25, order_index: 1 , youtube_id: 'dQw4w9WgXcQ' },
          { id: 'd-mu-2-2', title: 'Jual Beli yang Dilarang: Gharar dan Maysir', duration_minutes: 28, order_index: 2 , youtube_id: '_OBlgSz8sSM' },
          { id: 'd-mu-2-3', title: 'Riba: Jenis, Sebab, dan Larangan', duration_minutes: 32, order_index: 3 , youtube_id: 'kJQP7kiw5Fk' },
        ],
      },
      {
        id: 'mod-mu-3',
        title: 'Keuangan Kontemporer dalam Fiqih',
        order_index: 3,
        dars: [
          { id: 'd-mu-3-1', title: 'Bunga Bank: Riba atau Bukan?', duration_minutes: 30, order_index: 1 , youtube_id: 'jNQXAC9IVRw' },
          { id: 'd-mu-3-2', title: 'Asuransi dalam Pandangan Fiqih', duration_minutes: 25, order_index: 2 , youtube_id: 'dQw4w9WgXcQ' },
          { id: 'd-mu-3-3', title: 'Investasi Saham dan Reksa Dana Syariah', duration_minutes: 27, order_index: 3 , youtube_id: '_OBlgSz8sSM' },
        ],
      },
      {
        id: 'mod-mu-4',
        title: 'Akad-Akad Keuangan Islam',
        order_index: 4,
        dars: [
          { id: 'd-mu-4-1', title: 'Mudharabah dan Musyarakah', duration_minutes: 24, order_index: 1 , youtube_id: 'kJQP7kiw5Fk' },
          { id: 'd-mu-4-2', title: 'Murabahah, Ijarah, dan Istishna', duration_minutes: 26, order_index: 2 , youtube_id: 'jNQXAC9IVRw' },
        ],
      },
    ],
  },
  {
    id: 'fiqih-nikah',
    title: 'Fiqih Nikah: Persiapan Menuju Pernikahan Islami',
    description:
      'Kelas komprehensif tentang fiqih pernikahan: syarat rukun nikah, hak dan kewajiban suami-istri, mahar, wali, saksi, walimah, hingga persoalan perceraian dan idah. Dirancang untuk calon pengantin, pasangan muda, dan siapa saja yang ingin membangun keluarga sakinah.',
    cover_image:
      'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?auto=format&fit=crop&q=80&w=800&h=500',
    base_price: 329000,
    discount_price: null,
    status: 'published',
    instructor: {
      name: 'Ustadz Muhammad Ihsan, M.Ag.',
      bio: 'Magister Studi Islam UIN Jakarta. Pengajar di beberapa lembaga kajian Islam dan penulis buku fiqih praktis.',
      photo_url: 'https://ui-avatars.com/api/?name=Muhammad+Ihsan&background=166534&color=fff&size=128',
    },
    modules: [
      {
        id: 'mod-nk-1',
        title: 'Hukum dan Hikmah Pernikahan dalam Islam',
        order_index: 1,
        dars: [
          { id: 'd-nk-1-1', title: 'Pengertian, Dalil, dan Hukum Menikah', duration_minutes: 22, order_index: 1 , youtube_id: 'dQw4w9WgXcQ' },
          { id: 'd-nk-1-2', title: 'Tujuan dan Hikmah Pernikahan', duration_minutes: 18, order_index: 2 , youtube_id: '_OBlgSz8sSM' },
        ],
      },
      {
        id: 'mod-nk-2',
        title: 'Rukun dan Syarat Sah Pernikahan',
        order_index: 2,
        dars: [
          { id: 'd-nk-2-1', title: 'Rukun Nikah: Calon Suami, Istri, Wali', duration_minutes: 25, order_index: 1 , youtube_id: 'kJQP7kiw5Fk' },
          { id: 'd-nk-2-2', title: 'Saksi Nikah dan Ijab Qabul', duration_minutes: 20, order_index: 2 , youtube_id: 'jNQXAC9IVRw' },
          { id: 'd-nk-2-3', title: 'Mahar: Ketentuan dan Jenisnya', duration_minutes: 22, order_index: 3 , youtube_id: 'dQw4w9WgXcQ' },
        ],
      },
      {
        id: 'mod-nk-3',
        title: 'Hak dan Kewajiban dalam Rumah Tangga',
        order_index: 3,
        dars: [
          { id: 'd-nk-3-1', title: 'Hak dan Kewajiban Suami', duration_minutes: 24, order_index: 1 , youtube_id: '_OBlgSz8sSM' },
          { id: 'd-nk-3-2', title: 'Hak dan Kewajiban Istri', duration_minutes: 24, order_index: 2 , youtube_id: 'kJQP7kiw5Fk' },
          { id: 'd-nk-3-3', title: 'Nafkah: Standar dan Ketentuannya', duration_minutes: 20, order_index: 3 , youtube_id: 'jNQXAC9IVRw' },
        ],
      },
      {
        id: 'mod-nk-4',
        title: 'Talak, Idah, dan Rujuk',
        order_index: 4,
        dars: [
          { id: 'd-nk-4-1', title: 'Jenis-Jenis Talak dan Hukumnya', duration_minutes: 26, order_index: 1 , youtube_id: 'dQw4w9WgXcQ' },
          { id: 'd-nk-4-2', title: 'Idah dan Ketentuannya', duration_minutes: 22, order_index: 2 , youtube_id: '_OBlgSz8sSM' },
          { id: 'd-nk-4-3', title: 'Rujuk: Hukum dan Tata Caranya', duration_minutes: 18, order_index: 3 , youtube_id: 'kJQP7kiw5Fk' },
        ],
      },
    ],
  },
];

// Only published classes appear in catalog
export const PUBLISHED_CLASSES = MOCK_CLASSES.filter((c) => c.status === 'published');

// Get class by ID
export function getClassById(id: string): MockClass | undefined {
  return MOCK_CLASSES.find((c) => c.id === id);
}

// Format IDR price
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Count total dars in a class
export function countTotalDars(cls: MockClass): number {
  return cls.modules.reduce((sum, m) => sum + m.dars.length, 0);
}

// Count total duration (minutes)
export function countTotalDuration(cls: MockClass): number {
  return cls.modules.reduce(
    (sum, m) => sum + m.dars.reduce((s, d) => s + d.duration_minutes, 0),
    0
  );
}
