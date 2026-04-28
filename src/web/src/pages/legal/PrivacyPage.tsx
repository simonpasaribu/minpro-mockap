import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-[#faf4ff] py-12 sm:py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#e2d7ff] text-[#4e339c] font-semibold hover:bg-[#d8caff] transition-colors mb-6 text-sm sm:text-base mt-16 sm:mt-20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali</span>
        </button>
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-[#32294f] mb-2 sm:mb-4">Kebijakan Privasi</h1>
          <p className="text-sm sm:text-base text-[#5f557f]">Terakhir diperbarui: April 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl p-4 sm:p-8 shadow-sm space-y-4 sm:space-y-8">
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">1. Informasi yang Kami Kumpulkan</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed mb-2 sm:mb-4">
              LearnHub mengumpulkan informasi yang Anda berikan langsung kepada kami, termasuk:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-[#5f557f] space-y-1 sm:space-y-2">
              <li>Informasi akun: nama, alamat email, kata sandi</li>
              <li>Informasi profil: foto profil, bio, detail kontak</li>
              <li>Informasi transaksi: detail pembayaran, riwayat pembelian</li>
              <li>Partisipasi event: event yang Anda daftarkan dan hadiri</li>
              <li>Informasi referral: kode referral unik Anda dan aktivitas referral</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">2. Cara Kami Menggunakan Informasi Anda</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed mb-2 sm:mb-4">
              Kami menggunakan informasi yang kami kumpulkan untuk:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-[#5f557f] space-y-1 sm:space-y-2">
              <li>Menyediakan, memelihara, dan meningkatkan layanan kami</li>
              <li>Memproses transaksi dan mengirim informasi terkait</li>
              <li>Mengirim pemberitahuan teknis dan pesan dukungan</li>
              <li>Menanggapi komentar dan pertanyaan</li>
              <li>Memantau dan menganalisis tren, penggunaan, dan aktivitas</li>
              <li>Mendeteksi dan mencegah penipuan, penyalahgunaan, dan masalah keamanan</li>
              <li>Mempersonalisasi pengalaman Anda dengan LearnHub</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">3. Berbagi Informasi</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed mb-2 sm:mb-4">
              Kami mungkin membagikan informasi Anda dalam keadaan berikut:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-[#5f557f] space-y-1 sm:space-y-2">
              <li>Dengan penyelenggara event untuk event yang Anda daftarkan</li>
              <li>Dengan penyedia layanan yang melakukan layanan atas nama kami</li>
              <li>Dengan persetujuan Anda untuk tujuan lain</li>
              <li>Untuk mematuhi kewajiban hukum</li>
              <li>Untuk melindungi hak kami dan mencegah penipuan</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">4. Keamanan Data</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed mb-2 sm:mb-4">
              Kami menerapkan langkah keamanan yang tepat untuk melindungi informasi pribadi Anda:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-[#5f557f] space-y-1 sm:space-y-2">
              <li>Kata sandi di-hash menggunakan enkripsi Bcrypt</li>
              <li>Informasi pembayaran diproses melalui gateway pembayaran yang aman</li>
              <li>Gambar profil disimpan dengan aman di Cloudinary</li>
              <li>Kami menggunakan enkripsi HTTPS untuk semua transmisi data</li>
              <li>Akses ke data pribadi dibatasi untuk personel yang berwenang</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">5. Data Poin dan Hadiah</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed mb-2 sm:mb-4">
              Informasi terkait program poin dan hadiah kami:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-[#5f557f] space-y-1 sm:space-y-2">
              <li>Poin kedaluwarsa 3 bulan setelah diperoleh</li>
              <li>Poin yang kedaluwarsa otomatis dihapus dari akun Anda</li>
              <li>Aktivitas referral dilacak untuk distribusi hadiah</li>
              <li>Riwayat penggunaan kupon dipelihara untuk pencegahan penipuan</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">6. Hak Anda</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed mb-2 sm:mb-4">
              Anda memiliki hak untuk:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-[#5f557f] space-y-1 sm:space-y-2">
              <li>Mengakses dan memperbarui informasi pribadi Anda</li>
              <li>Menghapus akun dan data terkait</li>
              <li>Memilih keluar dari komunikasi pemasaran</li>
              <li>Meminta salinan data pribadi Anda</li>
              <li>Keberatan terhadap pemrosesan data pribadi Anda</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">7. Cookies dan Pelacakan</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed mb-2 sm:mb-4">
              Kami menggunakan cookies dan teknologi serupa untuk:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-[#5f557f] space-y-1 sm:space-y-2">
              <li>Mengingat preferensi dan pengaturan Anda</li>
              <li>Menganalisis lalu lintas website dan pola penggunaan</li>
              <li>Meningkatkan layanan dan pengalaman pengguna</li>
              <li>Menyediakan konten dan rekomendasi yang dipersonalisasi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">8. Layanan Pihak Ketiga</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed mb-2 sm:mb-4">
              LearnHub terintegrasi dengan layanan pihak ketiga:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-[#5f557f] space-y-1 sm:space-y-2">
              <li>Cloudinary untuk penyimpanan dan pemrosesan gambar</li>
              <li>Gateway pembayaran untuk pemrosesan transaksi</li>
              <li>Layanan email untuk komunikasi</li>
              <li>Layanan ini memiliki kebijakan privasi mereka sendiri</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">9. Privasi Anak</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed">
              LearnHub tidak ditujukan untuk anak di bawah usia 13 tahun. Kami tidak sengaja mengumpulkan informasi pribadi dari anak di bawah 13 tahun. Jika Anda adalah orang tua atau wali dan percaya anak Anda telah memberikan kami informasi pribadi, silakan hubungi kami.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">10. Perubahan Kebijakan Privasi Ini</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed">
              Kami mungkin memperbarui Kebijakan Privasi kami dari waktu ke waktu. Kami akan memberi tahu Anda tentang perubahan apa pun dengan memposting Kebijakan Privasi baru di halaman ini dan memperbarui tanggal "Terakhir diperbarui".
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">11. Hubungi Kami</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed">
              Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami di{' '}
              <a href="mailto:privacy@learnhub.com" className="text-[#4a3fe2] hover:underline">
                privacy@learnhub.com
              </a>
            </p>
          </section>
        </div>

        {/* Back Button */}
        <div className="mt-6 sm:mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-[#4a3fe2] text-white font-bold rounded-full hover:bg-[#3d2fd6] transition-colors text-sm sm:text-base"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
