'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

/**
 * Example component demonstrating how to use the Products API endpoint
 * This component shows various filtering and pagination capabilities
 */

interface Product {
  id: string;
  title: string;
  price: number;
  price_display?: string;
  property_type: string;
  category: string;
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  is_featured: boolean;
  main_image_url?: string;
}

interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: {
    category?: string;
    city?: string;
    priceRange?: { min?: number; max?: number };
    location?: string;
  };
}

interface ProductFilters {
  category?: string;
  city?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  searchQuery?: string;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  location?: string;
}

export default function ProductsApiExample() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ProductsResponse['pagination'] | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 10,
    sortBy: 'newest'
  });

  // Fetch products from API
  const fetchProducts = async (currentFilters: ProductFilters) => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/products?${params.toString()}`);
      const data: ProductsResponse = await response.json();

      if (data.success) {
        setProducts(data.data);
        setPagination(data.pagination);
      } else {
        setError('Failed to fetch products');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load products on component mount and filter changes
  useEffect(() => {
    fetchProducts(filters);
  }, [filters]);

  // Update filters
  const updateFilter = (key: keyof ProductFilters, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 when changing filters
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      sortBy: 'newest'
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Products API Example</h1>
      
      {/* Filters Section */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* City Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <select
              value={filters.city || ''}
              onChange={(e) => updateFilter('city', e.target.value || undefined)}
              className="w-full p-2 border rounded"
            >
              <option value="">All Cities</option>
              <option value="hyderabad">Hyderabad</option>
              <option value="goa">Goa</option>
              <option value="dubai">Dubai</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={filters.category || ''}
              onChange={(e) => updateFilter('category', e.target.value || undefined)}
              className="w-full p-2 border rounded"
            >
              <option value="">All Categories</option>
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa</option>
              <option value="Holiday Home">Holiday Home</option>
              <option value="Plot">Plot</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium mb-1">Sort By</label>
            <select
              value={filters.sortBy || 'newest'}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="featured">Featured First</option>
            </select>
          </div>

          {/* Bedrooms */}
          <div>
            <label className="block text-sm font-medium mb-1">Bedrooms</label>
            <select
              value={filters.bedrooms || ''}
              onChange={(e) => updateFilter('bedrooms', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full p-2 border rounded"
            >
              <option value="">Any</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4+ BHK</option>
            </select>
          </div>

          {/* Search Query */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              value={filters.searchQuery || ''}
              onChange={(e) => updateFilter('searchQuery', e.target.value || undefined)}
              placeholder="Search properties..."
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium mb-1">Min Price</label>
            <input
              type="number"
              value={filters.priceMin || ''}
              onChange={(e) => updateFilter('priceMin', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Min price"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Max Price</label>
            <input
              type="number"
              value={filters.priceMax || ''}
              onChange={(e) => updateFilter('priceMax', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Max price"
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Filters
          </button>
          <button
            onClick={() => fetchProducts(filters)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div>
        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2">Loading products...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Pagination Info */}
        {pagination && !loading && (
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600">
              Showing {products.length} of {pagination.total} results
              (Page {pagination.page} of {pagination.totalPages})
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={() => updateFilter('page', pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
              >
                Previous
              </button>
              <button
                onClick={() => updateFilter('page', pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {product.main_image_url && (
                  <div className="relative w-full h-48">
                    <Image
                      src={product.main_image_url}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg line-clamp-2">{product.title}</h3>
                    {product.is_featured && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                        Featured
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-2">{product.location}</p>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-600 font-medium">{product.category}</span>
                    {product.bedrooms && (
                      <span className="text-gray-500 text-sm">{product.bedrooms} BHK</span>
                    )}
                  </div>
                  
                  <p className="text-xl font-bold text-green-600">
                    {product.price_display || `₹${(product.price / 100000).toFixed(1)}L`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && products.length === 0 && !error && (
          <div className="text-center py-8">
            <p className="text-gray-500">No products found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}