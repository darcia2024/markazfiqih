import { motion } from 'framer-motion';
import {
  BookOpen,
  ShieldCheck,
  Award,
  Users,
  Infinity as InfinityIcon,
  HandHeart,
  CheckCircle2,
} from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// ────────────────────────────────────────────────────────────────────────────
// Data statis — Prompt 129: konten profil lembaga lengkap, sudah final,
// dipakai PERSIS sesuai naskah yang disiapkan (jangan improvisasi ulang).
// ────────────────────────────────────────────────────────────────────────────

const PROFIL_LEMBAGA: { label: string; value: string }[] = [
  { label: 'Nama Lembaga', value: 'Markaz Fiqih' },
  { label: 'Jenis Lembaga', value: 'Lembaga Keilmuan' },
  { label: 'Bidang Fokus', value: 'Fiqih dan ilmu-ilmu pendukungnya' },
  {
    label: 'Ruang Lingkup Kegiatan',
    value: 'Pendidikan, Publikasi, Kaderisasi, dan Pengembangan Keilmuan',
  },
  { label: 'Sifat Kegiatan', value: 'Online dan Offline' },
  { label: 'Kedudukan', value: 'Indonesia' },
];

const MISI = [
  { number: '01', text: 'Menyebarkan ilmu fiqih yang shahih dan mudah dipahami.' },
  { number: '02', text: 'Menyediakan sarana belajar fiqih yang terstruktur dan berkelanjutan.' },
  { number: '03', text: 'Melahirkan pengajar dan kader fiqih yang kompeten.' },
  { number: '04', text: 'Mengembangkan media edukasi fiqih berbasis teknologi.' },
  { number: '05', text: 'Menjadi pusat rujukan fiqih yang terpercaya.' },
];

const NILAI_DASAR = [
  { label: 'Keilmuan', icon: BookOpen },
  { label: 'Amanah', icon: ShieldCheck },
  { label: 'Profesionalisme', icon: Award },
  { label: 'Kolaborasi', icon: Users },
  { label: 'Keberlanjutan', icon: InfinityIcon },
  { label: 'Pelayan Umat', icon: HandHeart },
];

// Sama persis dengan METHOD_REFERENCES di LandingPage.tsx (duplikat konten +
// styling secukupnya di sini, bukan import, sesuai instruksi Prompt 129).
const METHOD_REFERENCES = [
  { number: '01', text: 'Pendapat mu\u2019tamad dalam madzhab Syafi\u2019i' },
  { number: '02', text: 'Pendapat dha\u2019if dalam madzhab Syafi\u2019i' },
  { number: '03', text: 'Ikhtiyar para ulama madzhab Syafi\u2019i' },
  {
    number: '04',
    text: 'Pendapat mu\u2019tabar dari madzhab-madzhab fiqih lainnya (khususnya empat madzhab)',
  },
];

const KARAKTERISTIK = [
  'Referentif: berbasis turats dan literatur klasik.',
  'Edukatif dan kritis.',
  'Disajikan secara sistematis dan mudah dipahami.',
  'Memanfaatkan teknologi digital.',
  'Berorientasi pada kaderisasi.',
  'Mengintegrasikan pendidikan, publikasi, dan pengembangan SDM.',
];

const BIDANG_KEGIATAN: { kategori: string; items: string[] }[] = [
  {
    kategori: 'Pendidikan',
    items: ['Kelas Fiqih Tematik', 'Kelas Kitab', 'Webinar', 'Akademi Markaz Fiqih', "Ma'had Markaz Fiqih"],
  },
  {
    kategori: 'Publikasi',
    items: ['Artikel', 'Buku', 'Modul', 'Ebook'],
  },
  {
    kategori: 'Media Platform',
    items: ['Website', 'Media sosial (Instagram, Facebook, TikTok, YouTube)'],
  },
  {
    kategori: 'Kaderisasi',
    items: ['Akademi Markaz Fiqih', "Ma'had Markaz Fiqih"],
  },
  {
    kategori: 'Riset dan Pengembangan',
    items: ['Penyusunan kurikulum sekolah', 'Penelitian fiqih', 'Kajian isu kontemporer'],
  },
];

const SASARAN = ['Masyarakat', 'Pelajar dan Mahasiswa', 'Guru dan Pengajar', "Da'i"];

const CITA_CITA_ARAH = [
  'Akademi Markaz Fiqih',
  "Ma'had Markaz Fiqih",
  'Pusat kajian fiqih',
  'Program spesialisasi fiqih',
  'Penerbitan karya ilmiah dan buku',
];

const ROADMAP_FASE = [
  { number: 1, label: 'Media edukasi dan Kelas online', done: true },
  { number: 2, label: 'Akademi Markaz Fiqih', done: false },
  { number: 3, label: 'Penerbitan dan Publikasi Ilmiah', done: false },
  { number: 4, label: "Ma'had Markaz Fiqih", done: false },
  { number: 5, label: 'Pusat Kajian dan Jaringan Nasional', done: false },
];

// ────────────────────────────────────────────────────────────────────────────
// Helper kecil — section wrapper konsisten (spacing & fade-in seragam)
// ────────────────────────────────────────────────────────────────────────────
function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-semibold tracking-wider uppercase mb-3"
      style={{ color: 'hsl(var(--accent))' }}
    >
      {children}
    </p>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Konten utama halaman
// ────────────────────────────────────────────────────────────────────────────
function AboutUsContent() {
  return (
    <AppShell>
      {/* 1. Hero singkat */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8 pb-2 shrink-0">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--accent))] mb-2">
            Tentang Kami
          </p>
          <h1 className="font-serif text-3xl lg:text-4xl font-bold text-foreground">
            Tentang Kami: Kelas Markaz Fiqih
          </h1>
          <p className="font-serif text-lg italic text-primary mt-3">
            &ldquo;Membumikan fiqih dalam tiap lini masyarakat.&rdquo;
          </p>
        </motion.div>
      </div>

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-8 lg:py-10 space-y-14">
        {/* 2. Profil Lembaga */}
        <Section>
          <div className="bg-card border rounded-2xl p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {PROFIL_LEMBAGA.map((row) => (
                <div key={row.label}>
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="font-medium text-foreground mt-0.5">{row.value}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mt-6 pt-5 border-t">
              Markaz Fiqih bukan organisasi massa, bukan lembaga fatwa resmi, dan bukan
              lembaga amal sosial — merupakan lembaga keilmuan independen yang berfokus pada
              pendidikan, publikasi, kaderisasi, dan pengembangan kajian fiqih.
            </p>
          </div>
        </Section>

        {/* 3. Latar Belakang */}
        <Section>
          <SectionLabel>Latar Belakang</SectionLabel>
          <div className="space-y-4 text-foreground/90 text-base leading-relaxed">
            <p>
              Fiqih merupakan salah satu disiplin ilmu terpenting dalam Islam yang mengatur
              berbagai aspek kehidupan seorang muslim. Namun, kebutuhan masyarakat terhadap
              pembelajaran fiqih yang sistematis, mudah diakses, dan sesuai kebutuhan zaman
              masih sangat besar.
            </p>
            <p>
              Markaz Fiqih didirikan sebagai pusat keilmuan yang berupaya menjembatani
              kebutuhan tersebut melalui pendidikan, publikasi, kaderisasi, dan pengembangan
              sumber daya manusia yang memiliki kompetensi di bidang fiqih.
            </p>
          </div>
        </Section>

        {/* 4. Visi */}
        <Section>
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'hsl(var(--brand-gold-pale))' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--accent))] mb-3">
              Visi
            </p>
            <p className="font-serif text-xl sm:text-2xl font-bold text-foreground leading-snug max-w-2xl mx-auto">
              Menjadi pusat rujukan fiqih berbasis turats berdasarkan madzhab Syafi'i yang
              menghadirkan pendidikan, publikasi, dan kaderisasi secara sistematis bagi
              masyarakat Indonesia.
            </p>
          </div>
        </Section>

        {/* 5. Misi */}
        <Section>
          <SectionLabel>Misi</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {MISI.map((item) => (
              <div
                key={item.number}
                className="relative overflow-hidden bg-card border rounded-2xl p-6 flex flex-col"
              >
                <p
                  className="font-serif text-5xl font-bold leading-none select-none"
                  style={{ color: 'hsl(var(--primary) / 0.1)' }}
                >
                  {item.number}
                </p>
                <p className="text-sm text-foreground leading-relaxed mt-4">{item.text}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 6. Nilai Dasar */}
        <Section>
          <SectionLabel>Nilai Dasar</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {NILAI_DASAR.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="bg-card border rounded-xl p-4 text-center flex flex-col items-center gap-2"
                >
                  <Icon className="w-5 h-5 text-primary" />
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                </div>
              );
            })}
          </div>
        </Section>

        {/* 7. Metode Keilmuan */}
        <Section>
          <SectionLabel>Metode Keilmuan</SectionLabel>
          <div className="space-y-4 text-foreground/90 text-base leading-relaxed">
            <p>
              Berbasis fiqih madzhab Syafi'i yang solutif, dengan tetap memberikan ruang
              keterbukaan terhadap pendapat madzhab lain selama termasuk pendapat yang
              mu'tabar.
            </p>
            <p>
              Mengusung prinsip bahwa fiqih Islam adalah syariat yang mudah, aplikatif, dan
              relevan dengan kebutuhan masyarakat. Penyampaian materi dilakukan secara
              edukatif, namun tetap kritis terhadap informasi, praktik, atau pemahaman yang
              tidak sesuai dengan kaidah keilmuan.
            </p>
            <p>
              Dalam berfatwa dan memberikan bimbingan, prioritas diberikan kepada pendapat
              mu'tamad madzhab Syafi'i selama telah mencukupi untuk menjawab kebutuhan.
              Apabila diperlukan, dibuka ruang untuk memanfaatkan pendapat mu'tabar dari
              madzhab lain.
            </p>
            <p>
              Fokus utama bukan melakukan tarjih antarpendapat, melainkan memberikan arahan
              dan solusi fiqih yang dapat dipertanggungjawabkan secara ilmiah.
            </p>
          </div>

          <p
            className="text-[10px] font-bold uppercase tracking-[0.18em] mt-8"
            style={{ color: 'hsl(var(--accent))' }}
          >
            Urutan Rujukan
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-6">
            {METHOD_REFERENCES.map((ref, idx) => (
              <div key={ref.number} className="flex flex-col">
                <p
                  className="font-serif text-6xl font-bold leading-none mb-5 select-none"
                  style={{ color: 'hsl(var(--primary) / 0.12)' }}
                >
                  {ref.number}
                </p>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2"
                  style={{ color: 'hsl(var(--accent))' }}
                >
                  Rujukan {idx + 1}
                </p>
                <p className="text-sm text-foreground leading-relaxed">{ref.text}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 8. Karakteristik Markaz Fiqih */}
        <Section>
          <SectionLabel>Karakteristik Markaz Fiqih</SectionLabel>
          <div className="space-y-3">
            {KARAKTERISTIK.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 9. Bidang Kegiatan */}
        <Section>
          <SectionLabel>Bidang Kegiatan</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BIDANG_KEGIATAN.map((bidang) => (
              <div key={bidang.kategori} className="bg-card border rounded-2xl p-6">
                <p className="font-serif font-bold text-foreground mb-3">{bidang.kategori}</p>
                <ul className="space-y-1.5">
                  {bidang.items.map((item) => (
                    <li key={item} className="text-sm text-muted-foreground flex gap-2">
                      <span>&bull;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* 10. Sasaran */}
        <Section>
          <SectionLabel>Sasaran</SectionLabel>
          <div className="flex flex-wrap gap-3">
            {SASARAN.map((item) => (
              <span
                key={item}
                className="rounded-full border px-5 py-2 text-sm font-medium text-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </Section>

        {/* 11. Cita-cita + Roadmap */}
        <Section>
          <SectionLabel>Cita-cita</SectionLabel>
          <div className="space-y-4 text-foreground/90 text-base leading-relaxed">
            <p>
              Menjadi pusat keilmuan fiqih berskala nasional yang memiliki sistem pendidikan,
              kaderisasi, publikasi, dan jaringan pengajar di berbagai daerah Indonesia.
            </p>
            <p>Dalam jangka panjang, Markaz Fiqih diarahkan untuk mengembangkan:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              {CITA_CITA_ARAH.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>

          {/* Roadmap 5 fase — timeline horizontal (desktop) / vertikal (mobile) */}
          <div className="mt-10">
            <div className="hidden sm:flex items-start justify-between relative">
              <div
                className="absolute top-4 left-0 right-0 h-px bg-border"
                style={{ zIndex: 0 }}
              />
              {ROADMAP_FASE.map((fase) => (
                <div key={fase.number} className="relative z-10 flex flex-col items-center text-center px-2 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      fase.done
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border-2 border-primary text-primary'
                    }`}
                  >
                    {fase.number}
                  </div>
                  <p className="text-xs font-semibold text-foreground mt-3 leading-snug">
                    Fase {fase.number}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug max-w-[140px]">
                    {fase.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Mobile: vertikal */}
            <div className="flex sm:hidden flex-col gap-0 relative pl-4">
              <div className="absolute top-2 bottom-2 left-[15px] w-px bg-border" style={{ zIndex: 0 }} />
              {ROADMAP_FASE.map((fase) => (
                <div key={fase.number} className="relative z-10 flex items-start gap-4 py-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      fase.done
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border-2 border-primary text-primary'
                    }`}
                  >
                    {fase.number}
                  </div>
                  <div className="pt-1">
                    <p className="text-sm font-semibold text-foreground leading-snug">
                      Fase {fase.number}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                      {fase.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © 2026 Markaz Fiqh. Semua Hak Dilindungi.
      </footer>
    </AppShell>
  );
}

export default function AboutUsPage() {
  return (
    <ProtectedRoute>
      <AboutUsContent />
    </ProtectedRoute>
  );
}
