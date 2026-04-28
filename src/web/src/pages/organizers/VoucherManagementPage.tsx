import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { organizerApi, Voucher, VoucherFormData } from '../../features/organizers/api/organizerApi'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Plus, Trash2, Percent, Calendar, Ticket } from 'lucide-react'

const voucherSchema = z.object({
  code: z.string().min(3, 'Kode voucher minimal 3 karakter'),
  discount: z.number().min(1, 'Diskon minimal 1%').max(100, 'Diskon maksimal 100%'),
  quota: z.number().min(1, 'Kuota minimal 1'),
  expiresAt: z.string().min(1, 'Tanggal kadaluarsa harus diisi'),
})

type VoucherFormValues = z.infer<typeof voucherSchema>

export default function VoucherManagementPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      code: '',
      discount: 10,
      quota: 100,
      expiresAt: '',
    },
  })

  useEffect(() => {
    if (slug) {
      fetchVouchers()
    }
  }, [slug])

  const fetchVouchers = async () => {
    try {
      setLoading(true)
      console.log('Fetching vouchers for slug:', slug)
      const data = await organizerApi.getEventVouchers(slug!)
      console.log('Vouchers data:', data)
      setVouchers(data)
    } catch (error: any) {
      console.error('Failed to fetch vouchers:', error)
      console.error('Error response:', error?.response)
      console.error('Error message:', error?.message)
      alert(`Gagal memuat voucher: ${error?.response?.data?.message || error?.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: VoucherFormValues) => {
    try {
      setLoading(true)
      console.log('Creating voucher with data:', data)
      console.log('Event slug:', slug)
      const result = await organizerApi.createVoucher(slug!, data)
      console.log('Voucher created successfully:', result)
      alert('Voucher berhasil dibuat')
      reset()
      setShowForm(false)
      fetchVouchers()
    } catch (error: any) {
      console.error('Failed to create voucher:', error)
      console.error('Error response:', error?.response)
      console.error('Error message:', error?.message)
      alert(`Gagal membuat voucher: ${error?.response?.data?.message || error?.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVoucher = async (voucherId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus voucher ini?')) return

    try {
      setLoading(true)
      await organizerApi.deleteVoucher(slug!, voucherId)
      alert('Voucher berhasil dihapus')
      fetchVouchers()
    } catch (error) {
      console.error('Failed to delete voucher:', error)
      alert('Gagal menghapus voucher')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading && !showForm) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Back Button */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        <button
          onClick={() => navigate('/organizer/dashboard', { state: { activeTab: 'events' } })}
          className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#e2d7ff] text-[#4e339c] font-semibold hover:bg-[#d8caff] transition-colors mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manajemen Voucher</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Buat Voucher Baru</span>
          </button>
        </div>

        {/* Create Voucher Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Buat Voucher Baru</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kode Voucher *
                </label>
                <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    {...register('code')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    placeholder="Contoh: PROMO10"
                  />
                </div>
                {errors.code && (
                  <p className="text-red-600 text-sm mt-1">{errors.code.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diskon (%) *
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    {...register('discount', { valueAsNumber: true })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10"
                    min="1"
                    max="100"
                  />
                </div>
                {errors.discount && (
                  <p className="text-red-600 text-sm mt-1">{errors.discount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kuota (Jumlah Penggunaan) *
                </label>
                <input
                  type="number"
                  {...register('quota', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100"
                  min="1"
                />
                {errors.quota && (
                  <p className="text-red-600 text-sm mt-1">{errors.quota.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Kadaluarsa *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    {...register('expiresAt')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {errors.expiresAt && (
                  <p className="text-red-600 text-sm mt-1">{errors.expiresAt.message}</p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    reset()
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Menyimpan...' : 'Buat Voucher'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Vouchers List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Daftar Voucher</h2>
          
          {vouchers.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada voucher</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-blue-600">
                        {voucher.code}
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        {voucher.discount}% OFF
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Terpakai: {voucher.usedCount} / {voucher.quota}</p>
                      <p>Kadaluarsa: {formatDate(voucher.expiresAt)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteVoucher(voucher.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus Voucher"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
