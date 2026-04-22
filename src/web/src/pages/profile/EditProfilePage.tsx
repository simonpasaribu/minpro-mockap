import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/components/AuthContext'
import api from '../../features/auth/services/auth.service'

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
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [uploadError, setUploadError] = useState('')

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
            className="mt-6 inline-flex rounded-full bg-[#4a3fe2] px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Login
          </Link>
        </div>
      </main>
    )
  }

  const fullName = `${formData.firstName} ${formData.lastName}`.trim()
  const initials = `${formData.firstName?.charAt(0) ?? ''}${formData.lastName?.charAt(0) ?? ''}`.toUpperCase()

  return (
    <main className="min-h-screen bg-[#faf4ff] px-4 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <section className="mb-6 rounded-2xl bg-white p-6 shadow-[0_10px_40px_-10px_rgba(50,41,79,0.04)]">
          <h1 className="text-2xl font-bold text-[#32294f] md:text-3xl">
            Perbarui Profil Akun
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#32294f]/70">
            Kelola informasi profil Anda dan foto profil.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_10px_40px_-10px_rgba(50,41,79,0.04)]">
          {message && (
            <div className={`mb-6 rounded-xl px-4 py-3 text-sm ${message.includes('berhasil') ? 'bg-[#4a3fe2]/5 text-[#4a3fe2]' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          {/* Profile Preview */}
          <div className="mb-8 rounded-2xl bg-[#faf4ff] p-6 border border-[#b2a6d5]/20">
            <div className="flex flex-col items-center gap-4 text-center">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Profile Preview"
                  className="h-24 w-24 rounded-xl object-cover ring-4 ring-white shadow-sm"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-[#4a3fe2]/10 text-2xl font-bold text-[#4a3fe2] ring-4 ring-white shadow-sm">
                  {initials || 'U'}
                </div>
              )}

              <div>
                <p className="text-xl font-bold text-[#32294f]">{fullName || 'User'}</p>
                <p className="mt-1 text-sm text-[#32294f]/60">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveAll} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#32294f]">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-[#faf4ff] px-4 py-3.5 text-sm text-[#32294f] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#4a3fe2]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#32294f]">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-[#faf4ff] px-4 py-3.5 text-sm text-[#32294f] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#4a3fe2]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#32294f]">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-[#faf4ff] px-4 py-3.5 text-sm text-[#32294f] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#4a3fe2]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#32294f]">
                  Birth Date
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-[#faf4ff] px-4 py-3.5 text-sm text-[#32294f] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#4a3fe2]/20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#32294f]">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-[#faf4ff] px-4 py-3.5 text-sm text-[#32294f] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#4a3fe2]/20"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Profile Picture Upload */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#32294f]">
                Profile Picture
              </label>

              <div className="rounded-2xl bg-[#faf4ff] p-4 border border-[#b2a6d5]/20">
                <div className="mb-4 rounded-xl bg-[#4a3fe2]/5 px-4 py-3 text-sm leading-6 text-[#32294f]">
                  <p className="font-semibold">Note upload foto profil</p>
                  <p>Gunakan file gambar dengan ukuran maksimal 2MB. Format JPG, PNG, atau WebP.</p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex cursor-pointer items-center justify-center rounded-full bg-[#4a3fe2] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#3a2fd2] active:scale-95">
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Choose File
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </label>
                  <span className="text-sm text-[#32294f]/60">
                    {selectedFile ? selectedFile.name : 'No file chosen'}
                  </span>
                </div>

                {uploadError && (
                  <p className="mt-2 text-xs text-red-500">{uploadError}</p>
                )}

                {previewImage && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="mt-3 text-sm font-medium text-[#4a3fe2] transition hover:text-[#3a2fd2]"
                  >
                    Hapus foto saat ini
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <Link
                to="/profile"
                className="flex-1 rounded-full bg-[#faf4ff] px-6 py-3.5 text-center text-sm font-semibold text-[#32294f] transition hover:bg-[#4a3fe2]/10"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || uploading}
                className="flex-1 rounded-full bg-[#4a3fe2] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#3a2fd2] disabled:opacity-50"
              >
                {loading || uploading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            <div className="flex justify-between pt-6">
              <Link
                to="/profile"
                className="text-sm font-medium text-[#32294f]/70 transition hover:text-[#32294f]"
              >
                ← Back to Profile
              </Link>
              <Link
                to="/profile/change-password"
                className="text-sm font-medium text-[#4a3fe2] transition hover:text-[#3a2fd2]"
              >
                Change Password →
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
