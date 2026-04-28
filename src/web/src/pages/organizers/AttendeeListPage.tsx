import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { organizerApi, Attendee, OrganizerEvent } from '../../features/organizers/api/organizerApi'
import { ArrowLeft, Users, Mail, Phone, Calendar, DollarSign, Download, Ticket } from 'lucide-react'

export default function AttendeeListPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [event, setEvent] = useState<OrganizerEvent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (slug) {
      fetchAttendees()
    }
  }, [slug])

  const fetchAttendees = async () => {
    try {
      setLoading(true)
      console.log('Fetching attendees for slug:', slug)
      
      // Fetch event data and attendees in parallel
      const [eventData, attendeesData] = await Promise.all([
        organizerApi.getEventBySlug(slug!),
        organizerApi.getEventAttendees(slug!)
      ])
      
      console.log('Event data received:', eventData)
      console.log('Attendees data received:', attendeesData)
      
      setEvent(eventData)
      setAttendees(attendeesData)
    } catch (error) {
      console.error('Failed to fetch attendees:', error)
      alert('Gagal memuat daftar peserta')
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleExportCSV = () => {
    const headers = ['Nama', 'Email', 'Telepon', 'Jumlah Tiket', 'Harga per Tiket', 'Total Harga', 'Tanggal Pembelian']
    const rows = attendees.map(a => [
      `${a.user.firstName} ${a.user.lastName}`,
      a.user.email,
      a.user.phone || '-',
      a.ticketCount.toString(),
      formatPrice(a.ticketPrice),
      formatPrice(a.totalAmount),
      formatDate(a.purchasedAt),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `attendees_event_${slug}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <button
            onClick={() => navigate('/organizer/dashboard', { state: { activeTab: 'events' } })}
            className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#e2d7ff] text-[#4e339c] font-semibold hover:bg-[#d8caff] transition-colors mb-4 sm:mb-6 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
        </div>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#e2d7ff] text-[#4e339c] font-semibold hover:bg-[#d8caff] transition-colors mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Daftar Peserta</h1>
            <p className="text-gray-600 mt-0.5 sm:mt-1 text-sm sm:text-base">
              Total {attendees.length} peserta terdaftar
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={attendees.length === 0}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Peserta</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {attendees.length}
                </p>
              </div>
              <Users className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Tiket Terjual</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {attendees.reduce((sum, a) => sum + a.ticketCount, 0)}
                </p>
              </div>
              <Ticket className="w-12 h-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Tiket Tersedia</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {event ? event.availableSeats : '-'}
                </p>
              </div>
              <Calendar className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Pendapatan</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {formatPrice(attendees.reduce((sum, a) => sum + a.totalAmount, 0))}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-green-600" />
            </div>
          </div>
        </div>

        {/* Attendees Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {attendees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada peserta</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Peserta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kontak
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Harga
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal Pembelian
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendees.map((attendee) => (
                    <tr key={attendee.transactionId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {attendee.user.firstName[0]}{attendee.user.lastName[0]}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {attendee.user.firstName} {attendee.user.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {attendee.user.email}
                          </div>
                          {attendee.user.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-4 h-4 mr-2 text-gray-400" />
                              {attendee.user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {attendee.ticketCount} x {formatPrice(attendee.ticketPrice)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatPrice(attendee.totalAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatDate(attendee.purchasedAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
