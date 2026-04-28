import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/components/AuthContext'
import api from '../../features/auth/services/auth.service'
import { Upload, Image, X, ArrowLeft, Lock, User } from 'lucide-react'

export default function EditProfilePage() {
  const { user, setUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    gender: '',
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [showExitModal, setShowExitModal] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
        gender: user.gender || '',
      })
      setPreviewImage(user.profilePicture || null)
      setImageUrl(user.profilePicture || '')
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Validate phone number
    if (formData.phone && !validatePhone(formData.phone)) {
      setMessage('Format nomor telepon tidak valid. Gunakan format Indonesia (08xxx)')
      setLoading(false)
      return
    }

    try {
      const response = await api.put('/user/profile', formData)

      // Update user in context
      if (user && response.data?.data) {
        setUser({
          ...user,
          firstName: response.data.data.firstName,
          lastName: response.data.data.lastName,
          phone: response.data.data.phone,
          birthDate: response.data.data.birthDate,
          gender: response.data.data.gender,
        })
      }

      setMessage('Profil berhasil diperbarui!')
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Gagal memperbarui profil')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Upload photo first if selected
    if (selectedFile) {
      await uploadPhoto()
    }
    
    // Then update profile
    await handleSubmit(e)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('File harus berupa gambar (JPG, PNG, WebP)')
      return
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadError('Ukuran gambar maksimal 2MB')
      return
    }

    setUploadError('')
    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setPreviewImage(null)
    setSelectedFile(null)
    setUploadError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadPhoto = async () => {
    if (!selectedFile) return

    setUploading(true)
    setMessage('')

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('image', selectedFile)

      const response = await api.put('/user/profile-picture', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // Update user in context
      if (user && response.data?.data) {
        setUser({
          ...user,
          profilePicture: response.data.data.profilePicture
        })
      }

      setSelectedFile(null)
      setMessage('Foto profil berhasil diperbarui!')
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Gagal upload foto')
    } finally {
      setUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // Standardize phone number to Indonesian format (08...)
    if (name === 'phone') {
      let standardizedPhone = value.replace(/\D/g, '') // Remove non-digits

      // Convert +62 to 0
      if (standardizedPhone.startsWith('62')) {
        standardizedPhone = '0' + standardizedPhone.substring(2)
      }

      setFormData({ ...formData, [name]: standardizedPhone })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const validatePhone = (phone: string) => {
    // Indonesian phone number validation: starts with 08, 8-13 digits total
    const phoneRegex = /^08\d{7,11}$/
    return phoneRegex.test(phone)
  }

  // Check if form has unsaved changes
  const hasUnsavedChanges = () => {
    if (!user) return false
    return (
      formData.firstName !== user.firstName ||
      formData.lastName !== user.lastName ||
      formData.phone !== user.phone ||
      formData.birthDate !== (user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '') ||
      formData.gender !== user.gender ||
      selectedFile !== null ||
      imageUrl !== (user.profilePicture || '')
    )
  }

  const handleNavigation = (path: string) => {
    if (hasUnsavedChanges()) {
      setPendingNavigation(path)
      setShowExitModal(true)
    } else {
      navigate(path)
    }
  }

  const handleExitConfirm = () => {
    setShowExitModal(false)
    if (pendingNavigation) {
      navigate(pendingNavigation)
      setPendingNavigation(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('File harus berupa gambar (JPG, PNG, WebP)')
      return
    }
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadError('Ukuran gambar maksimal 2MB')
      return
    }
    setUploadError('')
    setSelectedFile(file)
    setImageUrl('')
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setImageUrl(url)
    setSelectedFile(null)
    if (url) {
      setPreviewImage(url)
    } else {
      setPreviewImage(user?.profilePicture || null)
    }
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#faf4ff] px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-[#32294f]">User Not Found</h1>
          <p className="mt-3 text-sm text-[#32294f]/70">
            Data user tidak tersedia. Silakan login kembali.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Kembali ke Masuk
          </Link>
        </div>
      </main>
    )
  }

  const fullName = `${formData.firstName} ${formData.lastName}`.trim()
  const initials = `${formData.firstName?.charAt(0) ?? ''}${formData.lastName?.charAt(0) ?? ''}`.toUpperCase()
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : 'Jan 2024'

  return (
    <div className="min-h-screen bg-[#faf4ff] pb-16 sm:pb-20 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#e2d7ff] text-[#4e339c] font-semibold hover:bg-[#d8caff] transition-colors mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-12">
          {/* Page Title */}
          <section className="lg:col-span-12 mb-3 sm:mb-4">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#32294f] mb-2 sm:mb-3">Perbarui Profil Akun</h1>
            <p className="text-sm sm:text-lg text-[#5f557f] max-w-2xl">Kelola kehadiran publik dan informasi pribadi Anda untuk menjaga pengalaman LearnHub tetap sesuai dengan kebutuhan Anda.</p>
          </section>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-4 sm:space-y-6">
            <div className="bg-[#f5eeff] rounded-xl p-4 sm:p-8 border border-[#b2a6d5]/10 shadow-sm flex flex-col items-center text-center">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden mb-4 sm:mb-6 shadow-xl">
                {previewImage ? (
                  <img src={previewImage} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl font-bold text-[#4a3fe2] bg-[#e2d7ff]">
                    {initials || 'U'}
                  </div>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#32294f] mb-1">{fullName || 'User'}</h3>
              <p className="text-xs sm:text-sm text-[#5f557f] font-medium">{user.email}</p>
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-[#b2a6d5]/20 w-full">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-[#5f557f]">Anggota Sejak</span>
                  <span className="text-[#32294f] font-semibold">{memberSince}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#e2d7ff] rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4">
              <h4 className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-[#5f557f] opacity-60">Tautan Cepat</h4>
              <nav className="flex flex-col gap-2">
                <button onClick={() => handleNavigation('/profile')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f5eeff] text-[#32294f] font-semibold transition-all">
                  <User className="w-5 h-5 text-[#4a3fe2]" />
                  Kembali ke Profil
                </button>
                <button onClick={() => handleNavigation('/profile/change-password')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f5eeff] text-[#32294f] font-semibold transition-all">
                  <Lock className="w-5 h-5 text-[#4a3fe2]" />
                  Ubah Kata Sandi
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSaveAll} className="space-y-10">
              {/* Personal Information */}
              <div className="bg-white rounded-xl p-8 lg:p-10 shadow-[0_10px_40px_-10px_rgba(50,41,79,0.05)] border border-[#b2a6d5]/10">
                <h2 className="text-2xl font-bold mb-8 text-[#32294f] flex items-center gap-3">
                  <span className="w-8 h-1 bg-[#4a3fe2] rounded-full"></span>
                  Informasi Pribadi
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-[#5f557f] ml-1" htmlFor="first_name">Nama Depan</label>
                    <input
                      id="first_name"
                      name="firstName"
                      type="text"
                      placeholder="Alex"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full bg-[#f5eeff] border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-[#4a3fe2]/20 focus:bg-white transition-all text-[#32294f] placeholder:text-[#5f557f]/40 font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-[#5f557f] ml-1" htmlFor="last_name">Nama Belakang</label>
                    <input
                      id="last_name"
                      name="lastName"
                      type="text"
                      placeholder="Rivai"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full bg-[#f5eeff] border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-[#4a3fe2]/20 focus:bg-white transition-all text-[#32294f] placeholder:text-[#5f557f]/40 font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-[#5f557f] ml-1" htmlFor="phone">Nomor Telepon</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="0812 3456 789"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-[#f5eeff] border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-[#4a3fe2]/20 focus:bg-white transition-all text-[#32294f] placeholder:text-[#5f557f]/40 font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-[#5f557f] ml-1" htmlFor="birthdate">Tanggal Lahir</label>
                    <input
                      id="birthdate"
                      name="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={handleChange}
                      className="w-full bg-[#f5eeff] border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-[#4a3fe2]/20 focus:bg-white transition-all text-[#32294f] font-medium"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-bold text-[#5f557f] ml-1" htmlFor="gender">Jenis Kelamin</label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full bg-[#f5eeff] border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-[#4a3fe2]/20 focus:bg-white transition-all text-[#32294f] font-medium appearance-none"
                    >
                      <option value="">Pilih Jenis Kelamin</option>
                      <option value="male">Laki-laki</option>
                      <option value="female">Perempuan</option>
                      <option value="other">Tidak ingin menyebutkan</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Profile Picture */}
              <div className="bg-white rounded-xl p-8 lg:p-10 shadow-[0_10px_40px_-10px_rgba(50,41,79,0.05)] border border-[#b2a6d5]/10">
                <h2 className="text-2xl font-bold mb-8 text-[#32294f] flex items-center gap-3">
                  <span className="w-8 h-1 bg-[#4a3fe2] rounded-full"></span>
                  Foto Profil
                </h2>
                <div
                  className={`flex flex-col md:flex-row items-center gap-8 bg-[#f5eeff]/50 p-8 rounded-xl border-2 border-dashed ${
                    isDragging ? 'border-[#4a3fe2] bg-[#4a3fe2]/5' : 'border-[#b2a6d5]/30'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <p className="text-[#32294f] font-semibold text-lg">Perbarui foto Anda</p>
                    <p className="text-sm text-[#5f557f] leading-relaxed">
                      Tipe file yang diizinkan: <span className="font-bold">JPG, PNG, WebP</span>. Ukuran file maksimum <span className="font-bold">2MB</span>.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
                      <label className="bg-[#4a3fe2] hover:bg-[#3d2fd6] text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg shadow-[#4a3fe2]/20 flex items-center gap-2 cursor-pointer">
                        <Upload className="w-4 h-4" />
                        Pilih File
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      {(previewImage || selectedFile) && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="text-[#b41340] font-semibold text-sm underline underline-offset-4 decoration-[#b41340]/30 hover:decoration-[#b41340] transition-all"
                        >
                          Hapus foto saat ini
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="w-24 h-24 bg-[#e2d7ff] rounded-xl flex items-center justify-center border border-[#b2a6d5]/20">
                    {previewImage ? (
                      <img src={previewImage} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Image className="w-10 h-10 text-[#4a3fe2] opacity-40" />
                    )}
                  </div>
                </div>

                {/* URL Input */}
                <div className="mt-6 space-y-2">
                  <label className="block text-sm font-bold text-[#5f557f] ml-1">Atau tempel URL gambar</label>
                  <div className="flex gap-3">
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={handleImageUrlChange}
                      className="flex-1 bg-[#f5eeff] border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-[#4a3fe2]/20 focus:bg-white transition-all text-[#32294f] placeholder:text-[#5f557f]/40 font-medium"
                    />
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('')
                          setPreviewImage(user?.profilePicture || null)
                        }}
                        className="p-3 bg-[#f5eeff] rounded-xl hover:bg-white transition-colors"
                      >
                        <X className="w-5 h-5 text-[#5f557f]" />
                      </button>
                    )}
                  </div>
                </div>

                {uploadError && (
                  <p className="mt-2 text-xs text-[#b41340]">{uploadError}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="w-full bg-[#4a3fe2] hover:bg-[#3d2fd6] text-white font-bold py-5 rounded-full transition-all shadow-xl shadow-[#4a3fe2]/30 text-lg disabled:opacity-50"
                >
                  {loading || uploading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigation('/profile')}
                  className="w-full bg-[#e8deff] hover:bg-[#e2d7ff] text-[#4e339c] font-bold py-5 rounded-full transition-all text-lg"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#32294f]/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#b2a6d5]/20 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#32294f]">Unsaved Changes</h3>
            <p className="mt-2 text-sm text-[#5f557f]">You have unsaved changes. Are you sure you want to leave?</p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 rounded-xl border border-[#b2a6d5] px-4 py-2.5 text-sm font-semibold text-[#32294f] transition hover:bg-[#f5eeff]"
              >
                Stay
              </button>
              <button
                onClick={handleExitConfirm}
                className="flex-1 rounded-xl bg-[#b41340] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a70138]"
              >
                Leave Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Message */}
      {message && (
        <div className={`fixed top-24 right-4 z-50 rounded-xl px-6 py-4 text-sm font-medium shadow-lg ${
          message.includes('berhasil') ? 'bg-[#4a3fe2] text-white' : 'bg-[#b41340] text-white'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}
