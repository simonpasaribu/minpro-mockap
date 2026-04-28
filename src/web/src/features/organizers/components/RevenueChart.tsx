import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartData } from '../api/organizerApi'

interface RevenueChartProps {
  data: ChartData[]
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Pendapatan</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            tickFormatter={formatCurrency}
          />
          <Tooltip 
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#4a3fe2" 
            strokeWidth={2}
            dot={{ fill: '#4a3fe2', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
