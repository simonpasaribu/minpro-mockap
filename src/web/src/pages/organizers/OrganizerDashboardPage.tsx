import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { organizerApi, OrganizerEvent, Transaction, ChartData, ChartSummary, Statistics, TopBuyer } from '../../features/organizers/api/organizerApi'
import { Calendar, Users, Clock, ArrowLeft, Edit, Ticket, MapPin, CreditCard, MessageSquare, Crown } from 'lucide-react'

// ============== UTILITY FUNCTIONS ==============
const formatPrice = (price: number) => {
  if (price === 0) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)
}

const formatCompactNumber = (num: number) => {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

// ============== MEMOIZED KPI SECTION ==============
// Only re-renders when growth data changes
interface KPIData {
  totalRevenue: number
  totalTransactions: number
  totalAttendees: number
  avgOrderValue: number
  revenueGrowth: number
  attendeesGrowth: number
}

const KPISection = memo(({ 
  data
}: { 
  data: KPIData
}) => {
  const formatGrowth = useCallback((growth: number) => {
    if (growth === 0) return null
    const isPositive = growth > 0
    const color = isPositive ? 'text-green-600' : 'text-red-500'
    const sign = isPositive ? '+' : ''
    return (
      <span className={`text-xs font-medium ${color}`}>
        {sign}{growth.toFixed(1)}% vs periode sebelumnya
      </span>
    )
  }, [])

  // Static values - never change
  const staticValues = useMemo(() => ({
    revenue: formatCompactNumber(data.totalRevenue),
    transactions: data.totalTransactions.toLocaleString(),
    attendees: data.totalAttendees.toLocaleString(),
    avgOrder: formatCompactNumber(data.avgOrderValue)
  }), [data.totalRevenue, data.totalTransactions, data.totalAttendees, data.avgOrderValue])

  // Growth values - only these update on filter change
  const growthValues = useMemo(() => ({
    revenueGrowth: data.revenueGrowth,
    attendeesGrowth: data.attendeesGrowth
  }), [data.revenueGrowth, data.attendeesGrowth])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-gradient-to-br from-[#f5eeff] to-white p-4 sm:p-5 rounded-xl border border-[#e2d7ff]/30 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-4 h-4 text-[#4a3fe2]" />
          <p className="text-[10px] uppercase tracking-widest text-[#5f557f] font-bold">Total Pendapatan</p>
        </div>
        <p className="text-xl sm:text-2xl font-black text-[#32294f] mb-1">
          {staticValues.revenue}
        </p>
        {formatGrowth(growthValues.revenueGrowth)}
      </div>

      <div className="bg-gradient-to-br from-[#f5eeff] to-white p-4 sm:p-5 rounded-xl border border-[#e2d7ff]/30 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2">
          <Ticket className="w-4 h-4 text-[#4a3fe2]" />
          <p className="text-[10px] uppercase tracking-widest text-[#5f557f] font-bold">Total Transaksi</p>
        </div>
        <p className="text-xl sm:text-2xl font-black text-[#32294f] mb-1">
          {staticValues.transactions}
        </p>
        {formatGrowth(growthValues.revenueGrowth)}
      </div>

      <div className="bg-gradient-to-br from-[#f5eeff] to-white p-4 sm:p-5 rounded-xl border border-[#e2d7ff]/30 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-[#4a3fe2]" />
          <p className="text-[10px] uppercase tracking-widest text-[#5f557f] font-bold">Total Peserta</p>
        </div>
        <p className="text-xl sm:text-2xl font-black text-[#32294f] mb-1">
          {staticValues.attendees}
        </p>
        {formatGrowth(growthValues.attendeesGrowth)}
      </div>

      <div className="bg-gradient-to-br from-[#f5eeff] to-white p-4 sm:p-5 rounded-xl border border-[#e2d7ff]/30 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-[#4a3fe2]" />
          <p className="text-[10px] uppercase tracking-widest text-[#5f557f] font-bold">Rata-rata Order</p>
        </div>
        <p className="text-xl sm:text-2xl font-black text-[#32294f] mb-1">
          {staticValues.avgOrder}
        </p>
        {formatGrowth(growthValues.revenueGrowth)}
      </div>
    </div>
  )
})

KPISection.displayName = 'KPISection'

// ============== MEMOIZED INSIGHT SECTION ==============
// Only re-renders when best/worst period data changes
interface InsightData {
  bestPeriod: string | null
  bestAmount: number
  worstPeriod: string | null
  worstAmount: number
  activeEvents: number
}

const InsightSection = memo(({ data }: { data: InsightData }) => {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-[#faf4ff] to-white p-4 rounded-xl border border-[#e2d7ff]/30">
        <p className="text-[10px] uppercase tracking-widest text-[#5f557f] font-bold mb-2">Terbaik</p>
        <p className="text-sm font-bold text-[#4a3fe2] mb-1">
          {data.bestPeriod || '-'}
        </p>
        <p className="text-xs text-[#5f557f]">
          {formatPrice(data.bestAmount)}
        </p>
      </div>

      <div className="bg-gradient-to-br from-[#faf4ff] to-white p-4 rounded-xl border border-[#e2d7ff]/30">
        <p className="text-[10px] uppercase tracking-widest text-[#5f557f] font-bold mb-2">Terendah</p>
        <p className="text-sm font-bold text-[#ef4444] mb-1">
          {data.worstPeriod || '-'}
        </p>
        <p className="text-xs text-[#5f557f]">
          {formatPrice(data.worstAmount)}
        </p>
      </div>

      <div className="bg-gradient-to-br from-[#faf4ff] to-white p-4 rounded-xl border border-[#e2d7ff]/30">
        <p className="text-[10px] uppercase tracking-widest text-[#5f557f] font-bold mb-2">Event Aktif</p>
        <p className="text-sm font-bold text-[#32294f] mb-1">
          {data.activeEvents} event
        </p>
      </div>
    </div>
  )
})

InsightSection.displayName = 'InsightSection'

// ============== MEMOIZED CHART COMPONENT ==============
// Only re-renders when chartData changes
const ChartComponent = memo(({ 
  chartData 
}: { 
  chartData: ChartData[] 
}) => {
  const peakRevenue = useMemo(() => 
    chartData.length > 0 
      ? chartData.reduce((max, item) => item.revenue > max.revenue ? item : max)
      : null,
    [chartData]
  )

  return (
    <div className="h-full min-h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 5, left: window.innerWidth < 640 ? 30 : 45, bottom: 5 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4a3fe2" />
              <stop offset="100%" stopColor="#6249b2" />
            </linearGradient>
            <linearGradient id="peakGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2d7ff" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: window.innerWidth < 640 ? 8 : 9, fill: '#5f557f' }}
            axisLine={{ stroke: '#e2d7ff' }}
            tickLine={false}
            angle={-30}
            textAnchor="end"
            height={window.innerWidth < 640 ? 35 : 45}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: window.innerWidth < 640 ? 9 : 10, fill: '#5f557f' }}
            axisLine={{ stroke: '#e2d7ff' }}
            tickLine={false}
            tickFormatter={(value) => formatCompactNumber(value)}
            width={window.innerWidth < 640 ? 30 : 40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(250, 244, 255, 0.95)',
              border: '1px solid #e2d7ff',
              borderRadius: '12px',
              fontSize: window.innerWidth < 640 ? '10px' : '11px',
              backdropFilter: 'blur(8px)'
            }}
            formatter={(value: any, name: any) => {
              if (name === 'revenue') {
                return [formatPrice(Number(value) || 0), 'Pendapatan']
              }
              return value
            }}
            labelFormatter={(label) => (
              <div className="font-bold text-[#32294f] mb-1">{label}</div>
            )}
          />
          <Bar 
            dataKey="revenue" 
            fill="url(#barGradient)" 
            radius={[6, 6, 0, 0]}
            maxBarSize={60}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={peakRevenue && entry.date === peakRevenue.date ? 'url(#peakGradient)' : 'url(#barGradient)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})

ChartComponent.displayName = 'ChartComponent'

// Performance Section Component - Independent from chart filter
const PerformanceSection = memo(({ 
  events, 
  transactions 
}: { 
  events: OrganizerEvent[]
  transactions: Transaction[]
}) => {
  const [topBuyers, setTopBuyers] = useState<TopBuyer[]>([])
  const [buyersLoading, setBuyersLoading] = useState(false)
  const [activePerformanceTab, setActivePerformanceTab] = useState<'event' | 'buyer'>('event')

  const formatPrice = (price: number) => {
    if (price === 0) return 'Rp 0'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const fetchTopBuyers = useCallback(async () => {
    try {
      setBuyersLoading(true)
      const buyers = await organizerApi.getTopBuyers()
      setTopBuyers(buyers || [])
    } catch (error) {
      console.error('Failed to fetch top buyers:', error)
    } finally {
      setBuyersLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTopBuyers()
  }, [fetchTopBuyers])

  // Calculate NET REVENUE by event using useMemo
  // Net revenue = sum of transaction.totalAmount for DONE transactions per event
  const revenueByEvent = useMemo(() => {
    return transactions
      .filter(t => t.status === 'DONE')
      .reduce((acc, t) => {
        acc[t.eventId] = (acc[t.eventId] || 0) + t.totalAmount
        return acc
      }, {} as Record<number, number>)
  }, [transactions])

  // Get net revenue for an event
  const getNetRevenue = useCallback((eventId: number) => {
    return revenueByEvent[eventId] || 0
  }, [revenueByEvent])

  // Sort events by net revenue (highest first)
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const revenueA = getNetRevenue(a.id)
      const revenueB = getNetRevenue(b.id)
      return revenueB - revenueA
    })
  }, [events, getNetRevenue])

  // Check if all events have zero revenue
  const allEventsZero = useMemo(() => {
    return sortedEvents.length > 0 && sortedEvents.every(e => getNetRevenue(e.id) === 0)
  }, [sortedEvents, getNetRevenue])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#32294f]">Performa</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setActivePerformanceTab('event')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activePerformanceTab === 'event'
                ? 'bg-[#4a3fe2] text-white shadow-md shadow-[#4a3fe2]/20'
                : 'bg-[#f5eeff] text-[#5f557f] hover:bg-[#e8deff]'
            }`}
          >
            Event
          </button>
          <button
            onClick={() => setActivePerformanceTab('buyer')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activePerformanceTab === 'buyer'
                ? 'bg-[#4a3fe2] text-white shadow-md shadow-[#4a3fe2]/20'
                : 'bg-[#f5eeff] text-[#5f557f] hover:bg-[#e8deff]'
            }`}
          >
            Pembeli
          </button>
        </div>
      </div>

      {/* Event Performance Tab */}
      {activePerformanceTab === 'event' && (
        <div className="min-h-[300px]">
          {sortedEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#5f557f]">
              <Calendar className="w-12 h-12 mb-3 text-[#e2d7ff]" />
              <p className="text-sm font-medium">Belum ada event</p>
              <p className="text-xs text-[#5f557f] mt-1">Buat event pertama Anda untuk melihat performa</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e2d7ff]/30">
                    <th className="text-center py-4 px-4 text-xs font-bold text-[#5f557f] uppercase tracking-wider w-[40%]">Nama Event</th>
                    <th className="text-center py-4 px-4 text-xs font-bold text-[#5f557f] uppercase tracking-wider w-[20%]">Kapasitas</th>
                    <th className="text-center py-4 px-4 text-xs font-bold text-[#5f557f] uppercase tracking-wider w-[20%]">Tiket Terjual</th>
                    <th className="text-center py-4 px-4 text-xs font-bold text-[#5f557f] uppercase tracking-wider w-[20%]">Pendapatan Bersih</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEvents.slice(0, 5).map((event, index) => {
                    const revenue = getNetRevenue(event.id)
                    const isTopPerformer = index === 0 && !allEventsZero
                    
                    return (
                      <tr 
                        key={event.id} 
                        className={`border-b border-[#e2d7ff]/20 hover:bg-[#faf4ff] transition-colors min-h-[60px] ${
                          isTopPerformer ? 'bg-gradient-to-r from-[#f5eeff]/50 to-transparent' : ''
                        }`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#32294f]">{event.title}</p>
                              <p className="text-xs text-[#5f557f]">
                                {new Date(event.startDate).toLocaleDateString('id-ID', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </p>
                            </div>
                            {isTopPerformer && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4a3fe2] text-white">
                                  Event Terbaik
                                </span>
                                <span className="text-xs">⭐</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-4 px-4 text-sm text-[#5f557f]">
                          {event.totalSeats}
                        </td>
                        <td className="text-center py-4 px-4 text-sm text-[#5f557f]">
                          {event.soldTickets || 0}
                        </td>
                        <td className="text-right py-4 px-4 text-sm font-bold text-[#32294f]">
                          {formatPrice(revenue)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Buyer Performance Tab */}
      {activePerformanceTab === 'buyer' && (
        <div className="min-h-[300px]">
          {buyersLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4a3fe2]"></div>
            </div>
          ) : topBuyers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#5f557f]">
              <Users className="w-12 h-12 mb-3 text-[#e2d7ff]" />
              <p className="text-sm font-medium">Belum ada pembeli</p>
              <p className="text-xs text-[#5f557f] mt-1">Mulai event untuk melihat pembeli yang sering beli</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e2d7ff]/30">
                    <th className="text-center py-4 px-4 text-xs font-bold text-[#5f557f] uppercase tracking-wider w-[40%]">Nama Pembeli</th>
                    <th className="text-center py-4 px-4 text-xs font-bold text-[#5f557f] uppercase tracking-wider w-[20%]">Total Tiket</th>
                    <th className="text-center py-4 px-4 text-xs font-bold text-[#5f557f] uppercase tracking-wider w-[20%]">Total Transaksi</th>
                    <th className="text-center py-4 px-4 text-xs font-bold text-[#5f557f] uppercase tracking-wider w-[20%]">Total Belanja</th>
                  </tr>
                </thead>
                <tbody>
                  {topBuyers.slice(0, 5).map((buyer, index) => {
                    const isTopBuyer = index === 0
                    
                    return (
                      <tr 
                        key={buyer.userId} 
                        className={`border-b border-[#e2d7ff]/20 hover:bg-[#faf4ff] transition-colors min-h-[60px] ${
                          isTopBuyer ? 'bg-gradient-to-r from-[#f5eeff]/50 to-transparent' : ''
                        }`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#32294f]">
                                {buyer.firstName} {buyer.lastName}
                              </p>
                              <p className="text-xs text-[#5f557f]">{buyer.email}</p>
                            </div>
                            {isTopBuyer && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f59e0b] text-white">
                                  Pembeli Terbaik
                                </span>
                                <Crown className="w-4 h-4 text-[#f59e0b]" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-4 px-4 text-sm text-[#5f557f]">
                          {buyer.totalTickets}
                        </td>
                        <td className="text-center py-4 px-4 text-sm font-bold text-[#32294f]">
                          {buyer.transactionCount}
                        </td>
                        <td className="text-right py-4 px-4 text-sm font-bold text-[#32294f]">
                          {formatPrice(buyer.totalAmount)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

PerformanceSection.displayName = 'PerformanceSection'

// ============== OPTIMIZED CHART SECTION ==============
// Only re-renders when filter changes - minimal updates to sub-components
const ChartSection = ({ 
  chartFilter, 
  onFilterChange,
  events,
  transactions
}: { 
  chartFilter: 'year' | 'month' | 'day'
  onFilterChange: (filter: 'year' | 'month' | 'day') => void
  events: OrganizerEvent[]
  transactions: Transaction[]
}) => {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [chartSummary, setChartSummary] = useState<ChartSummary | null>(null)
  const [chartLoading, setChartLoading] = useState(false)
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)

  const fetchChartData = useCallback(async (filter: 'year' | 'month' | 'day') => {
    try {
      setChartLoading(true)
      const response = await organizerApi.getChartStatistics(filter)
      setChartData(response.chartData || [])
      setChartSummary(response.summary || null)
      setHasInitiallyLoaded(true)
    } catch (error) {
      console.error('Failed to fetch chart data:', error)
    } finally {
      setChartLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChartData(chartFilter)
  }, [chartFilter, fetchChartData])

  // Memoized KPI data - main values stay constant, only growth updates
  const kpiData = useMemo(() => ({
    totalRevenue: chartSummary?.totalRevenue || 0,
    totalTransactions: chartSummary?.totalTransactions || 0,
    totalAttendees: chartSummary?.totalAttendees || 0,
    avgOrderValue: chartSummary?.avgOrderValue || 0,
    revenueGrowth: chartSummary?.revenueGrowth || 0,
    attendeesGrowth: chartSummary?.attendeesGrowth || 0,
  }), [
    chartSummary?.totalRevenue,
    chartSummary?.totalTransactions,
    chartSummary?.totalAttendees,
    chartSummary?.avgOrderValue,
    chartSummary?.revenueGrowth,
    chartSummary?.attendeesGrowth,
  ])

  // Memoized insight data - only updates when period data changes
  const insightData = useMemo(() => ({
    bestPeriod: chartSummary?.bestRevenuePeriod || null,
    bestAmount: chartSummary?.bestRevenueAmount || 0,
    worstPeriod: chartSummary?.worstRevenuePeriod || null,
    worstAmount: chartSummary?.worstRevenueAmount || 0,
    activeEvents: events.filter(e => e.isPublished).length,
  }), [
    chartSummary?.bestRevenuePeriod,
    chartSummary?.bestRevenueAmount,
    chartSummary?.worstRevenuePeriod,
    chartSummary?.worstRevenueAmount,
    events,
  ])

  // Handle filter change with useCallback
  const handleFilterChange = useCallback((filter: 'year' | 'month' | 'day') => {
    onFilterChange(filter)
  }, [onFilterChange])

  return (
    <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-sm border border-[#e2d7ff]/20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-gradient-to-b from-[#4a3fe2] to-[#6249b2] rounded-full"></div>
          <h2 className="text-2xl font-bold tracking-tight text-[#32294f]">Analitik Pendapatan</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleFilterChange('day')}
            className={`w-20 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              chartFilter === 'day'
                ? 'bg-gradient-to-r from-[#4a3fe2] to-[#6249b2] text-white shadow-md shadow-[#4a3fe2]/20'
                : 'bg-[#f5eeff] text-[#5f557f] hover:bg-[#e8deff]'
            }`}
          >
            Hari
          </button>
          <button
            onClick={() => handleFilterChange('month')}
            className={`w-20 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              chartFilter === 'month'
                ? 'bg-gradient-to-r from-[#4a3fe2] to-[#6249b2] text-white shadow-md shadow-[#4a3fe2]/20'
                : 'bg-[#f5eeff] text-[#5f557f] hover:bg-[#e8deff]'
            }`}
          >
            Bulan
          </button>
          <button
            onClick={() => handleFilterChange('year')}
            className={`w-20 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              chartFilter === 'year'
                ? 'bg-gradient-to-r from-[#4a3fe2] to-[#6249b2] text-white shadow-md shadow-[#4a3fe2]/20'
                : 'bg-[#f5eeff] text-[#5f557f] hover:bg-[#e8deff]'
            }`}
          >
            Tahun
          </button>
        </div>
      </div>

      {/* KPI Cards - Memoized, only growth text updates */}
      <KPISection data={kpiData} />

      {/* Main Chart + Side Insight Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Side Insight Panel - Memoized */}
        <InsightSection data={insightData} />

        {/* Main Chart - Memoized */}
        <div className="lg:col-span-3">
          {chartLoading && !hasInitiallyLoaded ? (
            <div className="flex items-center justify-center h-full min-h-[280px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4a3fe2]"></div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[280px] text-[#5f557f]">
              <Clock className="w-12 h-12 mb-3 text-[#e2d7ff]" />
              <p className="text-sm sm:text-base font-medium">Belum ada data transaksi</p>
              <p className="text-xs text-[#5f557f] mt-1">Mulai event untuk melihat analitik</p>
            </div>
          ) : (
            <ChartComponent chartData={chartData} />
          )}
        </div>
      </div>

      {/* Performance Section - Completely independent, never re-renders on filter change */}
      <PerformanceSection events={events} transactions={transactions} />
    </div>
  )
}

ChartSection.displayName = 'ChartSection'

// ============== MAIN ORGANIZER DASHBOARD PAGE ==============
export default function OrganizerDashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'revenue'>(location.state?.activeTab || 'overview')
  const [eventFilter, setEventFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [chartFilter, setChartFilter] = useState<'year' | 'month' | 'day'>('month')
  const [revenueReport, setRevenueReport] = useState<any[]>([])
  const [revenueLoading, setRevenueLoading] = useState(false)

  const fetchRevenueReport = async () => {
    try {
      setRevenueLoading(true)
      const response = await organizerApi.getDailyRevenueReport()
      setRevenueReport(response || [])
    } catch (error) {
      console.error('Failed to fetch revenue report:', error)
    } finally {
      setRevenueLoading(false)
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (activeTab === 'revenue') {
      fetchRevenueReport()
    }
  }, [activeTab])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsData, allTransactionsData, eventsData] = await Promise.all([
        organizerApi.getStatistics(),
        organizerApi.getTransactions(),
        organizerApi.getEvents()
      ])
      setStatistics(statsData)
      // Store all transactions for net revenue calculation
      const allTransactionsDataArray = allTransactionsData || []
      setAllTransactions(allTransactionsDataArray)
      // Get 5 most recent transactions for display
      const sortedTransactions = allTransactionsDataArray
        .sort((a: Transaction, b: Transaction) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
      setRecentTransactions(sortedTransactions)
      setEvents(eventsData)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number | undefined | null) => {
    if (price === undefined || price === null || isNaN(price)) {
      return 'Rp 0'
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatCompactNumber = (num: number) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf4ff]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4a3fe2]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf4ff] pb-16 sm:pb-20 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#e2d7ff] text-[#4e339c] font-semibold hover:bg-[#d8caff] transition-colors mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali</span>
        </button>

        {/* Tabs Navigation */}
        <div className="flex gap-4 sm:gap-8 mb-6 sm:mb-8 border-b-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'text-[#4a3fe2] border-[#4a3fe2]'
                : 'text-[#5f557f] border-transparent hover:text-[#32294f]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`pb-4 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'events'
                ? 'text-[#4a3fe2] border-[#4a3fe2]'
                : 'text-[#5f557f] border-transparent hover:text-[#32294f]'
            }`}
          >
            Event Saya
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`pb-4 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'revenue'
                ? 'text-[#4a3fe2] border-[#4a3fe2]'
                : 'text-[#5f557f] border-transparent hover:text-[#32294f]'
            }`}
          >
            Laporan Pendapatan
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Dashboard Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-10 gap-3 sm:gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#32294f]">Ringkasan Dashboard</h2>
                <p className="text-[#5f557f] mt-1 sm:mt-2 text-base sm:text-lg">Selamat datang, Organizer. Berikut ringkasan event Anda hari ini.</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-[#e2d7ff] px-4 py-2 rounded-xl flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#4a3fe2]" />
                  <span className="text-sm font-semibold text-[#32294f]">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              {/* Total Revenue */}
              <div className="bg-[#e2d7ff] p-4 sm:p-6 rounded-xl transition-transform hover:scale-[1.02] duration-300">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="p-2 bg-[#4a3fe2]/20 rounded-lg text-[#4a3fe2]">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-[#4a3fe2] bg-[#4a3fe2]/30 px-2 py-0.5 rounded uppercase tracking-wider">+12%</span>
                </div>
                <p className="text-xs text-[#5f557f] font-medium mb-1">Total Pendapatan</p>
                <h3 className="text-lg sm:text-xl font-black text-[#32294f] mb-1 sm:mb-2">{formatPrice(statistics?.totalRevenue)}</h3>
                <p className="text-[10px] text-[#5f557f]">Total revenue organizer</p>
              </div>

              {/* Total Attendees */}
              <div className="bg-[#e2d7ff] p-4 sm:p-6 rounded-xl transition-transform hover:scale-[1.02] duration-300">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="p-2 bg-[#6249b2]/20 rounded-lg text-[#6249b2]">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <p className="text-xs text-[#5f557f] font-medium mb-1">Total Peserta</p>
                <h3 className="text-lg sm:text-xl font-black text-[#32294f] mb-1 sm:mb-2">{formatCompactNumber(statistics?.totalAttendees || 0)}</h3>
                <p className="text-[10px] text-[#5f557f]">{statistics?.totalAttendees || 0} peserta terdaftar</p>
              </div>

              {/* Active Events */}
              <div className="bg-[#e2d7ff] p-4 sm:p-6 rounded-xl transition-transform hover:scale-[1.02] duration-300">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="p-2 bg-[#983772]/20 rounded-lg text-[#983772]">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <p className="text-xs text-[#5f557f] font-medium mb-1">Total Event</p>
                <h3 className="text-lg sm:text-xl font-black text-[#32294f] mb-1 sm:mb-2">{statistics?.totalEvents || 0}</h3>
                <p className="text-[10px] text-[#5f557f]">{statistics?.totalEvents || 0} event dibuat</p>
              </div>
            </div>

            {/* Analytics Section */}
            <div className="mb-12">
              <ChartSection 
                chartFilter={chartFilter} 
                onFilterChange={setChartFilter}
                events={events}
                transactions={allTransactions}
              />
            </div>

            {/* Recent Transactions Table */}
            <div className="overflow-hidden bg-white rounded-2xl shadow-sm border border-[#e2d7ff]/20">
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center gap-3">
                <div className="w-2 h-8 bg-[#4a3fe2] rounded-full"></div>
                <h2 className="text-2xl font-bold tracking-tight text-[#32294f]">Riwayat Transaksi</h2>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="text-center py-24 text-[#5f557f]">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Belum ada transaksi</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table - Hidden on mobile */}
                  <div className="hidden md:block overflow-x-auto mt-4 -mx-4 sm:mx-0 px-4 sm:px-0">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-[#f5eeff]/50">
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center">User</th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center">Event</th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center">Tanggal</th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center">Harga</th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center">Status</th>
                          <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center">Ket</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#b2a6d5]/10">
                        {recentTransactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-[#f5eeff]/30 transition-colors h-20">
                            <td className="px-6 h-20 align-middle">
                              <div className="flex items-center gap-3">
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
                                <div>
                                  <p className="text-sm font-bold text-[#32294f]">
                                    {transaction.user.firstName} {transaction.user.lastName}
                                  </p>
                                  <p className="text-xs text-[#5f557f]">{transaction.user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 h-20 align-middle text-center">
                              <p className="text-sm font-medium text-[#32294f]">{transaction.event.title}</p>
                              <p className="text-xs text-[#5f557f]">{formatDate(transaction.event.startDate)}</p>
                            </td>
                            <td className="px-6 h-20 align-middle text-center">
                              <p className="text-sm text-[#32294f]">{formatDate(transaction.createdAt)}</p>
                            </td>
                            <td className="px-6 h-20 align-middle text-center">
                              <p className="text-sm font-bold text-[#32294f]">{formatPrice(transaction.totalAmount)}</p>
                            </td>
                            <td className="px-6 h-20 align-middle text-center">
                              <span className={`inline-flex items-center justify-center px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-tighter min-w-[140px] min-h-[36px] text-center leading-tight ${
                                transaction.status === 'DONE' ? 'bg-green-100 text-green-700' :
                                transaction.status === 'WAITING_CONFIRMATION' ? 'bg-yellow-100 text-yellow-700' :
                                transaction.status === 'WAITING_PAYMENT' ? 'bg-blue-100 text-blue-700' :
                                transaction.status === 'FAILED' || transaction.status === 'EXPIRED' || transaction.status === 'CANCELLED' || transaction.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                'bg-[#e8deff] text-[#4a3fe2]'
                              }`}>
                                {transaction.status === 'DONE' ? 'Berhasil' :
                                 transaction.status === 'WAITING_PAYMENT' ? 'Menunggu Pembayaran' :
                                 transaction.status === 'WAITING_CONFIRMATION' ? 'Menunggu Konfirmasi' :
                                 transaction.status === 'REJECTED' ? 'Ditolak' :
                                 transaction.status === 'EXPIRED' ? 'Kedaluwarsa' :
                                 transaction.status === 'CANCELED' ? 'Dibatalkan' :
                                 transaction.status === 'FAILED' ? 'Gagal' :
                                 transaction.status}
                              </span>
                            </td>
                            <td className="px-6 h-20 align-middle text-center">
                              <button
                                onClick={() => navigate(`/transactions/${transaction.id}`)}
                                className="text-sm font-bold text-[#4a3fe2] hover:underline underline-offset-4"
                              >
                                Lihat Detail
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card List - Visible only on mobile */}
                  <div className="md:hidden">
                    <div className="divide-y divide-[#b2a6d5]/10">
                      {recentTransactions.map((transaction) => (
                        <div key={transaction.id} className="p-4">
                          {/* Header: User Info */}
                          <div className="flex gap-3 mb-3">
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
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-[#32294f] leading-tight mb-1 line-clamp-1">
                                {transaction.user.firstName} {transaction.user.lastName}
                              </p>
                              <p className="text-xs text-[#5f557f] truncate">{transaction.user.email}</p>
                            </div>
                          </div>
                          
                          {/* Event & Date Row */}
                          <div className="mb-3">
                            <p className="text-sm font-medium text-[#32294f] mb-1">{transaction.event.title}</p>
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
                            <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                              transaction.status === 'DONE' ? 'bg-green-100 text-green-700' :
                              transaction.status === 'WAITING_CONFIRMATION' ? 'bg-yellow-100 text-yellow-700' :
                              transaction.status === 'WAITING_PAYMENT' ? 'bg-blue-100 text-blue-700' :
                              transaction.status === 'FAILED' || transaction.status === 'EXPIRED' || transaction.status === 'CANCELLED' || transaction.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                              'bg-[#e8deff] text-[#4a3fe2]'
                            }`}>
                              {transaction.status === 'DONE' ? 'Berhasil' :
                               transaction.status === 'WAITING_PAYMENT' ? 'Menunggu' :
                               transaction.status === 'WAITING_CONFIRMATION' ? 'Menunggu' :
                               transaction.status === 'REJECTED' ? 'Ditolak' :
                               transaction.status === 'EXPIRED' ? 'Kadaluarsa' :
                               transaction.status === 'CANCELED' ? 'Dibatalkan' :
                               transaction.status === 'FAILED' ? 'Gagal' :
                               transaction.status}
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
                  </div>
                </>
              )}
              {recentTransactions.length > 0 && (
                <div className="mt-4 text-center px-8 pb-6">
                  <button
                    onClick={() => navigate('/organizer/transactions')}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#f5eeff] text-[#4a3fe2] font-semibold hover:bg-[#e2d7ff] transition-colors"
                  >
                    Lihat Semua Riwayat Transaksi
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div>
            {/* Header with Create Button */}
            <div className="flex flex-col md:flex-row justify-end gap-6 mb-8">
              <button
                onClick={() => navigate('/events/create')}
                className="bg-[#4a3fe2] text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-[#3d2fd6] transition-all shadow-lg shadow-[#4a3fe2]/20"
              >
                <Calendar className="w-5 h-5" />
                Create New Event
              </button>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <button
                onClick={() => setEventFilter('all')}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  eventFilter === 'all'
                    ? 'bg-[#4a3fe2] text-white shadow-md shadow-[#4a3fe2]/20'
                    : 'bg-[#f5eeff] text-[#5f557f] hover:bg-[#e8deff]'
                }`}
              >
                Semua Event ({events.length})
              </button>
              <button
                onClick={() => setEventFilter('published')}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  eventFilter === 'published'
                    ? 'bg-[#4a3fe2] text-white shadow-md shadow-[#4a3fe2]/20'
                    : 'bg-[#f5eeff] text-[#5f557f] hover:bg-[#e8deff]'
                }`}
              >
                Published ({events.filter(e => e.isPublished).length})
              </button>
              <button
                onClick={() => setEventFilter('draft')}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  eventFilter === 'draft'
                    ? 'bg-[#4a3fe2] text-white shadow-md shadow-[#4a3fe2]/20'
                    : 'bg-[#f5eeff] text-[#5f557f] hover:bg-[#e8deff]'
                }`}
              >
                Draft ({events.filter(e => !e.isPublished).length})
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 mb-16 md:grid-cols-2">
              <div className="bg-[#f5eeff] p-8 rounded-xl flex flex-col justify-between h-48">
                <span className="text-[#5f557f] text-sm uppercase tracking-widest">Total Pendapatan</span>
                <span className="text-4xl font-display font-extrabold text-[#32294f]">{formatPrice(statistics?.totalRevenue)}</span>
                <div className="flex items-center text-[#5f557f] text-sm font-medium">
                  <Users className="w-4 h-4 mr-1" />
                  Dari {statistics?.totalTransactions || 0} transaksi berhasil
                </div>
              </div>
              <div className="bg-[#e2d7ff] p-8 rounded-xl flex flex-col justify-between h-48">
                <span className="text-[#5f557f] text-sm uppercase tracking-widest">Total Peserta</span>
                <span className="text-4xl font-display font-extrabold text-[#32294f]">{formatCompactNumber(statistics?.totalAttendees || 0)}</span>
                <div className="flex items-center text-[#5f557f] text-sm font-medium">
                  Dari {events.filter(e => e.isPublished).length} event yang dipublikasikan
                </div>
              </div>
            </div>

            {/* Event List */}
            {(() => {
              const filteredEvents = events.filter(event => {
                if (eventFilter === 'all') return true
                if (eventFilter === 'published') return event.isPublished
                if (eventFilter === 'draft') return !event.isPublished
                return true
              })

              return filteredEvents.length === 0 ? (
                <div className="text-center py-12 text-[#5f557f]">
                  <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">Tidak ada event di kategori ini</p>
                  <button
                    onClick={() => navigate('/events/create')}
                    className="bg-[#4a3fe2] text-white px-6 py-2 rounded-full font-bold hover:bg-[#3d2fd6] transition-colors"
                  >
                    Buat Event Baru
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredEvents.map((event) => (
                    <div key={event.id} className="bg-[#f5eeff] rounded-xl overflow-hidden group hover:bg-[#e2d7ff] transition-all duration-300">
                      <div className="flex flex-col lg:flex-row">
                        <div className="w-full lg:w-64 h-auto flex-shrink-0">
                          <div className="aspect-square w-full overflow-hidden">
                            <img
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              src={event.imageUrl || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=400&q=80'}
                              alt={event.title}
                            />
                          </div>
                        </div>
                        <div className="flex-1 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider ${
                                event.isPublished ? 'bg-[#e2d7ff] text-[#4a3fe2]' : 'bg-[#d8caff] text-[#4e339c]'
                              }`}>
                                {event.isPublished ? 'Published' : 'Draft'}
                              </span>
                              <span className="text-[#5f557f] text-sm flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(event.startDate)}
                              </span>
                            </div>
                            <h3 className="text-2xl font-display font-bold tracking-tight text-[#32294f]">{event.title}</h3>
                            <div className="flex items-center gap-4 text-[#5f557f] font-medium">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {event.location}
                              </span>
                              <span className="text-[#4a3fe2] font-bold">{formatPrice(event.price)}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-[#5f557f]">
                              <span className="flex items-center gap-1">
                                <Ticket className="w-4 h-4" />
                                Terjual: {event.soldTickets ?? (event.totalSeats - event.availableSeats)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                Tersedia: {event.availableSeats}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                            <button
                              onClick={() => navigate(`/events/${event.slug}/edit`)}
                              className="bg-[#e2d7ff] text-[#32294f] px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-[#d8caff] transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => navigate(`/organizer/events/${event.slug}/vouchers`)}
                              className="bg-[#e2d7ff] text-[#32294f] px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-[#d8caff] transition-colors"
                            >
                              <Ticket className="w-4 h-4" />
                              Voucher
                            </button>
                            <button
                              onClick={() => navigate(`/events/${event.slug}/attendees`)}
                              className="bg-[#e2d7ff] text-[#32294f] px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-[#d8caff] transition-colors"
                            >
                              <Users className="w-4 h-4" />
                              Attendees
                            </button>
                            <button
                              onClick={() => navigate(`/events/${event.slug}/reviews`, { state: { from: '/organizer/dashboard', activeTab: 'events' } })}
                              className="bg-[#e2d7ff] text-[#32294f] px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-[#d8caff] transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Reviews
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        )}

        {/* Revenue Report Tab */}
        {activeTab === 'revenue' && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-8 bg-[#4a3fe2] rounded-full"></div>
              <h2 className="text-2xl font-bold tracking-tight text-[#32294f]">Laporan Pendapatan Harian</h2>
            </div>

            {revenueLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4a3fe2]"></div>
              </div>
            ) : revenueReport.length === 0 ? (
              <div className="text-center py-24 text-[#5f557f]">
                <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Belum ada data pendapatan</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-[#e2d7ff]/20 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f5eeff]/50">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#5f557f]">Tanggal</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#5f557f]">Event</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-center">Jumlah Transaksi</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-right">Total Hari Ini</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#5f557f] text-right">Total Akumulatif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#b2a6d5]/10">
                    {revenueReport.map((dayReport) => (
                      <>
                        {/* Day summary row */}
                        <tr key={`summary-${dayReport.date}`} className="bg-[#f5eeff]/20">
                          <td className="px-6 py-3">
                            <span className="text-sm font-bold text-[#32294f]">
                              {new Date(dayReport.date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className="text-sm font-bold text-[#4a3fe2]">Total Hari Ini</span>
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span className="text-sm font-bold text-[#32294f]">{dayReport.dayTransactionCount}</span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className="text-sm font-bold text-[#4a3fe2]">{formatPrice(dayReport.dayTotal)}</span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className="text-sm font-bold text-[#32294f]">{formatPrice(dayReport.runningTotal)}</span>
                          </td>
                        </tr>
                        {/* Event rows */}
                        {dayReport.events.map((eventData: any) => (
                          <tr key={`${dayReport.date}-${eventData.eventId}`} className="hover:bg-[#f5eeff]/30 transition-colors">
                            <td className="px-6 py-4"></td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-[#5f557f]">{eventData.eventTitle}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm text-[#5f557f]">{eventData.transactionCount}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm text-[#5f557f]">{formatPrice(eventData.totalRevenue)}</span>
                            </td>
                            <td className="px-6 py-4"></td>
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
