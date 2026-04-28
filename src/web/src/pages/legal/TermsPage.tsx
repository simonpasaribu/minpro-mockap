import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
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
          <h1 className="text-2xl sm:text-4xl font-bold text-[#32294f] mb-2 sm:mb-4">Syarat dan Ketentuan</h1>
          <p className="text-sm sm:text-base text-[#5f557f]">Terakhir diperbarui: April 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl p-4 sm:p-8 shadow-sm space-y-4 sm:space-y-8">
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">1. Penerimaan Syarat</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed">
              Dengan mengakses dan menggunakan LearnHub, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan syarat ini, jangan gunakan platform kami.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">2. Akun Pengguna</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed mb-2 sm:mb-4">
              Untuk menggunakan fitur tertentu LearnHub, Anda harus membuat akun. Anda bertanggung jawab untuk menjaga kerahasiaan kredensial akun Anda dan untuk semua aktivitas yang terjadi di bawah akun Anda.
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-[#5f557f] space-y-1 sm:space-y-2">
              <li>Anda harus memberikan informasi yang akurat dan lengkap saat membuat akun</li>
              <li>Anda tidak boleh membagikan kata sandi Anda dengan siapa pun</li>
              <li>Anda harus memberi tahu kami segera tentang penggunaan akun yang tidak sah</li>
              <li>Anda bertanggung jawab atas semua aktivitas yang terjadi di bawah akun Anda</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">3. Pendaftaran dan Pembayaran Event</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed mb-2 sm:mb-4">
              Saat Anda mendaftar untuk event melalui LearnHub, Anda setuju untuk membayar biaya yang ditentukan. Semua pembayaran diproses dengan aman melalui mitra pembayaran kami.
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-[#5f557f] space-y-1 sm:space-y-2">
              <li>Biaya event tidak dapat dikembalikan kecuali ditentukan lain oleh penyelenggara</li>
              <li>Kami berhak membatalkan event dan memberikan pengembalian dana penuh dalam kasus tersebut</li>
              <li>Poin dan kupon tidak dapat ditukar dengan uang tunai</li>
              <li>Poin kedaluwarsa 3 bulan setelah diperoleh</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">4. Tanggung Jawab Penyelenggara</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed mb-2 sm:mb-4">
              Penyelenggara yang menggunakan LearnHub setuju untuk:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-[#5f557f] space-y-1 sm:space-y-2">
              <li>Memberikan informasi event yang akurat dan lengkap</li>
              <li>Menghormati semua pendaftaran dan pembayaran yang dikonfirmasi</li>
              <li>Menanggapi konfirmasi pembayaran dalam 3 hari kerja</li>
              <li>Memelihara perilaku profesional setiap saat</li>
              <li>Tidak menggunakan platform untuk aktivitas penipuan atau ilegal</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">5. Program Referral</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed mb-2 sm:mb-4">
              Program referral kami memungkinkan pengguna mendapatkan poin dengan merujuk pengguna baru ke platform:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-[#5f557f] space-y-1 sm:space-y-2">
              <li>Pengirim referral mendapatkan 10.000 poin untuk setiap referral yang berhasil</li>
              <li>Pendaftar baru yang menggunakan kode referral menerima kupon diskon</li>
              <li>Kode referral tidak dapat ditransfer atau dijual</li>
              <li>Kami berhak mengubah atau menghentikan program referral kapan saja</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">6. Ulasan dan Peringkat</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed mb-2 sm:mb-4">
              Pengguna dapat mengirimkan ulasan dan peringkat untuk event yang telah mereka hadiri:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-[#5f557f] space-y-1 sm:space-y-2">
              <li>Ulasan harus berdasarkan kehadiran event yang sebenarnya</li>
              <li>Ulasan harus jujur dan tidak mengandung informasi palsu</li>
              <li>Kami berhak menghapus ulasan yang melanggar pedoman kami</li>
              <li>Penyelenggara tidak dapat memanipulasi atau menginsentifkan ulasan</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">7. Hak Kekayaan Intelektual</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed">
              Semua konten di LearnHub, termasuk teks, grafik, logo, dan perangkat lunak, adalah properti LearnHub atau pemasok kontennya dan dilindungi oleh hukum hak kekayaan intelektual.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">8. Pembatasan Tanggung Jawab</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed">
              LearnHub tidak bertanggung jawab atas kerugian tidak langsung, insidental, khusus, atau konsekuensial yang timbul dari penggunaan atau ketidakmampuan menggunakan platform kami.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">9. Pengakhiran</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed">
              Kami berhak mengakhiri atau menangguhkan akun Anda kapan saja, tanpa pemberitahuan sebelumnya, untuk alasan apa pun, termasuk namun tidak terbatas pada pelanggaran Syarat dan Ketentuan ini.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">10. Perubahan Syarat</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed">
              Kami mungkin memperbarui Syarat dan Ketentuan ini dari waktu ke waktu. Penggunaan platform yang berkelanjutan setelah perubahan merupakan penerimaan syarat baru.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-2 sm:mb-4">11. Informasi Kontak</h2>
            <p className="text-xs sm:text-sm text-[#5f557f] leading-relaxed">
              Jika Anda memiliki pertanyaan tentang Syarat dan Ketentuan ini, silakan hubungi kami di{' '}
              <a href="mailto:support@learnhub.com" className="text-[#4a3fe2] hover:underline">
                support@learnhub.com
              </a>
            </p>
          </section>
        </div>

        {/* Back to Home Button */}
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
