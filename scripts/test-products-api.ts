#!/usr/bin/env tsx

/**
 * Test script for the Products API endpoint
 * 
 * This script tests various scenarios of the /api/products endpoint
 * to ensure proper functionality, validation, and error handling.
 * 
 * Usage: tsx scripts/test-products-api.ts
 */

interface TestCase {
  name: string;
  url: string;
  expectedStatus?: number;
  expectedFields?: string[];
  description: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

const testCases: TestCase[] = [
  {
    name: 'Basic Request',
    url: '/api/products',
    expectedStatus: 200,
    expectedFields: ['success', 'data', 'pagination'],
    description: 'Test basic endpoint functionality'
  },
  {
    name: 'Pagination Test',
    url: '/api/products?page=1&limit=5',
    expectedStatus: 200,
    expectedFields: ['success', 'data', 'pagination'],
    description: 'Test pagination with custom page and limit'
  },
  {
    name: 'City Filter',
    url: '/api/products?city=hyderabad',
    expectedStatus: 200,
    expectedFields: ['success', 'data', 'pagination', 'filters'],
    description: 'Test filtering by city'
  },
  {
    name: 'Category Filter',
    url: '/api/products?category=Apartment',
    expectedStatus: 200,
    expectedFields: ['success', 'data', 'pagination', 'filters'],
    description: 'Test filtering by property category'
  },
  {
    name: 'Price Range Filter',
    url: '/api/products?priceMin=5000000&priceMax=15000000',
    expectedStatus: 200,
    expectedFields: ['success', 'data', 'pagination', 'filters'],
    description: 'Test price range filtering'
  },
  {
    name: 'Search Query',
    url: '/api/products?searchQuery=luxury&sortBy=price_desc',
    expectedStatus: 200,
    expectedFields: ['success', 'data', 'pagination'],
    description: 'Test search functionality with sorting'
  },
  {
    name: 'Multiple Filters',
    url: '/api/products?city=hyderabad&category=Apartment&bedrooms=3&page=1&limit=10',
    expectedStatus: 200,
    expectedFields: ['success', 'data', 'pagination', 'filters'],
    description: 'Test multiple filters combined'
  },
  {
    name: 'Invalid Page Number',
    url: '/api/products?page=0',
    expectedStatus: 400,
    expectedFields: ['success', 'error'],
    description: 'Test validation for invalid page number'
  },
  {
    name: 'Invalid Limit',
    url: '/api/products?limit=150',
    expectedStatus: 400,
    expectedFields: ['success', 'error'],
    description: 'Test validation for limit exceeding maximum'
  },
  {
    name: 'Invalid City',
    url: '/api/products?city=invalid_city',
    expectedStatus: 400,
    expectedFields: ['success', 'error'],
    description: 'Test validation for invalid city parameter'
  },
  {
    name: 'Invalid Price Range',
    url: '/api/products?priceMin=10000000&priceMax=5000000',
    expectedStatus: 400,
    expectedFields: ['success', 'error'],
    description: 'Test validation for invalid price range (min > max)'
  },
  {
    name: 'OPTIONS Request',
    url: '/api/products',
    expectedStatus: 200,
    expectedFields: ['message', 'methods', 'queryParameters'],
    description: 'Test OPTIONS method for API documentation'
  }
];

async function runTest(testCase: TestCase): Promise<boolean> {
  try {
    console.log(`\n🧪 Running: ${testCase.name}`);
    console.log(`📝 Description: ${testCase.description}`);
    console.log(`🔗 URL: ${testCase.url}`);

    const method = testCase.name === 'OPTIONS Request' ? 'OPTIONS' : 'GET';
    const response = await fetch(`${BASE_URL}${testCase.url}`, { method });
    
    // Check status code
    const expectedStatus = testCase.expectedStatus || 200;
    if (response.status !== expectedStatus) {
      console.log(`❌ Status code mismatch. Expected: ${expectedStatus}, Got: ${response.status}`);
      return false;
    }

    // Parse response
    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);

    // Check expected fields
    if (testCase.expectedFields) {
      const missingFields = testCase.expectedFields.filter(field => !(field in data));
      if (missingFields.length > 0) {
        console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
        return false;
      }
      console.log(`✅ All expected fields present: ${testCase.expectedFields.join(', ')}`);
    }

    // Additional validations based on test case
    if (data.success && data.data) {
      console.log(`📊 Results: ${data.data.length} items`);
      
      if (data.pagination) {
        console.log(`📄 Pagination: Page ${data.pagination.page}/${data.pagination.totalPages}, Total: ${data.pagination.total}`);
      }

      if (data.filters) {
        console.log(`🔍 Applied filters:`, JSON.stringify(data.filters, null, 2));
      }

      // Validate data structure for successful responses
      if (data.data.length > 0) {
        const firstItem = data.data[0];
        const requiredProductFields = ['id', 'title', 'price', 'property_type', 'category'];
        const missingProductFields = requiredProductFields.filter(field => !(field in firstItem));
        
        if (missingProductFields.length > 0) {
          console.log(`❌ Missing product fields: ${missingProductFields.join(', ')}`);
          return false;
        }
        console.log(`✅ Product structure valid`);
      }
    } else if (!data.success && data.error) {
      console.log(`⚠️  Expected error: ${data.error}`);
    }

    return true;

  } catch (error) {
    console.log(`❌ Test failed with error:`, error);
    return false;
  }
}

async function runAllTests(): Promise<void> {
  console.log('🚀 Starting Products API Tests');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log('=' .repeat(50));

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const result = await runTest(testCase);
    if (result) {
      passed++;
      console.log(`✅ PASSED: ${testCase.name}`);
    } else {
      failed++;
      console.log(`❌ FAILED: ${testCase.name}`);
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed!');
    process.exit(1);
  }
}

// Handle different execution contexts
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests, testCases };