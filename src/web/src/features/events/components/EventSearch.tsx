import { useState, useEffect } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { EventFilters } from '../api/eventApi'

interface EventSearchProps {
  filters: EventFilters
  categories: string[]
  onFilterChange: (filters: EventFilters) => void
}

export function EventSearch({ filters, categories, onFilterChange }: EventSearchProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || '')
  const [showFilters, setShowFilters] = useState(false)

  // Debounce search input - Nomor 1-B: Search Bar with Debounce (300-500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({
        ...filters,
        search: localSearch || undefined,
      })
    }, 400) // 400ms debounce

    return () => clearTimeout(timer)
  }, [localSearch])

  const handleCategoryChange = (category: string) => {
    onFilterChange({
      ...filters,
      category: filters.category === category ? undefined : category,
    })
  }

  const handleClearFilters = () => {
    setLocalSearch('')
    onFilterChange({})
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Cari event..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {localSearch && (
          <button
            onClick={() => setLocalSearch('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="w-4 h-4" />
          <span>Filter</span>
        </button>

        {(filters.category || filters.isFree) && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <X className="w-4 h-4" />
            <span>Hapus Filter</span>
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filters.category === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Price Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harga
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.isFree}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    isFree: e.target.checked || undefined,
                  })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Gratis saja</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
