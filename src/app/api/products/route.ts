import { NextRequest, NextResponse } from "next/server";
import { UnifiedPropertyService } from "@/services/unifiedPropertyService";
import type { UnifiedProperty, CitySlug } from "@/types/unifiedProperty";

/**
 * Product interface extending UnifiedProperty for API responses
 */
export interface Product extends UnifiedProperty {
  category?: string; // Maps to property_type for filtering
}

/**
 * API Query Parameters for products endpoint
 */
interface ProductsQuery {
  category?: string;
  city?: CitySlug;
  page?: string;
  limit?: string;
  sortBy?: string;
  searchQuery?: string;
  priceMin?: string;
  priceMax?: string;
  bedrooms?: string;
  location?: string;
}

/**
 * API Response format for products
 */
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

/**
 * API Route: GET /api/products
 * 
 * Retrieves a paginated list of products (properties) with optional filtering
 * 
 * Query Parameters:
 * - category: Filter by property type (e.g., 'Apartment', 'Villa', 'Holiday Home')
 * - city: Filter by city ('hyderabad', 'goa', 'dubai')
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - sortBy: Sort order ('newest', 'oldest', 'price_asc', 'price_desc', 'featured')
 * - searchQuery: Search in title, description, location
 * - priceMin: Minimum price filter
 * - priceMax: Maximum price filter
 * - bedrooms: Filter by number of bedrooms
 * - location: Filter by location/micro-market
 * 
 * Example: GET /api/products?category=Apartment&city=hyderabad&page=1&limit=20
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract and validate query parameters
    const query: ProductsQuery = {
      category: searchParams.get('category') || undefined,
      city: searchParams.get('city') as CitySlug || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      sortBy: searchParams.get('sortBy') || 'newest',
      searchQuery: searchParams.get('searchQuery') || undefined,
      priceMin: searchParams.get('priceMin') || undefined,
      priceMax: searchParams.get('priceMax') || undefined,
      bedrooms: searchParams.get('bedrooms') || undefined,
      location: searchParams.get('location') || undefined,
    };

    // Validate pagination parameters
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);

    if (isNaN(page) || page <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid page number. Must be a positive integer.' 
        },
        { status: 400 }
      );
    }

    if (isNaN(limit) || limit <= 0 || limit > 100) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid limit. Must be a positive integer up to 100.' 
        },
        { status: 400 }
      );
    }

    // Validate city parameter if provided
    if (query.city && !['hyderabad', 'goa', 'dubai'].includes(query.city)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid city. Must be one of: hyderabad, goa, dubai' 
        },
        { status: 400 }
      );
    }

    // Validate price parameters
    let priceMin: number | undefined;
    let priceMax: number | undefined;
    
    if (query.priceMin) {
      priceMin = parseFloat(query.priceMin);
      if (isNaN(priceMin) || priceMin < 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid priceMin. Must be a non-negative number.' 
          },
          { status: 400 }
        );
      }
    }

    if (query.priceMax) {
      priceMax = parseFloat(query.priceMax);
      if (isNaN(priceMax) || priceMax < 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid priceMax. Must be a non-negative number.' 
          },
          { status: 400 }
        );
      }
    }

    if (priceMin && priceMax && priceMin > priceMax) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'priceMin cannot be greater than priceMax.' 
        },
        { status: 400 }
      );
    }

    // Fetch properties from all cities or specific city
    let allProperties: UnifiedProperty[] = [];
    
    if (query.city) {
      // Fetch from specific city
      allProperties = await UnifiedPropertyService.getProperties(query.city);
    } else {
      // Fetch from all cities
      const cities: CitySlug[] = ['hyderabad', 'goa', 'dubai'];
      const cityPromises = cities.map(city => 
        UnifiedPropertyService.getProperties(city).catch(error => {
          console.error(`Error fetching properties from ${city}:`, error);
          return [];
        })
      );
      const cityResults = await Promise.all(cityPromises);
      allProperties = cityResults.flat();
    }

    // Apply filters
    let filteredProperties = allProperties;

    // Category filter (maps to property_type)
    if (query.category) {
      filteredProperties = filteredProperties.filter(
        property => property.property_type.toLowerCase() === query.category!.toLowerCase()
      );
    }

    // Search query filter
    if (query.searchQuery) {
      const searchTerm = query.searchQuery.toLowerCase();
      filteredProperties = filteredProperties.filter(property =>
        property.title.toLowerCase().includes(searchTerm) ||
        property.description.toLowerCase().includes(searchTerm) ||
        property.location.toLowerCase().includes(searchTerm) ||
        (property.micro_market && property.micro_market.toLowerCase().includes(searchTerm)) ||
        (property.project_name && property.project_name.toLowerCase().includes(searchTerm))
      );
    }

    // Price range filter
    if (priceMin !== undefined) {
      filteredProperties = filteredProperties.filter(property => property.price >= priceMin!);
    }
    if (priceMax !== undefined) {
      filteredProperties = filteredProperties.filter(property => property.price <= priceMax!);
    }

    // Bedrooms filter
    if (query.bedrooms) {
      const bedroomCount = parseInt(query.bedrooms, 10);
      if (!isNaN(bedroomCount)) {
        filteredProperties = filteredProperties.filter(property => property.bedrooms === bedroomCount);
      }
    }

    // Location filter
    if (query.location) {
      const locationTerm = query.location.toLowerCase();
      filteredProperties = filteredProperties.filter(property =>
        property.location.toLowerCase().includes(locationTerm) ||
        (property.micro_market && property.micro_market.toLowerCase().includes(locationTerm)) ||
        (property.district && property.district.toLowerCase().includes(locationTerm)) ||
        (property.emirate && property.emirate.toLowerCase().includes(locationTerm)) ||
        (property.community && property.community.toLowerCase().includes(locationTerm))
      );
    }

    // Sort properties
    switch (query.sortBy) {
      case 'oldest':
        filteredProperties.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'price_asc':
        filteredProperties.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filteredProperties.sort((a, b) => b.price - a.price);
        break;
      case 'featured':
        filteredProperties.sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        break;
      case 'newest':
      default:
        filteredProperties.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    // Calculate pagination
    const total = filteredProperties.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Get paginated results
    const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

    // Transform properties to products (add category field)
    const products: Product[] = paginatedProperties.map(property => ({
      ...property,
      category: property.property_type, // Map property_type to category for API consistency
    }));

    // Prepare response
    const response: ProductsResponse = {
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        category: query.category,
        city: query.city,
        priceRange: priceMin !== undefined || priceMax !== undefined ? { min: priceMin, max: priceMax } : undefined,
        location: query.location,
      },
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error("Error in products API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint info for API documentation
 */
export async function OPTIONS() {
  return NextResponse.json({
    message: "Products API endpoint",
    methods: ["GET"],
    description: "Retrieve paginated list of products (properties) with filtering capabilities",
    queryParameters: {
      category: "Filter by property type (e.g., 'Apartment', 'Villa')",
      city: "Filter by city ('hyderabad', 'goa', 'dubai')",
      page: "Page number (default: 1)",
      limit: "Items per page (default: 10, max: 100)",
      sortBy: "Sort order ('newest', 'oldest', 'price_asc', 'price_desc', 'featured')",
      searchQuery: "Search in title, description, location",
      priceMin: "Minimum price filter",
      priceMax: "Maximum price filter",
      bedrooms: "Filter by number of bedrooms",
      location: "Filter by location/micro-market"
    },
    examples: [
      "/api/products",
      "/api/products?category=Apartment&city=hyderabad&page=1&limit=20",
      "/api/products?priceMin=5000000&priceMax=15000000&bedrooms=3",
      "/api/products?searchQuery=luxury&sortBy=price_desc"
    ]
  });
}