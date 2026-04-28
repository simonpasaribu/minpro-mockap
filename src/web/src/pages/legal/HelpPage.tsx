import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function HelpPage() {
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
          <h1 className="text-2xl sm:text-4xl font-bold text-[#32294f] mb-2 sm:mb-4">Bagaimana kami bisa membantu Anda?</h1>
          <p className="text-sm sm:text-base text-[#5f557f]">Temukan jawaban untuk pertanyaan umum dan dapatkan dukungan untuk LearnHub</p>
        </div>

        {/* FAQ Section */}
        <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-4 sm:mb-6">Pertanyaan yang Sering Diajukan</h2>

          {/* FAQ Item 1 */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
            <h3 className="font-bold text-[#32294f] mb-1 sm:mb-2 text-sm sm:text-base">Bagaimana cara membuat akun?</h3>
            <p className="text-xs sm:text-sm text-[#5f557f]">
              Klik tombol "Buat Akun" di halaman beranda atau navigasi ke halaman pendaftaran. Isi detail Anda termasuk nama depan, nama belakang, email, dan kata sandi. Anda juga dapat memasukkan kode referral jika Anda memilikinya.
            </p>
          </div>

          {/* FAQ Item 2 */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
            <h3 className="font-bold text-[#32294f] mb-1 sm:mb-2 text-sm sm:text-base">Bagaimana cara mendaftar sebagai penyelenggara?</h3>
            <p className="text-xs sm:text-sm text-[#5f557f]">
              Setelah membuat akun, Anda dapat meminta status penyelenggara melalui profil Anda. Tim kami akan meninjau aplikasi Anda dan menyetujuinya jika Anda memenuhi persyaratan.
            </p>
          </div>

          {/* FAQ Item 3 */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
            <h3 className="font-bold text-[#32294f] mb-1 sm:mb-2 text-sm sm:text-base">Bagaimana cara kerja poin dan referral?</h3>
            <p className="text-xs sm:text-sm text-[#5f557f]">
              Saat Anda merujuk teman menggunakan kode referral unik Anda, Anda mendapatkan 10.000 poin. Poin dapat digunakan untuk mendapatkan diskon pada pembelian event. Poin kedaluwarsa setelah 3 bulan.
            </p>
          </div>

          {/* FAQ Item 4 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-[#32294f] mb-2">Bagaimana cara membeli tiket event?</h3>
            <p className="text-[#5f557f]">
              Telusuri event di platform, pilih event yang Anda minati, dan klik "Beli Tiket". Anda akan diarahkan ke halaman checkout di mana Anda dapat menyelesaikan pembayaran menggunakan poin yang tersedia atau metode pembayaran reguler.
            </p>
          </div>

          {/* FAQ Item 5 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-[#32294f] mb-2">Apa yang terjadi jika saya perlu membatalkan tiket saya?</h3>
            <p className="text-[#5f557f]">
              Kebijakan pembatalan bervariasi sesuai event. Silakan periksa detail event spesifik untuk ketentuan pembatalan. Jika disetujui, poin dan pembayaran Anda akan dikembalikan sesuai kebijakan event.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
