import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { reviewApi } from '../../features/reviews/api/reviewApi'
import { transactionApi } from '../../features/transactions/api/transactionApi'
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
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [canReview, setCanReview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

        // Get transaction details
        const transactionRes = await transactionApi.getTransactionById(parseInt(transactionId))
        setTransaction(transactionRes.data)
      } catch (err) {
        setError('Gagal memuat data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [transactionId])

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(`/transactions/${transactionId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali</span>
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Beri Ulasan
        </h1>

        {/* Event Info */}
        {transaction && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex gap-4">
              {transaction.event.imageUrl ? (
                <img
                  src={transaction.event.imageUrl}
                  alt={transaction.event.title}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {transaction.event.title[0]}
                  </span>
                </div>
              )}
              <div>
                <h2 className="font-semibold text-lg">{transaction.event.title}</h2>
                <p className="text-gray-600">
                  {new Date(transaction.event.startDate).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Review Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
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
  )
}
