import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { transactionApi, Transaction } from '../../features/transactions/api/transactionApi'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'

export default function MyTransactionsPage() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orderFilter, setOrderFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const response = await transactionApi.getMyTransactions()
        setTransactions(response.data?.data || response.data || [])
      } catch (err) {
        setError('Gagal memuat transaksi')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  // Filter transactions based on orderFilter
  const filteredTransactions = useMemo(() => {
    let filtered = transactions
    if (orderFilter === 'all') {
      filtered = transactions
    } else {
      filtered = transactions.filter(t => {
        if (orderFilter === 'success') return t.status === 'DONE'
        if (orderFilter === 'pending') return t.status === 'WAITING_PAYMENT' || t.status === 'WAITING_CONFIRMATION'
        if (orderFilter === 'failed') return t.status === 'REJECTED' || t.status === 'EXPIRED' || t.status === 'CANCELED'
        return true
      })
    }
    // Sort by newest (createdAt descending)
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [transactions, orderFilter])

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Count for each filter
  const filterCounts = {
    all: transactions.length,
    success: transactions.filter(t => t.status === 'DONE').length,
    pending: transactions.filter(t => t.status === 'WAITING_PAYMENT' || t.status === 'WAITING_CONFIRMATION').length,
    failed: transactions.filter(t => t.status === 'REJECTED' || t.status === 'EXPIRED' || t.status === 'CANCELED').length,
  }

  // Calculate totals for summary bar (always based on all transactions, not filtered)
  const totalSpending = transactions
    .filter(t => t.status === 'DONE')
    .reduce((sum, t) => sum + t.totalAmount, 0)
  
  const upcomingEvents = filteredTransactions.filter(t => 
    t.status === 'DONE' && new Date(t.event.startDate) > new Date()
  ).length

  const getStatusLabel = (status: string) => {
    if (status === 'DONE') return 'Berhasil'
    if (status === 'WAITING_PAYMENT') return 'Menunggu Pembayaran'
    if (status === 'WAITING_CONFIRMATION') return 'Menunggu Konfirmasi'
    if (status === 'REJECTED') return 'Ditolak'
    if (status === 'EXPIRED') return 'Kadaluarsa'
    if (status === 'CANCELED') return 'Dibatalkan'
    return status
  }

  const getFilterLabel = (filter: string) => {
    if (filter === 'all') return ''
    if (filter === 'success') return 'berhasil'
    if (filter === 'pending') return 'menunggu'
    if (filter === 'failed') return 'gagal'
    return filter
  }

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

        {/* Title Section */}
        <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-12">
          <div className="w-2 h-10 sm:h-12 bg-[#4a3fe2] rounded-full"></div>
          <h1 className="font-bold text-2xl sm:text-4xl tracking-tight text-[#32294f]">Riwayat Transaksi</h1>
        </div>

        {/* Layout Wrapper */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start">
          {/* Side Navigation Filters */}
          <aside className="lg:col-span-3 space-y-4 sm:space-y-6">
            <div className="bg-[#f5eeff] p-3 sm:p-6 rounded-xl">
              <h3 className="font-bold text-sm sm:text-lg mb-2 sm:mb-4 text-[#32294f] hidden sm:block">Filter Status</h3>
              <nav className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                <button
                  onClick={() => { setOrderFilter('all'); setCurrentPage(1) }}
                  className={`flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-full font-semibold text-xs sm:text-sm ${
                    orderFilter === 'all' 
                      ? 'bg-[#4a3fe2] text-white' 
                      : 'text-[#5f557f] hover:bg-[#e8deff] transition-colors'
                  }`}
                >
                  <span className="truncate">Semua</span>
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs ml-1 ${
                    orderFilter === 'all' ? 'bg-white/20' : 'bg-[#e2d7ff] text-[#5f557f]'
                  }`}>{filterCounts.all}</span>
                </button>
                <button
                  onClick={() => { setOrderFilter('success'); setCurrentPage(1) }}
                  className={`flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-full font-semibold text-xs sm:text-sm ${
                    orderFilter === 'success' 
                      ? 'bg-[#e2d7ff] text-[#4a3fe2]' 
                      : 'text-[#5f557f] hover:bg-[#e8deff] transition-colors'
                  }`}
                >
                  <span className="truncate">Berhasil</span>
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs ml-1 ${
                    orderFilter === 'success' ? 'bg-white/20' : 'bg-[#e2d7ff] text-[#5f557f]'
                  }`}>{filterCounts.success}</span>
                </button>
                <button
                  onClick={() => { setOrderFilter('pending'); setCurrentPage(1) }}
                  className={`flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-full font-semibold text-xs sm:text-sm ${
                    orderFilter === 'pending' 
                      ? 'bg-[#d8caff] text-[#4e339c]' 
                      : 'text-[#5f557f] hover:bg-[#e8deff] transition-colors'
                  }`}
                >
                  <span className="truncate">Menunggu</span>
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs ml-1 ${
                    orderFilter === 'pending' ? 'bg-white/20' : 'bg-[#e2d7ff] text-[#5f557f]'
                  }`}>{filterCounts.pending}</span>
                </button>
                <button
                  onClick={() => { setOrderFilter('failed'); setCurrentPage(1) }}
                  className={`flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-full font-semibold text-xs sm:text-sm ${
                    orderFilter === 'failed' 
                      ? 'bg-[#fd8bca]/20 text-[#983772]' 
                      : 'text-[#5f557f] hover:bg-[#e8deff] transition-colors'
                  }`}
                >
                  <span className="truncate">Gagal</span>
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs ml-1 ${
                    orderFilter === 'failed' ? 'bg-white/20' : 'bg-[#e2d7ff] text-[#5f557f]'
                  }`}>{filterCounts.failed}</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Table Section */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(50,41,79,0.08)] overflow-hidden">
              {/* Desktop Table - Hidden on mobile */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-[#f5eeff]/50">
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center w-[30%]">Detail Event</th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center w-[15%]">Tanggal</th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center w-[15%]">Harga</th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center w-[20%]">Status</th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center w-[20%]">Ket</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#b2a6d5]/10">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-24 text-center">
                          <p className="text-base text-[#32294f]/40">Memuat...</p>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan={5} className="py-24 text-center">
                          <p className="text-base text-red-500">{error}</p>
                        </td>
                      </tr>
                    ) : paginatedTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-24 text-center">
                          <p className="text-base text-[#32294f]/40">
                            {orderFilter === 'all' ? 'Belum ada riwayat transaksi' : `Tidak ada transaksi ${getFilterLabel(orderFilter)}`}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      paginatedTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-[#f5eeff]/30 transition-colors h-20">
                          <td className="px-6 h-20 align-middle">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                <img 
                                  alt={transaction.event.title}
                                  className="w-full h-full object-cover"
                                  src={transaction.event.imageUrl || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=100&q=80'}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=100&q=80';
                                  }}
                                />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-[#32294f] leading-tight mb-1">{transaction.event.title}</p>
                                <p className="text-xs text-[#5f557f] font-medium">Pesanan #{transaction.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 h-20 align-middle text-center text-sm text-[#32294f] whitespace-nowrap">
                            {new Date(transaction.event.startDate).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-6 h-20 align-middle text-center font-bold text-sm text-[#4a3fe2] whitespace-nowrap">
                            {transaction.totalAmount === 0 ? 'Gratis' : `Rp ${transaction.totalAmount.toLocaleString()}`}
                          </td>
                          <td className="px-6 h-20 align-middle text-center">
                            <span className={`inline-flex items-center justify-center px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-tighter min-w-[140px] min-h-[36px] text-center leading-tight ${
                              transaction.status === 'DONE' ? 'bg-green-100 text-green-700' :
                              transaction.status === 'WAITING_CONFIRMATION' ? 'bg-yellow-100 text-yellow-700' :
                              transaction.status === 'WAITING_PAYMENT' ? 'bg-blue-100 text-blue-700' :
                              transaction.status === 'REJECTED' || transaction.status === 'EXPIRED' || transaction.status === 'CANCELED' ? 'bg-red-100 text-red-700' :
                              'bg-[#e8deff] text-[#4a3fe2]'
                            }`}>
                              {getStatusLabel(transaction.status)}
                            </span>
                          </td>
                          <td className="px-6 h-20 align-middle text-center">
                            <button
                              onClick={() => navigate(`/transactions/${transaction.id}`)}
                              className="text-sm font-bold text-[#4a3fe2] hover:underline underline-offset-4 whitespace-nowrap"
                            >
                              Lihat Detail
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                    {/* Empty rows to maintain fixed height of 10 rows per page */}
                    {!loading && !error && paginatedTransactions.length > 0 && paginatedTransactions.length < itemsPerPage && (
                      Array.from({ length: itemsPerPage - paginatedTransactions.length }).map((_, index) => (
                        <tr key={`empty-${index}`} className="h-20">
                          <td colSpan={5} className="px-6"></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List - Visible only on mobile */}
              <div className="sm:hidden">
                {loading ? (
                  <div className="py-16 text-center">
                    <p className="text-base text-[#32294f]/40">Memuat...</p>
                  </div>
                ) : error ? (
                  <div className="py-16 text-center">
                    <p className="text-base text-red-500">{error}</p>
                  </div>
                ) : paginatedTransactions.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-base text-[#32294f]/40">
                      {orderFilter === 'all' ? 'Belum ada riwayat transaksi' : `Tidak ada transaksi ${getFilterLabel(orderFilter)}`}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#b2a6d5]/10">
                    {paginatedTransactions.map((transaction) => (
                      <div key={transaction.id} className="p-4">
                        {/* Header: Thumbnail + Event Info */}
                        <div className="flex gap-3 mb-3">
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              alt={transaction.event.title}
                              className="w-full h-full object-cover"
                              src={transaction.event.imageUrl || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=100&q=80'}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=100&q=80';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-[#32294f] leading-tight mb-1 line-clamp-2">{transaction.event.title}</p>
                            <p className="text-xs text-[#5f557f] font-medium">Pesanan #{transaction.id}</p>
                          </div>
                        </div>
                        
                        {/* Date & Price Row */}
                        <div className="flex justify-between items-start mb-3 text-sm">
                          <div>
                            <span className="text-[#5f557f] text-xs">Tanggal: </span>
                            <span className="text-[#32294f]">{new Date(transaction.event.startDate).toLocaleDateString('id-ID')}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[#5f557f] text-xs block">Harga</span>
                            <span className="font-bold text-[#4a3fe2]">{transaction.totalAmount === 0 ? 'Gratis' : `Rp ${transaction.totalAmount.toLocaleString()}`}</span>
                          </div>
                        </div>
                        
                        {/* Status & Action Row */}
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                            transaction.status === 'DONE' ? 'bg-green-100 text-green-700' :
                            transaction.status === 'WAITING_CONFIRMATION' ? 'bg-yellow-100 text-yellow-700' :
                            transaction.status === 'WAITING_PAYMENT' ? 'bg-blue-100 text-blue-700' :
                            transaction.status === 'REJECTED' || transaction.status === 'EXPIRED' || transaction.status === 'CANCELED' ? 'bg-red-100 text-red-700' :
                            'bg-[#e8deff] text-[#4a3fe2]'
                          }`}>
                            {getStatusLabel(transaction.status)}
                          </span>
                          <button
                            onClick={() => navigate(`/transactions/${transaction.id}`)}
                            className="text-sm font-bold text-[#4a3fe2] hover:underline underline-offset-4"
                          >
                            Lihat Detail
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {filteredTransactions.length > 0 && (
                <div className="px-6 py-8 flex items-center justify-between border-t border-[#e2d7ff]">
                  <span className="text-xs text-[#5f557f]">
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} dari {filteredTransactions.length} transaksi
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-10 h-10 rounded-full border border-[#b2a6d5]/30 flex items-center justify-center hover:bg-[#f5eeff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                          currentPage === page
                            ? 'bg-[#4a3fe2] text-white'
                            : 'border border-[#b2a6d5]/30 hover:bg-[#f5eeff] transition-colors'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 rounded-full border border-[#b2a6d5]/30 flex items-center justify-center hover:bg-[#f5eeff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Summary Bar */}
            {filteredTransactions.length > 0 && (
              <div className="mt-8 bg-white/80 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(50,41,79,0.08)] rounded-full px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-center gap-4 sm:gap-24 border border-white/40">
                <div className="flex flex-col text-center flex-1">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#5f557f]/60">Harga</span>
                  <span className="font-bold text-base sm:text-lg text-[#4a3fe2]">Rp {totalSpending.toLocaleString()}</span>
                </div>
                <div className="w-px h-8 sm:h-10 bg-[#b2a6d5]/20"></div>
                <div className="flex flex-col text-center flex-1">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#5f557f]/60">Event Mendatang</span>
                  <span className="font-bold text-base sm:text-lg text-[#32294f]">{upcomingEvents} Tiket</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
