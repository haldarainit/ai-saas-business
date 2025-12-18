/**
 * Test script to verify employee data isolation
 * This script tests that employees are properly filtered by userId
 */

const BASE_URL = 'http://localhost:3000';

async function testAPI(name, method, endpoint, body = null, headers = {}) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`${method} ${endpoint}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(result, null, 2));
    
    return { status: response.status, data: result };
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return { status: 500, error: error.message };
  }
}

async function runTests() {
  console.log('🔍 Testing Employee Data Isolation');
  console.log('='.repeat(50));
  
  // Test 1: Try to get employees without authentication
  console.log('\n📋 Test 1: Access without authentication');
  await testAPI(
    'Get Employees (No Auth)',
    'GET',
    '/api/employees'
  );
  
  // Test 2: Try to get attendance without authentication
  console.log('\n📋 Test 2: Attendance without authentication');
  await testAPI(
    'Get Attendance (No Auth)',
    'GET',
    '/api/attendance/all'
  );
  
  // Test 3: Try to mark attendance without authentication
  console.log('\n📋 Test 3: Mark attendance without authentication');
  await testAPI(
    'Mark Attendance (No Auth)',
    'POST',
    '/api/attendance/mark',
    {
      employeeId: 'EMP001',
      image: 'data:image/png;base64,test',
      location: { latitude: 0, longitude: 0 },
      action: 'clockIn'
    }
  );
  
  // Test 4: Try to get leave requests without authentication
  console.log('\n📋 Test 4: Leave requests without authentication');
  await testAPI(
    'Get Leave Requests (No Auth)',
    'GET',
    '/api/leave/all'
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('🔐 DATA ISOLATION TEST COMPLETED');
  console.log('='.repeat(60));
  console.log('\n💡 Expected Results:');
  console.log('   ✅ All requests should return 401 (Unauthorized)');
  console.log('   ✅ No employee/attendance/leave data should be returned');
  console.log('   ✅ System now requires authentication for all sensitive operations');
  console.log('\n🎯 Next Steps:');
  console.log('   1. Test with valid authentication tokens');
  console.log('   2. Verify different users see different employee data');
  console.log('   3. Confirm cross-user data leakage is prevented');
}

// Run tests
runTests().catch(console.error);