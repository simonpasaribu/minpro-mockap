import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { organizerApi, EventFormData, OrganizerEvent } from '../../features/organizers/api/organizerApi'
import { cloudinaryApi } from '../../features/upload/api/cloudinaryApi'
import { useAuth } from '../../features/auth/components/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Upload, Calendar, MapPin, DollarSign, Users, CheckCircle, X } from 'lucide-react'

const eventSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  location: z.string().min(3, 'Lokasi minimal 3 karakter'),
  category: z.enum(['MUSIC', 'SPORTS', 'TECHNOLOGY', 'BUSINESS', 'ARTS', 'FOOD', 'EDUCATION', 'OTHER']),
  price: z.number().min(0, 'Harga tidak boleh negatif'),
  totalSeats: z.number().min(1, 'Kapasitas minimal 1'),
  startDate: z.string().min(1, 'Tanggal mulai harus diisi'),
  endDate: z.string().optional(),
  registrationDeadline: z.string().optional(),
  imageUrl: z.string().optional(),
  isPublished: z.boolean(),
})

type EventFormValues = z.infer<typeof eventSchema>

// @ts-ignore - Vite env types
const CLOUDINARY_UPLOAD_PRESET = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset'
// @ts-ignore - Vite env types
const CLOUDINARY_CLOUD_NAME = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || 'deic5yjpr'

export default function EventFormPage() {
  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEdit = !!slug
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [eventData, setEventData] = useState<OrganizerEvent | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      category: 'OTHER',
      price: 0,
      totalSeats: 1,
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      imageUrl: '',
      isPublished: false,
    },
  })

  const imageUrl = watch('imageUrl')

  useEffect(() => {
    if (isEdit && slug) {
      fetchEvent()
    }
  }, [isEdit, slug])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const data = await organizerApi.getEventBySlug(slug!)
      setEventData(data)
      
      // Populate form
      setValue('title', data.title)
      setValue('description', data.description || '')
      setValue('location', data.location)
      setValue('category', data.category as any)
      setValue('price', data.price)
      setValue('totalSeats', data.totalSeats)
      setValue('startDate', data.startDate.split('T')[0])
      setValue('endDate', data.endDate ? data.endDate.split('T')[0] : '')
      setValue('registrationDeadline', data.registrationDeadline ? data.registrationDeadline.split('T')[0] : '')
      setValue('imageUrl', data.imageUrl || '')
      setValue('isPublished', data.isPublished)
    } catch (error) {
      console.error('Failed to fetch event:', error)
      alert('Gagal memuat data event')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!user?.id) {
      alert('Anda harus login terlebih dahulu')
      return
    }

    // Need eventId for backend upload - only works in edit mode
    if (!eventData?.id) {
      alert('Silakan simpan event terlebih dahulu sebelum upload gambar')
      return
    }

    setUploading(true)
    try {
      // Upload via backend API
      const imageUrl = await cloudinaryApi.uploadEventImage(
        file,
        user.id,
        eventData.id
      )
      setValue('imageUrl', imageUrl)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Gagal mengupload gambar')
    } finally {
      setUploading(false)
    }
  }

  // Generate slug helper function
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  // Generate default Unsplash image based on title and category
  const generateDefaultImage = (title: string, category: string): string => {
    // Curated Unsplash photo IDs for different categories - 8 images each
    const categoryImages: Record<string, string[]> = {
      'MUSIC': [
        '1501281668745-f7f57925c3b4', // concert crowd
        '1514525253440-b393452e8d26', // music headphones
        '1493225255756-d965d7b6d6d5', // festival lights
        '1470229720575-dd3e0f2856f4', // live band
        '1511671782779-c97e5e7e9b3e', // vinyl records
        '1459749411177-287ce32741f5', // piano
        '1507838153414-b4b713384ebd', // guitar
        '1499364615652-f9e2c5e7d28e', // music production
      ],
      'SPORTS': [
        '1541534740-0d2a4d5c3e3a', // running
        '1517836357463-d25dfeac3438', // gym
        '1574623458026-62c11a26e09c', // basketball
        '1461896836934-ffe607ba8211', // marathon
        '1530549387789-25c9418a7493', // yoga
        '1571019614242-c5c5dee9f50b', // soccer
        '1552674605-db6ffd9dab0b', // tennis
        '1517649763962-0c62e0645014', // swimming
      ],
      'TECHNOLOGY': [
        '1518770660439-4636190af475', // circuit board
        '1498050108023-c5249f4df085', // coding laptop
        '1555069810-9e4c2f5e4f5d', // developer
        '1519389950473-47ba0277781c', // team coding
        '1451187580459-43490279c0fa', // data center
        '1526374965328-7f61d4dc2381', // ai robot
        '1550751827-4bd374c3d3c2', // cyber security
        '1517078896204-539ef774a570', // tech workspace
      ],
      'BUSINESS': [
        '1556761175-4b46a572b786', // startup team
        '1515187029008-614a5f3404b3', // handshake
        '1497366216548-37526070297c', // modern office
        '1551836022-d5d88e9218df', // business meeting
        '1454165804606-c3d57bc86b40', // strategy
        '1507679799987-c737795bccf8', // presentation
        '1521791136063-5c554776aee1', // networking
        '1486406146926-c627a92ad1ab', // corporate building
      ],
      'ARTS': [
        '1460661414058-33e9c0c9e9c5', // paint brushes
        '1579783901586-d88db74b4fe4', // abstract art
        '1547891654-e1e57348454b', // art gallery
        '1513364776144-60967b0f800f', // street art
        '1515405295576-99d295618139', // sculpture
        '1536924940846-227afb31e2a5', // pottery
        '1549490349-8643362247b5', // photography
        '1544531586-de2c5ee52f2e', // drawing
      ],
      'FOOD': [
        '1504674900247-0877dfdfcccd', // food spread
        '1556909115-3e672f5c8f7e', // chef cooking
        '1517248135467-303c1d17f5d5', // restaurant
        '1565299624946-b28f40a0ae38', // pizza
        '1512621776951-a57141f2eefd', // healthy food
        '1551024709-8a9bfc5c99a2', // coffee
        '1567620905732-2d1ec7ab7449', // baking
        '1546069901-ba9599a7e63c', // fruits
      ],
      'EDUCATION': [
        '1503676260728-1c00da0941dc', // classroom
        '1523050854058-8df90110c9f1', // graduation
        '1524178232366-71f96d17c5d1', // books
        '1509062522396-0008f1f1f2f3', // students
        '1544531586-de2c5ee52f2e', // writing
        '1497633762265-9d179a990aa6', // study group
        '1523245487588-5c1cba1c69d1', // library
        '1503676260728-1c00da0941dc', // learning
      ],
      'OTHER': [
        '1511632765496-70c3e7d6c66c', // outdoor event
        '1540575462-2e5c2e2b9f5d', // conference
        '1523580494863-6f12322e8b5d', // community
        '1470229720575-dd3e0f2856f4', // celebration
        '1492684223139-a3eb39d96359', // stage
        '1531058020387-41bab52c4c2d', // workshop
        '1523580494863-6f12322e8b5d', // festival
        '1511632765496-70c3e7d6c66c', // fair
      ]
    }
    
    // Get images for category or use default
    const images = categoryImages[category] || categoryImages['OTHER']
    
    // Generate a unique hash from title + category for variety
    const hashString = `${title}-${category}-${Date.now()}`
    let hash = 0
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    
    // Use absolute value of hash and modulo to select image
    const index = Math.abs(hash) % images.length
    const photoId = images[index]
    
    return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1200&q=80`
  }

  const onSubmit = async (data: EventFormValues) => {
    try {
      setLoading(true)
      
      // Use default Unsplash image if no image uploaded
      let finalImageUrl = data.imageUrl
      if (!finalImageUrl || finalImageUrl === '') {
        finalImageUrl = generateDefaultImage(data.title, data.category)
      }
      
      const payload: EventFormData = {
        ...data,
        price: Number(data.price),
        totalSeats: Number(data.totalSeats),
        imageUrl: finalImageUrl,
      }

      if (isEdit && slug) {
        await organizerApi.updateEvent(slug, payload)
        alert('Event berhasil diperbarui')
      } else {
        await organizerApi.createEvent(payload)
        setShowSuccessModal(true)
        setCountdown(3)
      }

      navigate('/organizer/dashboard', { state: { activeTab: 'events' } })
    } catch (error) {
      console.error('Failed to save event:', error)
      alert(isEdit ? 'Gagal memperbarui event' : 'Gagal membuat event')
    } finally {
      setLoading(false)
    }
  }

  if (loading && isEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Back Button */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        <button
          onClick={() => navigate('/organizer/dashboard', { state: { activeTab: 'events' } })}
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#e2d7ff] text-[#4e339c] font-semibold hover:bg-[#d8caff] transition-colors mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali</span>
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
          {isEdit ? 'Edit Event' : 'Buat Event Baru'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {/* Image Upload */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-4">
              Gambar Event
            </label>
            <div className="flex items-center gap-3 sm:gap-4">
              {eventData?.imageUrl || imageUrl ? (
                <img
                  src={imageUrl || eventData?.imageUrl || ''}
                  alt="Event preview"
                  className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploading && (
                  <p className="text-sm text-gray-500 mt-2">Mengupload...</p>
                )}
              </div>
            </div>
            <input type="hidden" {...register('imageUrl')} />
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Judul Event *
              </label>
              <input
                type="text"
                {...register('title')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan judul event"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi Event *
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Deskripsikan event Anda"
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lokasi *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  {...register('location')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan lokasi event"
                />
              </div>
              {errors.location && (
                <p className="text-red-600 text-sm mt-1">{errors.location.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori *
              </label>
              <select
                {...register('category')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="MUSIC">Musik</option>
                <option value="SPORTS">Olahraga</option>
                <option value="TECHNOLOGY">Teknologi</option>
                <option value="BUSINESS">Bisnis</option>
                <option value="ARTS">Seni</option>
                <option value="FOOD">Makanan</option>
                <option value="EDUCATION">Pendidikan</option>
                <option value="OTHER">Lainnya</option>
              </select>
              {errors.category && (
                <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Pricing & Capacity */}
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Harga Tiket (IDR) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  {...register('price', { valueAsNumber: true })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0 untuk event gratis"
                  min="0"
                />
              </div>
              {errors.price && (
                <p className="text-red-600 text-sm mt-1">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kapasitas (Jumlah Kursi) *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  {...register('totalSeats', { valueAsNumber: true })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan kapasitas"
                  min="1"
                />
              </div>
              {errors.totalSeats && (
                <p className="text-red-600 text-sm mt-1">{errors.totalSeats.message}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Mulai *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  {...register('startDate')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {errors.startDate && (
                <p className="text-red-600 text-sm mt-1">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Selesai (Opsional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  {...register('endDate')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline Pendaftaran (Opsional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  {...register('registrationDeadline')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Publish Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('isPublished')}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Publikasikan Event Sekarang
              </span>
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Jika tidak dicentang, event akan disimpan sebagai draft
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Menyimpan...' : isEdit ? 'Perbarui Event' : 'Buat Event'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Event Berhasil Dibuat!</h3>
            <p className="text-gray-600 mb-6">
              Event Anda telah berhasil dibuat dan sedang dalam status draft.
            </p>
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                Mengalihkan ke dashboard dalam <span className="font-bold text-blue-600">{countdown}</span> detik...
              </p>
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-1000 ease-linear"
                  style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/organizer/dashboard', { state: { activeTab: 'events' } })}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Ke Dashboard Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
