import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { organizerApi, Transaction } from '../../features/organizers/api/organizerApi'
import {
  ArrowLeft,
  Search,
  Filter,
  Clock,
  Calendar,
  DollarSign,
  Users,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react'

type SortOption = 'newest' | 'oldest' | 'priceHigh' | 'priceLow'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'oldest', label: 'Terlama' },
  { value: 'priceHigh', label: 'Harga Tinggi → Rendah' },
  { value: 'priceLow', label: 'Harga Rendah → Tinggi' },
]

export default function OrganizerTransactionsPage() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false)

  const filterOptions = [
    { value: '', label: 'Semua' },
    { value: 'WAITING', label: 'Menunggu' },
    { value: 'DONE', label: 'Berhasil' },
    { value: 'FAILED', label: 'Gagal' },
  ]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchTransactions()
    setCurrentPage(1)
  }, [statusFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      // Map custom filter values to API filter values
      let apiFilter = statusFilter
      if (statusFilter === 'WAITING') {
        // Fetch all and filter client-side for WAITING_PAYMENT and WAITING_CONFIRMATION
        apiFilter = ''
      } else if (statusFilter === 'FAILED') {
        // Fetch all and filter client-side for EXPIRED, CANCELLED, and REJECTED
        apiFilter = ''
      }
      const data = await organizerApi.getTransactions(apiFilter || undefined)
      
      // Apply client-side filtering for custom filters
      let filteredData = data
      if (statusFilter === 'WAITING') {
        filteredData = data.filter((t) => t.status === 'WAITING_PAYMENT' || t.status === 'WAITING_CONFIRMATION')
      } else if (statusFilter === 'FAILED') {
        filteredData = data.filter((t) => t.status === 'EXPIRED' || t.status === 'CANCELLED' || t.status === 'CANCELED' || t.status === 'REJECTED')
      }
      
      setTransactions(filteredData)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Filter and sort transactions
  const filteredAndSortedTransactions = (() => {
    // First filter
    let result = transactions.filter((t) => {
      const searchLower = searchQuery.toLowerCase()
      return (
        t.user.firstName.toLowerCase().includes(searchLower) ||
        t.user.lastName.toLowerCase().includes(searchLower) ||
        t.user.email.toLowerCase().includes(searchLower) ||
        t.event.title.toLowerCase().includes(searchLower) ||
        t.status.toLowerCase().includes(searchLower)
      )
    })
    
    // Then sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'priceHigh':
          return b.totalAmount - a.totalAmount
        case 'priceLow':
          return a.totalAmount - b.totalAmount
        default:
          return 0
      }
    })
    
    return result
  })()

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredAndSortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center justify-center h-8 px-3 rounded-full text-[10px] font-bold uppercase tracking-tighter min-w-[140px] text-center leading-tight ${
        status === 'DONE' ? 'bg-green-100 text-green-700' :
        status === 'WAITING_CONFIRMATION' ? 'bg-yellow-100 text-yellow-700' :
        status === 'WAITING_PAYMENT' ? 'bg-blue-100 text-blue-700' :
        status === 'FAILED' || status === 'EXPIRED' || status === 'CANCELLED' || status === 'REJECTED' ? 'bg-red-100 text-red-700' :
        'bg-[#e8deff] text-[#4a3fe2]'
      }`}>
        {status === 'DONE' ? 'Berhasil' :
         status === 'WAITING_PAYMENT' ? 'Menunggu Pembayaran' :
         status === 'WAITING_CONFIRMATION' ? 'Menunggu Konfirmasi' :
         status === 'REJECTED' ? 'Ditolak' :
         status === 'EXPIRED' ? 'Kadaluarsa' :
         status === 'CANCELED' ? 'Dibatalkan' :
         status === 'FAILED' ? 'Gagal' :
         status}
      </span>
    )
  }

  const statusCounts = {
    all: transactions.length,
    waiting: transactions.filter((t) => t.status === 'WAITING_PAYMENT' || t.status === 'WAITING_CONFIRMATION').length,
    done: transactions.filter((t) => t.status === 'DONE').length,
    failed: transactions.filter((t) => t.status === 'EXPIRED' || t.status === 'CANCELLED' || t.status === 'CANCELED' || t.status === 'REJECTED').length,
  }

  const totalRevenue = transactions
    .filter((t) => t.status === 'DONE')
    .reduce((sum, t) => sum + t.totalAmount, 0)

  return (
    <div className="min-h-screen bg-[#faf4ff] pb-16 sm:pb-20 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/organizer/dashboard')}
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#e2d7ff] text-[#4e339c] font-semibold hover:bg-[#d8caff] transition-colors mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali</span>
        </button>

        {/* Page Title */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-[#32294f] mb-1 sm:mb-2">Riwayat Transaksi</h1>
          <p className="text-xs sm:text-sm text-[#5f557f]">Kelola dan monitoring semua transaksi event Anda</p>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-[#e2d7ff]">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#4a3fe2]/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-[#4a3fe2]" />
              </div>
              <p className="text-xs sm:text-sm text-[#5f557f]">Total Pendapatan</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-[#32294f]">{formatPrice(totalRevenue)}</p>
          </div>

          <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-[#e2d7ff]">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
              </div>
              <p className="text-xs sm:text-sm text-[#5f557f]">Menunggu</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-[#32294f]">
              {statusCounts.waiting}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-[#e2d7ff]">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <p className="text-xs sm:text-sm text-[#5f557f]">Berhasil</p>
            </div>
            <p className="text-xl font-bold text-[#32294f]">{statusCounts.done}</p>
          </div>

          <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-[#e2d7ff]">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#4a3fe2]/10 flex items-center justify-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#4a3fe2]" />
              </div>
              <p className="text-xs sm:text-sm text-[#5f557f]">Total Transaksi</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-[#32294f]">{statusCounts.all}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e2d7ff] mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5f557f]" />
              <input
                type="text"
                placeholder="Cari nama, email, event, atau status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#e2d7ff] focus:border-[#4a3fe2] focus:ring-2 focus:ring-[#4a3fe2]/20 outline-none transition-all"
              />
            </div>

            {/* Status Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-[#e2d7ff] rounded-xl hover:border-[#4a3fe2] hover:bg-[#faf4ff] transition-all text-sm min-w-[140px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#5f557f]" />
                  <span className="text-[#32294f]">
                    {filterOptions.find(o => o.value === statusFilter)?.label}
                  </span>
                </div>
                <ChevronLeft className={`w-4 h-4 text-[#5f557f] transition-transform ${isFilterDropdownOpen ? '-rotate-90' : 'rotate-90'}`} />
              </button>
              
              {isFilterDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsFilterDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-[#e2d7ff] z-20 py-1">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setStatusFilter(option.value)
                          setIsFilterDropdownOpen(false)
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-[#f5eeff] transition-colors ${
                          statusFilter === option.value ? 'bg-[#f5eeff] text-[#4a3fe2] font-medium' : 'text-[#32294f]'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-[#e2d7ff] rounded-xl hover:border-[#4a3fe2] hover:bg-[#faf4ff] transition-all text-sm min-w-[160px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-[#5f557f]" />
                  <span className="text-[#32294f]">
                    {sortOptions.find(o => o.value === sortBy)?.label}
                  </span>
                </div>
                <ChevronLeft className={`w-4 h-4 text-[#5f557f] transition-transform ${isSortDropdownOpen ? '-rotate-90' : 'rotate-90'}`} />
              </button>
              
              {isSortDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsSortDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#e2d7ff] z-20 py-1">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value)
                          setIsSortDropdownOpen(false)
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-[#f5eeff] transition-colors ${
                          sortBy === option.value ? 'bg-[#f5eeff] text-[#4a3fe2] font-medium' : 'text-[#32294f]'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e2d7ff] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4a3fe2]"></div>
            </div>
          ) : filteredAndSortedTransactions.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#faf4ff] flex items-center justify-center">
                <Calendar className="w-8 h-8 text-[#4a3fe2]" />
              </div>
              <h3 className="text-lg font-bold text-[#32294f] mb-2">Tidak ada transaksi</h3>
              <p className="text-sm text-[#5f557f]">
                {searchQuery
                  ? 'Tidak ada transaksi yang cocok dengan pencarian Anda'
                  : 'Belum ada transaksi untuk event Anda'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-4">
                {paginatedTransactions.map((transaction) => (
                  <div key={transaction.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#e2d7ff]/20">
                    {/* User Info */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {transaction.user.profilePicture ? (
                          <img
                            src={transaction.user.profilePicture}
                            alt={`${transaction.user.firstName} ${transaction.user.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#4a3fe2]/10 text-sm font-bold text-[#4a3fe2]">
                            {getInitials(transaction.user.firstName, transaction.user.lastName)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#32294f] truncate">
                          {transaction.user.firstName} {transaction.user.lastName}
                        </p>
                        <p className="text-xs text-[#5f557f] truncate">{transaction.user.email}</p>
                      </div>
                    </div>

                    {/* Event Info */}
                    <div className="mb-3">
                      <p className="text-sm font-medium text-[#32294f] line-clamp-2">{transaction.event.title}</p>
                      <p className="text-xs text-[#5f557f]">{formatDate(transaction.event.startDate)}</p>
                    </div>

                    {/* Date & Price Row */}
                    <div className="flex justify-between items-start mb-3 text-sm">
                      <div>
                        <span className="text-[#5f557f] text-xs">Tanggal: </span>
                        <span className="text-[#32294f]">{formatDate(transaction.createdAt)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#5f557f] text-xs block">Harga</span>
                        <span className="font-bold text-[#4a3fe2]">{formatPrice(transaction.totalAmount)}</span>
                      </div>
                    </div>

                    {/* Status & Action Row */}
                    <div className="flex items-center justify-between">
                      {getStatusBadge(transaction.status)}
                      <button
                        onClick={() => navigate(`/transactions/${transaction.id}`)}
                        className="text-sm font-bold text-[#4a3fe2] hover:underline underline-offset-4"
                      >
                        Lihat Detail
                      </button>
                    </div>
                  </div>
                ))}

                {paginatedTransactions.length === 0 && (
                  <div className="text-center py-12 text-[#5f557f]">
                    <p>Tidak ada transaksi</p>
                  </div>
                )}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left table-fixed">
                  <thead>
                    <tr className="bg-[#f5eeff]/50">
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center w-[25%]">User</th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center w-[20%]">Event</th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center w-[15%]">Tanggal</th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-right w-[15%]">Harga</th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center w-[15%]">Status</th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center w-[10%]">Ket</th>
                    </tr>
                  </thead>
                    <tbody className="divide-y divide-[#b2a6d5]/10">
                      {paginatedTransactions.map((transaction) => (
                        <tr key={transaction.id} className="h-[72px] hover:bg-[#f5eeff]/30 transition-colors">
                          {/* USER */}
                          <td className="px-6 align-middle text-left">
                            <div className="flex items-center gap-3 justify-start">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {transaction.user.profilePicture ? (
                                  <img
                                    src={transaction.user.profilePicture}
                                    alt={`${transaction.user.firstName} ${transaction.user.lastName}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-[#4a3fe2]/10 text-sm font-bold text-[#4a3fe2]">
                                    {getInitials(transaction.user.firstName, transaction.user.lastName)}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 text-left">
                                <p className="text-sm font-bold text-[#32294f] truncate">
                                  {transaction.user.firstName} {transaction.user.lastName}
                                </p>
                                <p className="text-xs text-[#5f557f] truncate">{transaction.user.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* EVENT */}
                          <td className="px-6 align-middle text-center">
                            <p className="text-sm font-medium text-[#32294f] truncate">{transaction.event.title}</p>
                            <p className="text-xs text-[#5f557f]">{formatDate(transaction.event.startDate)}</p>
                          </td>

                          {/* TANGGAL */}
                          <td className="px-6 align-middle text-center">
                            <p className="text-sm text-[#32294f]">{formatDate(transaction.createdAt)}</p>
                          </td>

                          {/* HARGA */}
                          <td className="px-6 align-middle text-right">
                            <p className="text-sm font-bold text-[#32294f]">{formatPrice(transaction.totalAmount)}</p>
                          </td>

                          {/* STATUS */}
                          <td className="px-6 align-middle text-center">
                            {getStatusBadge(transaction.status)}
                          </td>

                          {/* KET */}
                          <td className="px-6 align-middle text-center">
                            <button
                              onClick={() => navigate(`/transactions/${transaction.id}`)}
                              className="text-sm font-bold text-[#4a3fe2] hover:underline underline-offset-4"
                            >
                              Lihat Detail →
                            </button>
                          </td>
                        </tr>
                      ))}

                      {/* EMPTY ROWS (FIXED HEIGHT) */}
                      {Array.from({ length: Math.max(0, itemsPerPage - paginatedTransactions.length) }).map((_, index) => (
                        <tr key={`empty-${index}`} className="h-[72px]">
                          <td colSpan={6}></td>
                        </tr>
                      ))}
                    </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 sm:px-6 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#e2d7ff]">
                <span className="text-xs text-[#5f557f] text-center sm:text-left">
                  Halaman {currentPage} dari {totalPages} ({filteredAndSortedTransactions.length} transaksi)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 rounded-full border border-[#b2a6d5]/30 flex items-center justify-center hover:bg-[#f5eeff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                          currentPage === pageNum
                            ? 'bg-[#4a3fe2] text-white'
                            : 'border border-[#b2a6d5]/30 hover:bg-[#f5eeff] transition-colors'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 rounded-full border border-[#b2a6d5]/30 flex items-center justify-center hover:bg-[#f5eeff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 flex items-center justify-between text-sm text-[#5f557f]">
          <p>Menampilkan {filteredAndSortedTransactions.length} transaksi</p>
          <p>Terakhir diperbarui: {new Date().toLocaleString('id-ID')}</p>
        </div>
      </div>
    </div>
  )
}
