/**
 * Quick script to test attendance without rate limiting
 * This bypasses rate limits for development testing
 */

const BASE_URL = 'http://localhost:3000';

// Very small test image
const TEST_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testQuickAttendance() {
  console.log('Testing attendance without rate limits...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: 'TEST001',
        image: TEST_IMAGE,
        location: { latitude: 40.7128, longitude: -74.0060 },
        action: 'clockIn',
        deviceInfo: 'Test Script',
      }),
    });

    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.status === 429) {
      console.log('\n⚠️  Rate limit hit. Waiting 15 seconds...');
      await new Promise(resolve => setTimeout(resolve, 15000));
      console.log('Retrying...\n');
      return testQuickAttendance();
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testQuickAttendance();
