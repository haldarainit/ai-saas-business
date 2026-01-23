/**
 * Test to verify leave request shows up in admin interface after authentication fix
 */

const BASE_URL = 'http://localhost:3000';

async function testLeaveVisibility() {
    console.log('🔍 Testing Leave Request Visibility Fix');
    console.log('='.repeat(60));

    try {
        console.log('\n📋 Test: Try to access /api/leave/all (admin interface)');

        // This should work now with cookie-based authentication (if cookies are present)
        const response = await fetch(`${BASE_URL}/api/leave/all`, {
            credentials: 'include', // Include cookies
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('   Status:', response.status);
        const data: any = await response.json();
        console.log('   Response:', JSON.stringify(data, null, 2));

        if (response.status === 200 && data.success) {
            console.log('\n✅ SUCCESS: Leave requests are now accessible via admin interface');
            console.log(`   Found ${data.count} leave requests`);

            if (data.leaves && data.leaves.length > 0) {
                console.log('\n📝 Leave Requests Found:');
                data.leaves.forEach((leave: any, index: number) => {
                    console.log(`   ${index + 1}. ${leave.employeeName} (${leave.employeeId})`);
                    console.log(`      Type: ${leave.leaveType}`);
                    console.log(`      Status: ${leave.status}`);
                    console.log(`      Dates: ${leave.fromDate} to ${leave.toDate}`);
                    console.log(`      UserId: ${leave.userId}`);
                });
            }
        } else if (response.status === 401) {
            console.log('\n⚠️  AUTHENTICATION REQUIRED: You need to log in as Rajeev first');
            console.log('   Steps to test:');
            console.log('   1. Open browser and log in as Rajeev');
            console.log('   2. Go to employee management -> leave system');
            console.log('   3. Check if Raj\'s leave request now appears');
        } else {
            console.log('\n❌ ERROR: Unexpected response');
        }

    } catch (error: any) {
        console.error('❌ Test error:', error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETED');
    console.log('='.repeat(60));

    console.log('\n💡 Next Steps:');
    console.log('   1. Log in to the web app as Rajeev (the company admin)');
    console.log('   2. Navigate to Employee Management > Leave System');
    console.log('   3. Check if Raj\'s sick leave request (12/21/2025 - 12/22/2025) appears');
    console.log('   4. The leave should now be visible because both systems use the same userId');
}

testLeaveVisibility();
