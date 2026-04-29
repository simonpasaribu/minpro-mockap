import { useNavigate } from 'react-router-dom'
import { FileX, ArrowLeft, Search } from 'lucide-react'

interface NotFoundProps {
  title?: string
  message?: string
  backUrl?: string
  backLabel?: string
  showSearchButton?: boolean
}

export default function NotFound({
  title = 'Tidak Ditemukan',
  message = 'Data yang Anda cari tidak ditemukan atau sudah tidak tersedia',
  backUrl,
  backLabel = 'Kembali',
  showSearchButton = false,
}: NotFoundProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (backUrl) {
      navigate(backUrl)
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileX className="w-10 h-10 text-blue-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{title}</h1>

        {/* Message */}
        <p className="text-gray-600 mb-8 leading-relaxed">{message}</p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleBack}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </button>

          {showSearchButton && (
            <button
              onClick={() => navigate('/events')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#4a3fe2] text-white rounded-xl font-medium hover:bg-[#3d2fd6] transition-colors"
            >
              <Search className="w-4 h-4" />
              Cari Event
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
