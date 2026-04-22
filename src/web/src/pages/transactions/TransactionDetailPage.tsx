import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { transactionApi, Transaction } from '../../features/transactions/api/transactionApi'
import { Calendar, MapPin, Clock, ArrowLeft, CheckCircle, Upload, Loader2 } from 'lucide-react'

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!id) return
      try {
        setLoading(true)
        const response = await transactionApi.getTransactionById(parseInt(id))
        setTransaction(response.data)
      } catch (err) {
        setError('Transaksi tidak ditemukan')
      } finally {
        setLoading(false)
      }
    }

    fetchTransaction()
  }, [id])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      WAITING_PAYMENT: 'bg-yellow-100 text-yellow-800',
      WAITING_CONFIRMATION: 'bg-blue-100 text-blue-800',
      DONE: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
      CANCELED: 'bg-gray-100 text-gray-800',
    }

    const labels: Record<string, string> = {
      WAITING_PAYMENT: 'Menunggu Pembayaran',
      WAITING_CONFIRMATION: 'Menunggu Konfirmasi',
      DONE: 'Selesai',
      REJECTED: 'Ditolak',
      EXPIRED: 'Kadaluarsa',
      CANCELED: 'Dibatalkan',
    }

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    )
  }

  const handleUploadProof = async () => {
    // In a real app, this would open a file picker and upload to Cloudinary
    // For now, we'll simulate with a placeholder URL
    const mockProofUrl = `https://res.cloudinary.com/demo/image/upload/payment_proof_${Date.now()}.jpg`

    try {
      setUploading(true)
      setError(null)
      const response = await transactionApi.uploadPaymentProof(
        parseInt(id!),
        mockProofUrl
      )
      setTransaction(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengunggah bukti pembayaran')
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Apakah Anda yakin ingin membatalkan transaksi ini?')) return

    try {
      setLoading(true)
      await transactionApi.cancelTransaction(parseInt(id!))
      // Refresh transaction data
      const response = await transactionApi.getTransactionById(parseInt(id!))
      setTransaction(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal membatalkan transaksi')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('id-ID')
  }

  // Calculate remaining time for payment (2 hours)
  const getRemainingTime = () => {
    if (!transaction?.expiredAt) return null
    const now = new Date()
    const expired = new Date(transaction.expiredAt)
    const diff = expired.getTime() - now.getTime()

    if (diff <= 0) return 'Kadaluarsa'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours} jam ${minutes} menit`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/my-transactions')}
            className="text-blue-600 hover:underline"
          >
            Kembali ke Transaksi Saya
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/my-transactions')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Detail Transaksi
                </h1>
                {getStatusBadge(transaction.status)}
              </div>
              <p className="text-gray-600">
                Order ID: #{transaction.id}
              </p>
              <p className="text-gray-500 text-sm">
                Dibuat pada {formatDate(transaction.createdAt)}
              </p>
            </div>

            {/* Event Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Detail Event</h2>
              <div className="flex gap-4">
                {transaction.event.imageUrl ? (
                  <img
                    src={transaction.event.imageUrl}
                    alt={transaction.event.title}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {transaction.event.title[0]}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{transaction.event.title}</h3>
                  <p className="text-gray-600">
                    {transaction.event.organizer.firstName} {transaction.event.organizer.lastName}
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(transaction.event.startDate).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{transaction.event.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Timer - Nomor 2-B: Timer 2 jam untuk upload bukti */}
            {transaction.status === 'WAITING_PAYMENT' && transaction.expiredAt && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold text-yellow-800">
                    Sisa Waktu Pembayaran
                  </h3>
                </div>
                <p className="text-2xl font-bold text-yellow-700">
                  {getRemainingTime()}
                </p>
                <p className="text-sm text-yellow-600 mt-1">
                  Silakan unggah bukti pembayaran sebelum waktu habis
                </p>
              </div>
            )}

            {/* Actions */}
            {transaction.status === 'WAITING_PAYMENT' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Aksi</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleUploadProof}
                    disabled={uploading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Mengunggah...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Unggah Bukti Pembayaran
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="w-full border border-red-300 text-red-600 py-3 rounded-lg font-semibold hover:bg-red-50"
                  >
                    Batalkan Transaksi
                  </button>
                </div>
              </div>
            )}

            {/* Review Button - Nomor 3: Review Submission */}
            {transaction.status === 'DONE' && !transaction.review && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Event Selesai</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Bagaimana pengalaman Anda dengan event ini?
                </p>
                <button
                  onClick={() => navigate(`/review/${transaction.id}`)}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                >
                  Beri Ulasan
                </button>
              </div>
            )}
          </div>

          {/* Sidebar - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Ringkasan Pesanan</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {formatPrice(transaction.ticketPrice)} x {transaction.ticketCount} tiket
                  </span>
                  <span>{formatPrice(transaction.subtotal)}</span>
                </div>

                {transaction.pointsUsed > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Poin Digunakan</span>
                    <span>-{formatPrice(transaction.pointsUsed)}</span>
                  </div>
                )}

                {transaction.voucherDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Voucher ({transaction.voucherCode})</span>
                    <span>-{formatPrice(transaction.voucherDiscount)}</span>
                  </div>
                )}

                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(transaction.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Proof */}
              {transaction.paymentProofUrl && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Bukti Pembayaran
                  </p>
                  <img
                    src={transaction.paymentProofUrl}
                    alt="Payment Proof"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Review Info */}
              {transaction.review && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Ulasan Anda
                  </p>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < transaction.review!.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  {transaction.review.comment && (
                    <p className="text-sm text-gray-600">{transaction.review.comment}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
