import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/components/AuthContext'
import { Shield, Eye, EyeOff, CheckCircle, Info } from 'lucide-react'
import api from '../../features/auth/services/auth.service'

export default function ChangePasswordPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Kata sandi baru tidak cocok')
      return
    }

    if (formData.newPassword.length < 8) {
      setError('Kata sandi harus minimal 8 karakter')
      return
    }

    setLoading(true)

    try {
      await api.put('/user/password', {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengubah kata sandi')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSuccess = () => {
    logout()
    navigate('/login')
  }

  const handleCancel = () => {
    // Check if form has any data
    if (formData.oldPassword || formData.newPassword || formData.confirmPassword) {
      setShowCancelModal(true)
    } else {
      navigate('/profile')
    }
  }

  const confirmCancel = () => {
    setShowCancelModal(false)
    setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' })
    navigate('/profile')
  }

  return (
    <div className="min-h-screen bg-[#faf4ff] pb-16 sm:pb-20 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#e2d7ff] text-[#4e339c] font-semibold hover:bg-[#d8caff] transition-colors mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <Shield className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali</span>
        </button>

        <div className="flex items-center justify-center">
          <div className="max-w-2xl w-full space-y-4 sm:space-y-6">
          {/* Title Card */}
          <section className="bg-white/80 backdrop-blur-xl rounded-xl p-4 sm:p-8 shadow-2xl border border-white/20">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#32294f] mb-1 sm:mb-2">Ubah Kata Sandi</h2>
                <p className="text-xs sm:text-sm text-[#5f557f] max-w-md leading-relaxed">
                  Pastikan akun Anda tetap aman dengan memperbarui kata sandi secara berkala. Gunakan kombinasi karakter yang kuat dan unik.
                </p>
              </div>
              <div className="bg-[#9795ff]/20 p-3 sm:p-4 rounded-xl flex-shrink-0">
                <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-[#4a3fe2]" />
              </div>
            </div>
          </section>

          {/* Form Card */}
          {!success ? (
            <section className="bg-white/80 backdrop-blur-xl rounded-xl p-4 sm:p-8 shadow-2xl border border-white/20">
              {error && (
                <div className="mb-4 sm:mb-6 rounded-xl bg-[#fd8bca]/10 px-4 py-3 text-sm text-[#983772]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-8">
                <div className="space-y-4 sm:space-y-6">
                  {/* Old Password */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-[#5f557f] mb-2">Kata Sandi Lama</label>
                    <div className="relative">
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        name="oldPassword"
                        placeholder="••••••••"
                        value={formData.oldPassword}
                        onChange={handleChange}
                        className="w-full bg-[#f5eeff]/50 border border-[#b2a6d5]/30 rounded-lg px-4 py-4 text-[#32294f] focus:ring-2 focus:ring-[#4a3fe2]/20 transition-all outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5f557f] hover:text-[#32294f] transition-colors"
                      >
                        {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-[#5f557f] mb-2">Kata Sandi Baru</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        placeholder="••••••••"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="w-full bg-[#f5eeff]/50 border border-[#b2a6d5]/30 rounded-lg px-4 py-4 text-[#32294f] focus:ring-2 focus:ring-[#4a3fe2]/20 transition-all outline-none"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5f557f] hover:text-[#32294f] transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-[#5f557f] flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      <span>Minimal 8 karakter dengan kombinasi huruf dan angka.</span>
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-[#5f557f] mb-2">Konfirmasi Kata Sandi Baru</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full bg-[#f5eeff]/50 border border-[#b2a6d5]/30 rounded-lg px-4 py-4 text-[#32294f] focus:ring-2 focus:ring-[#4a3fe2]/20 transition-all outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5f557f] hover:text-[#32294f] transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-8 py-3 rounded-full text-[#6249b2] font-bold hover:bg-[#d8caff] transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 rounded-full bg-[#4a3fe2] text-white font-bold shadow-xl shadow-[#4a3fe2]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Mengubah...' : 'Ubah Kata Sandi'}
                  </button>
                </div>
              </form>
            </section>
          ) : (
            /* Success Modal */
            <section className="bg-white/80 backdrop-blur-xl rounded-xl p-8 shadow-2xl border border-white/20 text-center">
              <div className="w-20 h-20 bg-[#9795ff]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-[#4a3fe2] fill-[#4a3fe2]" />
              </div>
              <h3 className="text-2xl font-extrabold text-[#32294f] mb-3">Kata Sandi Berhasil Diubah</h3>
              <p className="text-[#5f557f] mb-8">Keamanan akun Anda telah diperbarui. Silakan gunakan kata sandi baru untuk masuk berikutnya.</p>
              <button
                onClick={handleSuccess}
                className="w-full py-4 bg-[#4a3fe2] text-white rounded-full font-bold hover:brightness-110 transition-all shadow-lg shadow-[#4a3fe2]/20"
              >
                Kembali ke Masuk
              </button>
            </section>
          )}
        </div>
      </div>
    </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#32294f]/40 backdrop-blur-md">
          <div className="bg-white max-w-sm w-full rounded-xl p-10 text-center shadow-2xl">
            <h3 className="text-xl font-extrabold text-[#32294f] mb-3">Batalkan Perubahan?</h3>
            <p className="text-[#5f557f] mb-8">Perubahan yang Anda buat akan hilang. Apakah Anda yakin ingin membatalkan?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 rounded-full text-[#6249b2] font-bold hover:bg-[#d8caff] transition-colors"
              >
                Tidak
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 py-3 rounded-full bg-[#4a3fe2] text-white font-bold hover:brightness-110 transition-all shadow-lg shadow-[#4a3fe2]/20"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
