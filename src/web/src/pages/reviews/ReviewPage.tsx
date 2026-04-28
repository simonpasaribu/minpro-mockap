import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { reviewApi } from '../../features/reviews/api/reviewApi'
import { transactionApi } from '../../features/transactions/api/transactionApi'
import { organizerApi } from '../../features/organizers/api/organizerApi'
import { useAuth } from '../../features/auth/components/AuthContext'
import { Star, ArrowLeft, Loader2 } from 'lucide-react'

interface TransactionDetail {
  id: number
  event: {
    id: number
    title: string
    imageUrl: string | null
    startDate: string
  }
}

export default function ReviewPage() {
  const { transactionId } = useParams<{ transactionId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [canReview, setCanReview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!transactionId) return
      try {
        setLoading(true)

        // Check if can review
        const canReviewRes = await reviewApi.canReview(parseInt(transactionId))
        setCanReview(canReviewRes.data.canReview)

        if (!canReviewRes.data.canReview) {
          setError(canReviewRes.data.reason || 'Tidak dapat memberikan ulasan')
        }

        // Get transaction details - use organizer API for organizers
        let transactionData
        if (user?.role === 'ORGANIZER') {
          const transactions = await organizerApi.getTransactions()
          const foundTransaction = transactions.find((t) => t.id === parseInt(transactionId))
          if (foundTransaction) {
            // Adapt organizer Transaction structure to match TransactionDetail interface
            transactionData = {
              id: foundTransaction.id,
              event: {
                id: foundTransaction.event.id,
                title: foundTransaction.event.title,
                imageUrl: null, // organizer API doesn't provide imageUrl
                startDate: foundTransaction.event.startDate
              }
            }
          } else {
            setError('Transaksi tidak ditemukan')
          }
        } else {
          const transactionRes = await transactionApi.getTransactionById(parseInt(transactionId))
          transactionData = transactionRes.data
        }

        if (transactionData) {
          setTransaction(transactionData)
        }
      } catch (err: any) {
        console.error('Error loading review page:', err)
        setError(err.response?.data?.message || err.message || 'Gagal memuat data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [transactionId, user])

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Silakan pilih rating')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      await reviewApi.createReview({
        transactionId: parseInt(transactionId!),
        rating,
        comment,
      })

      navigate(`/transactions/${transactionId}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengirim ulasan')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error && !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/my-transactions')}
            className="text-blue-600 hover:underline"
          >
            Kembali ke Transaksi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Back Button */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        <button
          onClick={() => navigate(`/transactions/${transactionId}`)}
          className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#e2d7ff] text-[#4e339c] font-semibold hover:bg-[#d8caff] transition-colors mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="max-w-2xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
          Beri Ulasan
        </h1>

        {/* Event Info */}
        {transaction && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex gap-3 sm:gap-4">
              {transaction.event.imageUrl ? (
                <img
                  src={transaction.event.imageUrl}
                  alt={transaction.event.title}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg sm:text-xl font-bold">
                    {transaction.event.title[0]}
                  </span>
                </div>
              )}
              <div>
                <h2 className="font-semibold text-base sm:text-lg">{transaction.event.title}</h2>
                <p className="text-gray-600 text-xs sm:text-sm">
                  {new Date(transaction.event.startDate).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Review Form */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {rating > 0 && (
                <>
                  {rating === 1 && 'Sangat Buruk'}
                  {rating === 2 && 'Buruk'}
                  {rating === 3 && 'Cukup'}
                  {rating === 4 && 'Baik'}
                  {rating === 5 && 'Sangat Baik'}
                </>
              )}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Komentar (Opsional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Bagikan pengalaman Anda..."
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm mb-4">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !canReview}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Mengirim...
              </>
            ) : (
              'Kirim Ulasan'
            )}
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}
