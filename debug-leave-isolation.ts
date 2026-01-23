/**
 * Debug script to check leave request data isolation
 */

import dbConnect from './lib/mongodb';
import Leave from './lib/models/Leave';
import Employee from './lib/models/Employee';

const BASE_URL = 'http://localhost:3000';

async function debugLeaveRequest() {
    console.log('🔍 Debugging Leave Request Data Isolation');
    console.log('='.repeat(60));

    try {
        await dbConnect();

        // Find the leave request for Raj (EMP124)
        console.log('\n📋 Checking leave request for EMP124 (Raj)...');
        const leave: any = await Leave.findOne({ employeeId: 'EMP124' }).lean();

        if (leave) {
            console.log('✅ Leave request found:');
            console.log('   Leave ID:', leave._id);
            console.log('   Employee ID:', leave.employeeId);
            console.log('   Employee Name:', leave.employeeName);
            console.log('   Leave Type:', leave.leaveType);
            console.log('   Status:', leave.status);
            console.log('   🔑 userId:', leave.userId);
            console.log('   From Date:', leave.fromDate);
            console.log('   To Date:', leave.toDate);
            console.log('   Reason:', leave.reason);
        } else {
            console.log('❌ No leave request found for EMP124');
        }

        // Find the employee record for Raj
        console.log('\n👤 Checking employee record for EMP124 (Raj)...');
        const employee: any = await Employee.findOne({ employeeId: 'EMP124' }).lean();

        if (employee) {
            console.log('✅ Employee record found:');
            console.log('   Employee ID:', employee.employeeId);
            console.log('   Employee Name:', employee.name);
            console.log('   🔑 userId:', employee.userId);
            console.log('   Status:', employee.status);
        } else {
            console.log('❌ No employee record found for EMP124');
        }

        // Find all employees for Rajeev's account (to get his userId)
        console.log('\n🏢 Checking all employees to identify userId patterns...');
        const allEmployees: any[] = await Employee.find({}).select('employeeId name userId').lean();

        const userIdGroups: Record<string, string[]> = {};
        allEmployees.forEach(emp => {
            if (!userIdGroups[emp.userId]) {
                userIdGroups[emp.userId] = [];
            }
            userIdGroups[emp.userId].push(`${emp.employeeId} (${emp.name})`);
        });

        console.log('📊 Employees grouped by userId:');
        for (const [userId, employees] of Object.entries(userIdGroups)) {
            console.log(`   ${userId}: ${employees.join(', ')}`);
        }

        // Find all leave requests grouped by userId
        console.log('\n📝 Checking all leave requests grouped by userId...');
        const allLeaves: any[] = await Leave.find({}).select('employeeId employeeName userId leaveType status').lean();

        const leavesByUser: Record<string, string[]> = {};
        allLeaves.forEach(leave => {
            if (!leavesByUser[leave.userId]) {
                leavesByUser[leave.userId] = [];
            }
            leavesByUser[leave.userId].push(`${leave.employeeId} (${leave.employeeName}) - ${leave.leaveType} - ${leave.status}`);
        });

        console.log('📊 Leave requests grouped by userId:');
        for (const [userId, leaves] of Object.entries(leavesByUser)) {
            console.log(`   ${userId}:`);
            leaves.forEach(leave => console.log(`     - ${leave}`));
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ DEBUG COMPLETE');
        console.log('='.repeat(60));

        console.log('\n💡 Expected Behavior:');
        console.log('   - Raj (EMP124) should have same userId as other employees under Rajeev');
        console.log('   - Leave request for Raj should have same userId');
        console.log('   - Admin interface should show leaves for that userId');

    } catch (error) {
        console.error('❌ Debug error:', error);
    }

    process.exit(0);
}

debugLeaveRequest();
