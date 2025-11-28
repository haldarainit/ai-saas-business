/**
 * Test Script for Attendance Module APIs
 * 
 * This script tests all attendance endpoints
 * Run: node scripts/test-attendance-api.js
 */

const BASE_URL = 'http://localhost:3000';

// Sample base64 image (1x1 pixel transparent PNG for testing)
const SAMPLE_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testAPI(name, method, endpoint, body = null) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   ${method} ${endpoint}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log('   ✅ Success:', response.status);
      console.log('   Response:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
    } else {
      console.log('   ❌ Failed:', response.status);
      console.log('   Error:', data.error || data.message);
    }
    
    return { success: response.ok, data };
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('ATTENDANCE MODULE API TESTS');
  console.log('='.repeat(60));
  
  // Test 1: Get all employees
  const employeesResult = await testAPI(
    'Get All Employees',
    'GET',
    '/api/employees?status=active'
  );
  
  const employeeId = employeesResult.data?.employees?.[0]?.employeeId || 'EMP001';
  console.log(`   Using employee ID: ${employeeId}`);
  
  // Test 2: Create employee (if needed)
  if (!employeesResult.data?.employees?.length) {
    await testAPI(
      'Create Demo Employee',
      'POST',
      '/api/employees',
      {
        employeeId: 'TEST001',
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        department: 'Testing',
        position: 'QA Engineer',
      }
    );
  }
  
  // Test 3: Mark clock-in
  await testAPI(
    'Mark Clock In',
    'POST',
    '/api/attendance/mark',
    {
      employeeId,
      image: SAMPLE_IMAGE,
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
      },
      action: 'clockIn',
      deviceInfo: 'Test Script',
    }
  );
  
  // Wait a bit
  console.log('\n⏳ Waiting 2 seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 4: Try duplicate clock-in (should fail)
  await testAPI(
    'Duplicate Clock In (Should Fail)',
    'POST',
    '/api/attendance/mark',
    {
      employeeId,
      image: SAMPLE_IMAGE,
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
      },
      action: 'clockIn',
      deviceInfo: 'Test Script',
    }
  );
  
  // Test 5: Get daily attendance
  const today = new Date().toISOString().split('T')[0];
  await testAPI(
    'Get Daily Attendance',
    'GET',
    `/api/attendance/${employeeId}/${today}`
  );
  
  // Test 6: Get all attendance for today
  await testAPI(
    'Get All Attendance for Today',
    'GET',
    `/api/attendance/all/${today}`
  );
  
  // Test 7: Get monthly summary
  const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  await testAPI(
    'Get Monthly Summary',
    'GET',
    `/api/attendance/month/${employeeId}/${thisMonth}`
  );
  
  // Test 8: Mark clock-out
  await testAPI(
    'Mark Clock Out',
    'POST',
    '/api/attendance/mark',
    {
      employeeId,
      image: SAMPLE_IMAGE,
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
      },
      action: 'clockOut',
      deviceInfo: 'Test Script',
    }
  );
  
  // Test 9: Get updated attendance (should show working hours)
  await testAPI(
    'Get Updated Attendance with Working Hours',
    'GET',
    `/api/attendance/${employeeId}/${today}`
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('TESTS COMPLETED');
  console.log('='.repeat(60));
  console.log('\n💡 Tips:');
  console.log('   - Make sure MongoDB is running');
  console.log('   - Make sure the dev server is running (npm run dev)');
  console.log('   - Run "npm run seed:employees" to create demo employees');
  console.log('   - Check the attendance page: http://localhost:3000/employee-management/attendance');
}

// Run tests
runTests().catch(console.error);
