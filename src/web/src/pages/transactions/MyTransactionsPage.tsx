import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { transactionApi, Transaction } from '../../features/transactions/api/transactionApi'
import { Calendar, MapPin, ArrowLeft, Loader2, Star } from 'lucide-react'

export default function MyTransactionsPage() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const response = await transactionApi.getMyTransactions(filter || undefined)
        setTransactions(response.data)
      } catch (err) {
        setError('Gagal memuat transaksi')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [filter])

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          <span>Kembali</span>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Transaksi Saya</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === '' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            Semua
          </button>
          {['WAITING_PAYMENT', 'WAITING_CONFIRMATION', 'DONE', 'CANCELED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === status ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              {getStatusBadge(status).props.children}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                onClick={() => navigate(`/transactions/${transaction.id}`)}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Event Image */}
                  {transaction.event.imageUrl ? (
                    <img
                      src={transaction.event.imageUrl}
                      alt={transaction.event.title}
                      className="w-full md:w-32 h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full md:w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {transaction.event.title[0]}
                      </span>
                    </div>
                  )}

                  {/* Transaction Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold">{transaction.event.title}</h3>
                      {getStatusBadge(transaction.status)}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600 mb-4">
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

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{transaction.ticketCount} tiket</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(transaction.totalAmount)}
                        </p>
                      </div>

                      {/* Review Badge */}
                      {transaction.status === 'DONE' && (
                        <div className="flex items-center gap-2">
                          {transaction.review ? (
                            <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                              <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                              <span className="text-yellow-800 font-medium">
                                {transaction.review.rating}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-green-600 font-medium">
                              Bisa diulas
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
