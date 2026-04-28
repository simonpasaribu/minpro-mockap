import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartData } from '../api/organizerApi'

interface AttendeeChartProps {
  data: ChartData[]
}

export default function AttendeeChart({ data }: AttendeeChartProps) {
  return (
    <div className="w-full">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Jumlah Peserta</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Bar 
            dataKey="attendees" 
            fill="#4a3fe2" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
