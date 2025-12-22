# Products API Endpoint Documentation

## Overview

The `/api/products` endpoint provides a comprehensive API for retrieving properties as "products" with advanced filtering, pagination, and search capabilities. It leverages the existing `UnifiedPropertyService` to fetch data from multiple cities (Hyderabad, Goa, Dubai) and presents it in a standardized format.

## Endpoint Details

- **URL**: `/api/products`
- **Method**: `GET`
- **Response Format**: JSON

## Query Parameters

| Parameter | Type | Description | Default | Example |
|-----------|------|-------------|---------|---------|
| `category` | string | Filter by property type (e.g., 'Apartment', 'Villa') | - | `?category=Apartment` |
| `city` | string | Filter by city ('hyderabad', 'goa', 'dubai') | all cities | `?city=hyderabad` |
| `page` | number | Page number (1-based) | 1 | `?page=2` |
| `limit` | number | Items per page (max 100) | 10 | `?limit=20` |
| `sortBy` | string | Sort order | 'newest' | `?sortBy=price_asc` |
| `searchQuery` | string | Search in title, description, location | - | `?searchQuery=luxury` |
| `priceMin` | number | Minimum price filter | - | `?priceMin=5000000` |
| `priceMax` | number | Maximum price filter | - | `?priceMax=15000000` |
| `bedrooms` | number | Filter by number of bedrooms | - | `?bedrooms=3` |
| `location` | string | Filter by location/micro-market | - | `?location=Gachibowli` |

### Sort Options

- `newest` (default): Sort by creation date, newest first
- `oldest`: Sort by creation date, oldest first
- `price_asc`: Sort by price, lowest first
- `price_desc`: Sort by price, highest first
- `featured`: Sort by featured properties first, then by newest

## Response Format

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "slug": "string",
      "description": "string",
      "price": 0,
      "price_display": "string",
      "property_type": "string",
      "category": "string",
      "location": "string",
      "area_sqft": 0,
      "bedrooms": 0,
      "bathrooms": 0,
      "main_image_url": "string",
      "image_gallery": ["string"],
      "is_featured": false,
      "status": "string",
      "created_at": "string",
      "updated_at": "string"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "category": "string",
    "city": "string",
    "priceRange": {
      "min": 0,
      "max": 0
    },
    "location": "string"
  }
}
```

## Example Requests

### 1. Basic Request (All Products)
```
GET /api/products
```

### 2. Filtered by City and Category
```
GET /api/products?city=hyderabad&category=Apartment&page=1&limit=20
```

### 3. Price Range Filter
```
GET /api/products?priceMin=5000000&priceMax=15000000&bedrooms=3
```

### 4. Search with Sorting
```
GET /api/products?searchQuery=luxury&sortBy=price_desc&limit=5
```

### 5. Location-based Filter
```
GET /api/products?city=goa&location=North%20Goa&sortBy=featured
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid page number. Must be a positive integer."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Features

### 1. **Multi-City Support**
- Fetches properties from Hyderabad, Goa, and Dubai
- Handles different property schemas across cities
- Unified response format

### 2. **Advanced Filtering**
- Property type (category) filtering
- Price range filtering with min/max values
- Location-based filtering (supports micro-markets, districts, emirates)
- Bedroom count filtering
- Full-text search across multiple fields

### 3. **Flexible Sorting**
- Multiple sort options including price and date
- Featured properties prioritization
- Consistent sorting across all cities

### 4. **Robust Pagination**
- Page-based pagination with configurable limits
- Comprehensive pagination metadata
- Navigation helpers (hasNext, hasPrev)

### 5. **Comprehensive Search**
- Searches across title, description, location
- Includes micro-market and project name search
- Case-insensitive matching

### 6. **Error Handling**
- Input validation with detailed error messages
- Graceful handling of missing data
- Proper HTTP status codes

### 7. **Performance Optimizations**
- Efficient filtering and sorting
- Minimal database queries
- Proper error recovery for individual cities

## Integration Notes

### Frontend Integration
```javascript
// Example fetch with multiple filters
const fetchProducts = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/products?${params}`);
  const data = await response.json();
  
  if (data.success) {
    return data;
  } else {
    throw new Error(data.error);
  }
};

// Usage
const products = await fetchProducts({
  city: 'hyderabad',
  category: 'Apartment',
  priceMin: 5000000,
  priceMax: 15000000,
  page: 1,
  limit: 20
});
```

### Backend Dependencies
- `UnifiedPropertyService`: Handles property fetching from multiple cities
- `UnifiedProperty` type: Provides consistent property structure
- Supabase: Database connection for property data

## Testing

The endpoint can be tested using:
1. Browser: Direct GET requests
2. Postman/Insomnia: API testing tools
3. cURL: Command line testing
4. Frontend integration: React/Next.js components

## Security Considerations

- Input validation prevents injection attacks
- Rate limiting should be implemented at the server level
- No sensitive data exposure in error messages
- Proper error handling prevents information leakage