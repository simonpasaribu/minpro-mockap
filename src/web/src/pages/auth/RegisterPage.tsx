import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/components/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    referralCode: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await register(formData)
      navigate('/profile')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="min-h-screen bg-[#faf4ff] flex flex-col">
      {/* Split Layout */}
      <main className="flex-grow flex flex-col md:flex-row">
        {/* Visual Column (Left) */}
        <section className="hidden md:flex md:w-5/12 lg:w-1/2 bg-[#4a3fe2] relative overflow-hidden p-16 flex-col justify-between">
          <div className="absolute inset-0 opacity-40">
            <img
              alt="Learning background"
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1800&q=80"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#4a3fe2] to-transparent opacity-80"></div>
          </div>

          <div className="relative z-10">
            <span className="text-white font-bold text-2xl tracking-tight">LearnHub</span>
          </div>

          <div className="relative z-10 max-w-lg">
            <h1 className="text-6xl lg:text-7xl font-extrabold text-white tracking-tighter leading-none mb-8">
              Learn. Experience. <br/>Grow.
            </h1>
            <p className="text-xl text-white/80 leading-relaxed mb-4">
              Temukan kelas, seminar, workshop, dan bootcamp terbaik offline maupun online dalam satu platform.
            </p>
            <p className="text-lg text-white/70 leading-relaxed">
              Bergabung dengan ribuan pembelajar dan profesional. Tingkatkan skill, perluas relasi, dan akses berbagai event berkualitas dengan mudah.
            </p>
          </div>
        </section>

        {/* Form Column (Right) */}
        <section className="flex-grow flex items-center justify-center p-8 md:p-16 lg:p-24 bg-[#faf4ff]">
          <div className="w-full max-w-md">
            {/* Branding for Mobile */}
            <div className="md:hidden mb-12">
              <span className="text-[#4a3fe2] font-black text-2xl tracking-tight">LearnHub</span>
            </div>

            {/* Tabs/Switchers */}
            <div className="flex items-end gap-8 mb-12">
              <Link to="/login" className="group opacity-50 hover:opacity-100 transition-opacity">
                <h2 className="text-2xl font-bold text-[#32294f]">Sign In</h2>
                <div className="h-1 w-0 group-hover:w-4 bg-[#9795ff] mt-1 rounded-full transition-all"></div>
              </Link>
              <button className="group">
                <h2 className="text-2xl font-bold text-[#32294f] transition-all">Create Account</h2>
                <div className="h-1 w-8 bg-[#4a3fe2] mt-1 rounded-full"></div>
              </button>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[#5f557f] px-1">First Name</label>
                  <div className="bg-[#f5eeff] rounded-xl px-4 py-3 flex items-center gap-3 focus-within:outline-none">
                    <svg className="w-5 h-5 text-[#5f557f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="bg-transparent border-none focus:ring-0 focus:outline-none focus-visible:outline-none outline-none w-full text-[#32294f] placeholder:text-[#b2a6d5]/50"
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[#5f557f] px-1">Last Name</label>
                  <div className="bg-[#f5eeff] rounded-xl px-4 py-3 flex items-center gap-3 focus-within:outline-none">
                    <svg className="w-5 h-5 text-[#5f557f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="bg-transparent border-none focus:ring-0 focus:outline-none focus-visible:outline-none outline-none w-full text-[#32294f] placeholder:text-[#b2a6d5]/50"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5f557f] px-1">Email Address</label>
                <div className="bg-[#f5eeff] rounded-xl px-4 py-3 flex items-center gap-3 focus-within:outline-none">
                  <svg className="w-5 h-5 text-[#5f557f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  <input
                    type="email"
                    name="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-transparent border-none focus:ring-0 focus:outline-none focus-visible:outline-none outline-none w-full text-[#32294f] placeholder:text-[#b2a6d5]/50"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5f557f] px-1">Password</label>
                <div className="bg-[#f5eeff] rounded-xl px-4 py-3 flex items-center gap-3 focus-within:outline-none">
                  <svg className="w-5 h-5 text-[#5f557f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-transparent border-none focus:ring-0 focus:outline-none focus-visible:outline-none outline-none w-full text-[#32294f] placeholder:text-[#b2a6d5]/50"
                    required
                  />
                </div>
              </div>

              {/* Referral Code Field */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5f557f] px-1">Referral Code (Optional)</label>
                <div className="bg-[#f5eeff] rounded-xl px-4 py-3 flex items-center gap-3 focus-within:outline-none">
                  <svg className="w-5 h-5 text-[#5f557f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  <input
                    type="text"
                    name="referralCode"
                    placeholder="KINETIC-2024"
                    value={formData.referralCode}
                    onChange={handleChange}
                    className="bg-transparent border-none focus:ring-0 focus:outline-none focus-visible:outline-none outline-none w-full text-[#32294f] placeholder:text-[#b2a6d5]/50 uppercase tracking-wider"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-[#4a3fe2]/5 px-4 py-3 text-sm text-[#32294f]">
                  {error}
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#4a3fe2] text-white font-bold py-4 rounded-full shadow-lg shadow-[#4a3fe2]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>

            <p className="mt-12 text-center text-sm text-[#5f557f]">
              By accessing the platform, you agree to our{' '}
              <Link to="/terms" className="text-[#32294f] font-bold hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-[#32294f] font-bold hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
