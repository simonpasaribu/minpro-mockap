import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { transactionApi, Transaction, api } from '../../features/transactions/api/transactionApi'
import { organizerApi } from '../../features/organizers/api/organizerApi'
import { cloudinaryApi } from '../../features/upload/api/cloudinaryApi'
import { useAuth } from '../../features/auth/components/AuthContext'
import AccessDenied from '../../components/shared/AccessDenied'
import NotFound from '../../components/shared/NotFound'
import { Calendar, MapPin, Clock, ArrowLeft, CheckCircle, Upload, Loader2, X, FileImage, ZoomIn, ZoomOut } from 'lucide-react'

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [remainingTime, _setRemainingTime] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('BCA')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showBackModal, setShowBackModal] = useState(false)
  const [processingAction, setProcessingAction] = useState<'accept' | 'reject' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Image modal state
  const [showImageModal, setShowImageModal] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Countdown timer for expiration
  useEffect(() => {
    if (!transaction) return

    const updateRemainingTime = () => {
      if (transaction.status === 'WAITING_PAYMENT' && transaction.expiredAt) {
        const now = new Date().getTime()
        const expiry = new Date(transaction.expiredAt).getTime()
        const diff = expiry - now

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((diff % (1000 * 60)) / 1000)
          _setRemainingTime(`${hours}j ${minutes}m ${seconds}d`)
        } else {
          _setRemainingTime('Kedaluwarsa')
        }
      } else if (transaction.status === 'WAITING_CONFIRMATION') {
        // 3 days from updatedAt (when it became WAITING_CONFIRMATION)
        const updatedAt = new Date(transaction.updatedAt).getTime()
        const threeDaysInMs = 3 * 24 * 60 * 60 * 1000
        const expiry = updatedAt + threeDaysInMs
        const now = new Date().getTime()
        const diff = expiry - now

        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24))
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((diff % (1000 * 60)) / 1000)
          _setRemainingTime(`${days}h ${hours}j ${minutes}m ${seconds}d`)
        } else {
          _setRemainingTime('Auto-cancel')
        }
      }
    }

    updateRemainingTime()
    const interval = setInterval(updateRemainingTime, 1000)

    return () => clearInterval(interval)
  }, [transaction])

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault()
      setShowBackModal(true)
      // Push state to prevent actual navigation
      window.history.pushState(null, '', window.location.href)
    }

    window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const paymentMethods = {
    BCA: { bank: 'BCA (Bank Central Asia)', account: '1234567890', name: 'PT Belajar Indonesia' },
    BNI: { bank: 'BNI (Bank Negara Indonesia)', account: '0987654321', name: 'PT Belajar Indonesia' },
    Mandiri: { bank: 'Mandiri', account: '1122334455', name: 'PT Belajar Indonesia' },
    BRI: { bank: 'BRI (Bank Rakyat Indonesia)', account: '5544332211', name: 'PT Belajar Indonesia' },
    BTN: { bank: 'BTN (Bank Tabungan Negara)', account: '6677889900', name: 'PT Belajar Indonesia' },
    QRIS: { bank: 'QRIS', account: 'Scan QR Code', name: 'PT Belajar Indonesia' }
  }

  const fetchTransaction = async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      setErrorType(null)
      console.log('Fetching transaction with ID:', id, 'User role:', user?.role)
      
      // Use the same API for both organizers and customers
      // Backend now allows organizers to view transactions for their events
      const response = await transactionApi.getTransactionById(parseInt(id))
      console.log('Transaction fetched:', response.data)
      setTransaction(response.data)
    } catch (err: any) {
      console.error('Error fetching transaction:', err)
      const status = err.response?.status
      const message = err.response?.data?.message || err.message
      
      // Handle different HTTP status codes
      switch (status) {
        case 401:
          // Unauthorized - token invalid or expired
          logout()
          navigate('/login')
          return
        case 403:
          // Forbidden - transaction exists but user doesn't have access
          setErrorType(403)
          setError('Anda tidak memiliki akses ke transaksi ini')
          break
        case 404:
          // Not Found - transaction doesn't exist
          setErrorType(404)
          setError('Transaksi tidak ditemukan')
          break
        default:
          setError(message || 'Terjadi kesalahan saat mengambil data transaksi')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransaction()
  }, [id])

  // Polling: Auto-refresh transaction status every 5 seconds for real-time updates
  useEffect(() => {
    if (!transaction) return

    // Only poll for statuses that can change (WAITING_PAYMENT, WAITING_CONFIRMATION)
    const shouldPoll = ['WAITING_PAYMENT', 'WAITING_CONFIRMATION'].includes(transaction.status)
    if (!shouldPoll) return

    const pollInterval = setInterval(() => {
      console.log('Polling transaction status...')
      fetchTransaction()
    }, 5000) // 5 seconds

    return () => clearInterval(pollInterval)
  }, [transaction?.status, transaction?.id])

  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratis'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      WAITING_PAYMENT: 'bg-blue-100 text-blue-800',
      WAITING_CONFIRMATION: 'bg-yellow-100 text-yellow-800',
      DONE: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-red-100 text-red-800',
      CANCELED: 'bg-red-100 text-red-800',
    }

    const labels: Record<string, string> = {
      WAITING_PAYMENT: 'Menunggu Pembayaran',
      WAITING_CONFIRMATION: 'Menunggu Konfirmasi',
      DONE: 'Berhasil',
      REJECTED: 'Ditolak',
      EXPIRED: 'Kedaluwarsa',
      CANCELED: 'Dibatalkan',
    }

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    )
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File terlalu besar. Maksimal 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('Hanya file gambar yang diperbolehkan')
        return
      }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError(null)
    }
  }

  const handleUploadProof = async () => {
    if (!selectedFile || !transaction || !user) return

    setUploading(true)
    setError(null)

    try {
      console.log('Uploading payment proof via backend:', { 
        fileSize: selectedFile.size, 
        userId: user.id, 
        transactionId: transaction.id 
      })

      // Upload via backend API (includes Cloudinary upload + DB update)
      await cloudinaryApi.uploadPaymentProof(
        selectedFile,
        user.id,
        transaction.id
      )

      // Refresh transaction data
      await fetchTransaction()
      setSelectedFile(null)
    } catch (err: any) {
      console.error('Upload error:', err)
      const errorMessage = err.response?.data?.message || 'Gagal upload bukti pembayaran'
      // Add helpful message for tracking prevention issues
      if (errorMessage.includes('blocked') || errorMessage.includes('storage')) {
        setError('Upload gagal karena browser memblokir akses ke Cloudinary. Matikan "Prevent Cross-Site Tracking" di Safari atau gunakan browser lain (Chrome/Firefox).')
      } else {
        setError(errorMessage)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreviewUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCancel = async () => {
    setShowCancelModal(false)
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

  const handleAccept = async () => {
    if (!transaction) return
    try {
      setProcessingAction('accept')
      console.log('Accepting transaction:', transaction.id)
      await organizerApi.acceptTransaction(transaction.id)
      console.log('Transaction accepted successfully')
      // Refresh transaction data using the same method as fetchTransaction
      await fetchTransaction()
    } catch (err: any) {
      console.error('Error accepting transaction:', err)
      setError(err.response?.data?.message || err.message || 'Gagal menerima transaksi')
    } finally {
      setProcessingAction(null)
    }
  }

  const handleReject = async () => {
    if (!transaction) return
    try {
      setProcessingAction('reject')
      console.log('Rejecting transaction:', transaction.id)
      await organizerApi.rejectTransaction(transaction.id)
      console.log('Transaction rejected successfully')
      // Refresh transaction data using the same method as fetchTransaction
      await fetchTransaction()
    } catch (err: any) {
      console.error('Error rejecting transaction:', err)
      setError(err.response?.data?.message || err.message || 'Gagal menolak transaksi')
    } finally {
      setProcessingAction(null)
    }
  }

  const handleBackConfirm = () => {
    setShowBackModal(false)
    if (user?.role === 'ORGANIZER') {
      navigate('/organizer/transactions')
    } else {
      navigate('/my-transactions')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('id-ID')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!transaction) {
    // Show appropriate error component based on error type
    if (errorType === 403) {
      return (
        <div className="min-h-screen bg-gray-50 pt-20">
          <AccessDenied
            title="Akses Ditolak"
            message="Anda tidak memiliki akses ke transaksi ini"
            backUrl={user?.role === 'ORGANIZER' ? '/organizer/transactions' : '/my-transactions'}
            backLabel="Kembali ke Riwayat"
          />
        </div>
      )
    }

    if (errorType === 404) {
      return (
        <div className="min-h-screen bg-gray-50 pt-20">
          <NotFound
            title="Transaksi Tidak Ditemukan"
            message="Transaksi tidak ditemukan atau sudah tidak tersedia"
            backUrl={user?.role === 'ORGANIZER' ? '/organizer/transactions' : '/my-transactions'}
            backLabel="Kembali ke Riwayat"
          />
        </div>
      )
    }

    // Generic error or loading state
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Transaksi tidak ditemukan'}</p>
          <button
            onClick={() => user?.role === 'ORGANIZER' ? navigate('/organizer/transactions') : navigate('/my-transactions')}
            className="text-blue-600 hover:underline"
          >
            Kembali ke Riwayat Event
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-20 pt-20">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => user?.role === 'ORGANIZER' ? navigate('/organizer/transactions') : navigate('/my-transactions')}
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#e2d7ff] text-[#4e339c] font-semibold hover:bg-[#d8caff] transition-colors mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali</span>
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Status Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e2d7ff]/20 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Detail Transaksi
                </h1>
                {getStatusBadge(transaction.status)}
              </div>
              <p className="text-gray-600">
                Order ID: #{transaction.id}
              </p>
              <p className="text-gray-500 text-xs sm:text-sm">
                Dibuat pada {formatDate(transaction.createdAt)}
              </p>
            </div>

            {/* Buyer Information */}
            {(transaction as any).user && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#e2d7ff]/20 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Informasi Pembeli</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Nama Pembeli</span>
                    <span className="font-semibold text-gray-900">
                      {(transaction as any).user.firstName} {(transaction as any).user.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Email</span>
                    <span className="font-semibold text-gray-900">{(transaction as any).user.email}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Ticket Holder Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e2d7ff]/20 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Data Peserta</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Tiket Atas Nama</span>
                  <span className="font-semibold text-gray-900">
                    {transaction.attendeeDetails?.fullName || '-'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Jenis ID</span>
                  <span className="font-semibold text-gray-900">
                    {transaction.attendeeDetails?.idType || '-'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Nomor ID</span>
                  <span className="font-semibold text-gray-900">
                    {transaction.attendeeDetails?.idNumber || '-'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Nomor HP</span>
                  <span className="font-semibold text-gray-900">
                    {transaction.attendeeDetails?.phone || (transaction as any).user?.phone || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Event Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e2d7ff]/20 overflow-hidden">
              {/* Event Image */}
              {transaction.event.imageUrl ? (
                <img
                  src={transaction.event.imageUrl}
                  alt={transaction.event.title}
                  className="w-full h-48 sm:h-64 object-cover"
                />
              ) : (
                <div className="w-full h-48 sm:h-64 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-3xl sm:text-4xl font-bold">
                    {transaction.event.title[0]}
                  </span>
                </div>
              )}
              {/* Event Details */}
              <div className="p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Detail Event</h2>
                <h3 className="font-semibold text-lg mb-2">{transaction.event.title}</h3>
                <p className="text-gray-600 mb-4">
                  {transaction.event.organizer.firstName} {transaction.event.organizer.lastName}
                </p>
                <div className="space-y-2 text-sm text-gray-500">
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

            {/* Payment Timer - Live Countdown */}
            {remainingTime && (transaction.status === 'WAITING_PAYMENT' || transaction.status === 'WAITING_CONFIRMATION') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-yellow-600 animate-pulse" />
                  <h3 className="font-semibold text-yellow-800">
                    {transaction.status === 'WAITING_PAYMENT' ? 'Sisa Waktu Pembayaran' : 'Sisa Waktu Konfirmasi'}
                  </h3>
                </div>
                <p className="text-2xl font-bold text-yellow-700 font-mono">
                  {remainingTime}
                </p>
              </div>
            )}

            {/* Payment Information - Bank Transfer Details - Only show if not free */}
            {transaction.status === 'WAITING_PAYMENT' && transaction.totalAmount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Informasi Pembayaran</h3>
                
                {/* Payment Method Selection */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Pilih Metode Pembayaran:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.keys(paymentMethods).map((method) => (
                      <button
                        key={method}
                        onClick={() => setSelectedPaymentMethod(method)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedPaymentMethod === method
                            ? 'bg-blue-600 text-white border-2 border-blue-600'
                            : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 border border-blue-100">
                    <p className="text-sm text-gray-600 mb-1">Bank</p>
                    <p className="font-semibold text-gray-900">{paymentMethods[selectedPaymentMethod as keyof typeof paymentMethods].bank}</p>
                  </div>
                  
                  {selectedPaymentMethod === 'QRIS' ? (
                    <div className="bg-white rounded-xl p-4 border border-blue-100 flex flex-col items-center">
                      <p className="text-sm text-gray-600 mb-3">QR Code</p>
                      <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center mb-2 border-2 border-gray-200">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=LEARNHUB-${transaction.id}-${formatPrice(transaction.totalAmount).replace(/[^0-9]/g, '')}`}
                          alt="QRIS QR Code"
                          className="w-40 h-40"
                        />
                      </div>
                      <p className="text-xs text-gray-500">Scan QR code untuk pembayaran</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl p-4 border border-blue-100">
                      <p className="text-sm text-gray-600 mb-1">Nomor Rekening</p>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 text-lg">
                          {paymentMethods[selectedPaymentMethod as keyof typeof paymentMethods].account}
                        </p>
                        <button className="text-blue-600 text-sm hover:underline">Salin</button>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-white rounded-xl p-4 border border-blue-100">
                    <p className="text-sm text-gray-600 mb-1">Atas Nama</p>
                    <p className="font-semibold text-gray-900">{paymentMethods[selectedPaymentMethod as keyof typeof paymentMethods].name}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-blue-100">
                    <p className="text-sm text-gray-600 mb-1">Total yang harus dibayar</p>
                    <p className="font-bold text-gray-900 text-xl">{formatPrice(transaction.totalAmount)}</p>
                  </div>
                  <div className="text-sm text-gray-600 bg-blue-100/50 rounded-xl p-3">
                    <p className="font-medium text-blue-900 mb-1">Instruksi Pembayaran:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-800">
                      <li>Pilih metode pembayaran di atas</li>
                      <li>{selectedPaymentMethod === 'QRIS' ? 'Scan QR code untuk pembayaran' : 'Transfer ke rekening yang sesuai sesuai total yang harus dibayar'}</li>
                      <li>Screenshot bukti transfer</li>
                      <li>Unggah bukti transfer di bawah ini (maksimal 2 jam)</li>
                      <li>Tunggu konfirmasi dari organizer (maksimal 3 hari)</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* Free Transaction - Auto Confirm */}
            {transaction.status === 'WAITING_PAYMENT' && transaction.totalAmount === 0 && user?.role !== 'ORGANIZER' && (
              <div className="bg-green-50 rounded-2xl shadow-sm border border-green-200 p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Event Gratis!</h3>
                  <p className="text-green-700 mb-4">
                    Transaksi ini tidak memerlukan pembayaran. Klik tombol di bawah untuk langsung konfirmasi.
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        setLoading(true)
                        // For free transactions, auto-confirm by updating status directly
                        await api.put(`/transactions/${transaction.id}/confirm-free`, {})
                        await fetchTransaction()
                      } catch (err: any) {
                        setError(err.response?.data?.message || 'Gagal mengkonfirmasi transaksi')
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Konfirmasi Pesanan
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            {transaction.status === 'WAITING_PAYMENT' && transaction.totalAmount > 0 && user?.role !== 'ORGANIZER' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#e2d7ff]/20 p-6">
                <h3 className="text-lg font-semibold mb-4">Unggah Bukti Pembayaran</h3>
                
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">⚠️</span>
                      <div className="flex-1">
                        <p className="text-red-700 text-sm font-medium">{error}</p>
                        <p className="text-red-500 text-xs mt-1">
                          Silakan coba lagi atau gunakan file yang berbeda
                        </p>
                      </div>
                      <button
                        onClick={() => setError(null)}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  {/* File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {!selectedFile ? (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center gap-2"
                    >
                      <FileImage className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600">Klik untuk pilih bukti pembayaran</span>
                      <span className="text-xs text-gray-400">Format: JPG, PNG (Max 5MB)</span>
                    </button>
                  ) : (
                    <div className="relative">
                      <img
                        src={previewUrl || undefined}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-xl"
                      />
                      <button
                        onClick={handleRemoveFile}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-sm text-gray-600 mt-2">{selectedFile.name}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleUploadProof}
                    disabled={!selectedFile || uploading}
                    className="w-full bg-[#4a3fe2] text-white py-3 rounded-xl font-semibold hover:bg-[#3d2fd6] disabled:bg-gray-300 flex items-center justify-center gap-2"
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
                    onClick={() => setShowCancelModal(true)}
                    className="w-full border border-red-300 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-50"
                  >
                    Batalkan Transaksi
                  </button>
                </div>
              </div>
            )}

            {/* Payment Success Info - Show for DONE status */}
            {transaction.status === 'DONE' && (
              <div className="bg-green-50 rounded-2xl shadow-sm p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-800">Pembayaran Berhasil!</h3>
                    <p className="text-sm text-green-600">
                      {user?.role === 'ORGANIZER' ? 'Pembeli telah mengunggah bukti pembayaran dan pembayaran telah disetujui' : 'Anda telah mengunggah bukti pembayaran dan pembayaran telah disetujui oleh penyelenggara'}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-green-100">
                    <span className="text-gray-600">Status Pembayaran</span>
                    <span className="font-semibold text-green-700">Terverifikasi ✓</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-green-100">
                    <span className="text-gray-600">Total Dibayar</span>
                    <span className="font-semibold text-green-700">{formatPrice(transaction.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-green-100">
                    <span className="text-gray-600">Tanggal Transaksi</span>
                    <span className="font-semibold text-gray-800">{new Date(transaction.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Order ID</span>
                    <span className="font-semibold text-gray-800">#{transaction.id}</span>
                  </div>
                </div>
                {transaction.paymentProofUrl && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {user?.role === 'ORGANIZER' ? 'Bukti Pembayaran Pembeli:' : 'Bukti Pembayaran Anda:'}
                    </p>
                    <img
                      src={transaction.paymentProofUrl}
                      alt="Payment Proof"
                      className="w-full h-32 object-contain rounded-xl border border-green-200 bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setShowImageModal(true)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Waiting Confirmation Info - Show for WAITING_CONFIRMATION status */}
            {transaction.status === 'WAITING_CONFIRMATION' && (
              <div className="bg-yellow-50 rounded-2xl shadow-sm p-6 border border-yellow-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800">Menunggu Konfirmasi</h3>
                    <p className="text-sm text-yellow-600">
                      {user?.role === 'ORGANIZER' ? 'Pembeli telah mengunggah bukti pembayaran, menunggu persetujuan Anda' : 'Anda telah mengunggah bukti pembayaran, menunggu persetujuan dari penyelenggara'}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-yellow-100">
                    <span className="text-gray-600">Status Transaksi</span>
                    <span className="font-semibold text-yellow-700">Menunggu Konfirmasi</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-yellow-100">
                    <span className="text-gray-600">Total Dibayar</span>
                    <span className="font-semibold text-yellow-700">{formatPrice(transaction.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-yellow-100">
                    <span className="text-gray-600">Tanggal Transaksi</span>
                    <span className="font-semibold text-gray-800">{new Date(transaction.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Order ID</span>
                    <span className="font-semibold text-gray-800">#{transaction.id}</span>
                  </div>
                </div>
                {transaction.paymentProofUrl && (
                  <div className="mt-4 pt-4 border-t border-yellow-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {user?.role === 'ORGANIZER' ? 'Bukti Pembayaran Pembeli:' : 'Bukti Pembayaran Anda:'}
                    </p>
                    <img
                      src={transaction.paymentProofUrl}
                      alt="Payment Proof"
                      className="w-full h-32 object-contain rounded-xl border border-yellow-200 bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setShowImageModal(true)}
                    />
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    {user?.role === 'ORGANIZER' 
                      ? 'Silakan verifikasi bukti pembayaran dan setujui atau tolak transaksi.' 
                      : 'Penyelenggara sedang memverifikasi bukti pembayaran Anda. Anda akan menerima notifikasi setelah transaksi disetujui atau ditolak.'}
                  </p>
                </div>
                {/* Accept/Reject Buttons - Only for Organizers */}
                {user?.role === 'ORGANIZER' && (
                  <div className="mt-4 pt-4 border-t border-yellow-200 flex gap-3">
                    <button
                      onClick={handleReject}
                      disabled={processingAction === 'reject'}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {processingAction === 'reject' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          Tolak
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleAccept}
                      disabled={processingAction === 'accept'}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {processingAction === 'accept' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Terima
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Rejected Info - Show for REJECTED status */}
            {transaction.status === 'REJECTED' && (
              <div className="bg-red-50 rounded-2xl shadow-sm p-6 border border-red-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">Pembayaran Ditolak</h3>
                    <p className="text-sm text-red-600">
                      {user?.role === 'ORGANIZER' ? 'Pembeli telah mengunggah bukti pembayaran, namun Anda menolak pembayaran tersebut' : 'Anda telah mengunggah bukti pembayaran, namun penyelenggara menolak pembayaran tersebut'}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-red-100">
                    <span className="text-gray-600">Status Transaksi</span>
                    <span className="font-semibold text-red-700">Ditolak</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-red-100">
                    <span className="text-gray-600">Tanggal Transaksi</span>
                    <span className="font-semibold text-gray-800">{new Date(transaction.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-red-100">
                    <span className="text-gray-600">Order ID</span>
                    <span className="font-semibold text-gray-800">#{transaction.id}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Poin Digunakan</span>
                    <span className="font-semibold text-gray-800">{transaction.pointsUsed > 0 ? `${transaction.pointsUsed} poin` : '0 poin'}</span>
                  </div>
                </div>
                {transaction.paymentProofUrl && (
                  <div className="mt-4 pt-4 border-t border-red-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {user?.role === 'ORGANIZER' ? 'Bukti Pembayaran Pembeli:' : 'Bukti Pembayaran Anda:'}
                    </p>
                    <img
                      src={transaction.paymentProofUrl}
                      alt="Payment Proof"
                      className="w-full h-32 object-contain rounded-xl border border-red-200 bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setShowImageModal(true)}
                    />
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-red-200">
                  <p className="text-sm text-red-800">
                    {user?.role === 'ORGANIZER' 
                      ? 'Poin dan kursi yang digunakan telah dikembalikan ke akun pembeli.' 
                      : 'Poin dan kursi yang digunakan telah dikembalikan ke akun Anda. Silakan coba lagi dengan bukti pembayaran yang valid.'}
                  </p>
                </div>
              </div>
            )}

            {/* Expired Info - Show for EXPIRED status */}
            {transaction.status === 'EXPIRED' && (
              <div className="bg-orange-50 rounded-2xl shadow-sm p-6 border border-orange-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-orange-800">Transaksi Kedaluwarsa</h3>
                    <p className="text-sm text-orange-600">
                      {user?.role === 'ORGANIZER' ? 'Pembeli telah melakukan pembelian, namun tidak mengunggah bukti pembayaran dalam waktu yang ditentukan' : 'Anda telah melakukan pembelian, namun tidak mengunggah bukti pembayaran dalam waktu yang ditentukan'}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-orange-100">
                    <span className="text-gray-600">Status Transaksi</span>
                    <span className="font-semibold text-orange-700">Kedaluwarsa</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-orange-100">
                    <span className="text-gray-600">Tanggal Transaksi</span>
                    <span className="font-semibold text-gray-800">{new Date(transaction.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-orange-100">
                    <span className="text-gray-600">Order ID</span>
                    <span className="font-semibold text-gray-800">#{transaction.id}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Poin Digunakan</span>
                    <span className="font-semibold text-gray-800">{transaction.pointsUsed > 0 ? `${transaction.pointsUsed} poin` : '0 poin'}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-orange-200">
                  <p className="text-sm text-orange-800">
                    {user?.role === 'ORGANIZER' 
                      ? 'Poin dan kursi yang digunakan telah dikembalikan ke akun pembeli.' 
                      : 'Poin dan kursi yang digunakan telah dikembalikan ke akun Anda. Silakan lakukan pembelian baru jika masih ingin mengikuti event ini.'}
                  </p>
                </div>
              </div>
            )}

            {/* Cancellation Info - Show for CANCELED status */}
            {transaction.status === 'CANCELED' && (
              <div className="bg-yellow-50 rounded-2xl shadow-sm p-6 border border-yellow-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <X className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800">Transaksi Dibatalkan</h3>
                    <p className="text-sm text-yellow-600">
                      {user?.role === 'ORGANIZER' ? 'Transaksi ini dibatalkan oleh pembeli' : 'Transaksi ini dibatalkan oleh Anda'}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-yellow-100">
                    <span className="text-gray-600">Status Transaksi</span>
                    <span className="font-semibold text-yellow-700">Dibatalkan</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-yellow-100">
                    <span className="text-gray-600">Tanggal Transaksi</span>
                    <span className="font-semibold text-gray-800">{new Date(transaction.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-yellow-100">
                    <span className="text-gray-600">Order ID</span>
                    <span className="font-semibold text-gray-800">#{transaction.id}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Poin Digunakan</span>
                    <span className="font-semibold text-gray-800">{transaction.pointsUsed > 0 ? `${transaction.pointsUsed} poin` : '0 poin'}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    {user?.role === 'ORGANIZER' 
                      ? 'Poin dan kursi yang digunakan telah dikembalikan ke akun pembeli.' 
                      : 'Poin dan kursi yang digunakan telah dikembalikan ke akun Anda. Anda dapat melakukan transaksi baru untuk event ini jika masih tersedia.'}
                  </p>
                </div>
              </div>
            )}

            {/* Review Button - Only for customers */}
            {transaction.status === 'DONE' && !transaction.review && user?.role !== 'ORGANIZER' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#e2d7ff]/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Event Selesai</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Bagaimana pengalaman Anda dengan event ini?
                </p>
                <button
                  onClick={() => navigate(`/review/${transaction.id}`)}
                  className="w-full bg-[#4a3fe2] text-white py-3 rounded-xl font-semibold hover:bg-[#3d2fd6]"
                >
                  Beri Ulasan
                </button>
              </div>
            )}
          </div>

          {/* Sidebar - Order Summary */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <div className="bg-white rounded-2xl shadow-sm border border-[#e2d7ff]/20 p-4 sm:p-6 lg:sticky lg:top-24">
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

                <div className="flex justify-between text-gray-600">
                  <span>PPN (11%)</span>
                  <span>{formatPrice(transaction.totalAmount - (transaction.subtotal - transaction.pointsUsed - transaction.voucherDiscount))}</span>
                </div>

                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(transaction.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Review Info */}
              {transaction.review && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {user?.role === 'ORGANIZER' ? 'Ulasan Pembeli' : 'Ulasan Anda'}
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

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#32294f]/40 backdrop-blur-md p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 text-center shadow-2xl border border-[#b2a6d5]/20">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-extrabold text-[#32294f] mb-3">Batalkan Transaksi?</h3>
            <p className="text-[#5f557f] mb-6">
              Anda akan membatalkan transaksi ini. Poin dan voucher yang digunakan akan dikembalikan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 rounded-xl text-[#6249b2] font-bold hover:bg-[#d8caff] transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back Button Confirmation Modal */}
      {showBackModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#32294f]/40 backdrop-blur-md p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 text-center shadow-2xl border border-[#b2a6d5]/20">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowLeft className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-extrabold text-[#32294f] mb-3">Keluar dari Halaman Ini?</h3>
            <p className="text-[#5f557f] mb-6">
              Anda akan keluar dari halaman detail transaksi.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBackModal(false)}
                className="flex-1 py-3 rounded-xl text-[#6249b2] font-bold hover:bg-[#d8caff] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleBackConfirm}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Fullscreen Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          {/* Close Button */}
          <button
            onClick={() => {
              setShowImageModal(false)
              setZoomLevel(1)
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-[101]"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Zoom Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/20 rounded-full p-2 z-[101]">
            <button
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
              className="p-2 rounded-full hover:bg-white/30 transition-colors"
              disabled={zoomLevel <= 0.5}
            >
              <ZoomOut className="w-5 h-5 text-white" />
            </button>
            <span className="text-white text-sm font-medium min-w-[50px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}
              className="p-2 rounded-full hover:bg-white/30 transition-colors"
              disabled={zoomLevel >= 3}
            >
              <ZoomIn className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Image Container */}
          <div 
            className="w-full h-full flex items-center justify-center overflow-auto cursor-grab active:cursor-grabbing"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowImageModal(false)
                setZoomLevel(1)
              }
            }}
          >
            <img
              src={transaction?.paymentProofUrl || ''}
              alt="Payment Proof Fullscreen"
              className="max-w-full max-h-full transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
