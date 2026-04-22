import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/components/AuthContext'
import api from '../../features/auth/services/auth.service'

export default function ChangePasswordPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters')
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
      setError(err.response?.data?.message || 'Failed to change password')
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

  return (
    <main className="min-h-screen bg-[#faf4ff] px-4 py-10">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <section className="mb-6 rounded-2xl bg-white p-6 shadow-[0_10px_40px_-10px_rgba(50,41,79,0.04)]">
          <h1 className="text-2xl font-bold text-[#32294f] md:text-3xl">
            Change Password
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#32294f]/70">
            Update your password to keep your account secure.
          </p>
        </section>

        {/* Success State */}
        {success ? (
          <section className="rounded-2xl bg-white p-6 shadow-[0_10px_40px_-10px_rgba(50,41,79,0.04)] text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#4a3fe2]/10">
              <svg className="h-10 w-10 text-[#4a3fe2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#32294f]">
              Password Changed Successfully
            </h2>
            <p className="mt-2 text-[#32294f]/70">
              Please log in again with your new password.
            </p>
            <button
              onClick={handleSuccess}
              className="mt-6 w-full rounded-full bg-[#4a3fe2] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#3a2fd2]"
            >
              Back to Login
            </button>
          </section>
        ) : (
          /* Form */
          <section className="rounded-2xl bg-white p-6 shadow-[0_10px_40px_-10px_rgba(50,41,79,0.04)]">
            {error && (
              <div className="mb-6 rounded-xl bg-[#4a3fe2]/5 px-4 py-3 text-sm text-[#32294f]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#32294f]">
                  Current Password
                </label>
                <input
                  type="password"
                  name="oldPassword"
                  placeholder="Enter current password"
                  value={formData.oldPassword}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-[#faf4ff] px-4 py-3.5 text-sm text-[#32294f] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#4a3fe2]/20"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#32294f]">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  placeholder="Enter new password (min 8 chars)"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-[#faf4ff] px-4 py-3.5 text-sm text-[#32294f] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#4a3fe2]/20"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#32294f]">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-[#faf4ff] px-4 py-3.5 text-sm text-[#32294f] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#4a3fe2]/20"
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="flex-1 rounded-full bg-[#faf4ff] px-6 py-3.5 text-sm font-semibold text-[#32294f] transition hover:bg-[#4a3fe2]/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-full bg-[#4a3fe2] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#3a2fd2] disabled:opacity-50"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </main>
  )
}
