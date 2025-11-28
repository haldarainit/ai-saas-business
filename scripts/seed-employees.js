/**
 * Seed Script for Employee Management
 * Creates demo employees for testing the attendance system
 * 
 * Run: node scripts/seed-employees.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const employeeSchema = new mongoose.Schema({
  employeeId: String,
  name: String,
  email: String,
  phone: String,
  department: String,
  position: String,
  joinDate: Date,
  profileImage: String,
  status: String,
  workSchedule: {
    startTime: String,
    endTime: String,
    workingDays: [Number],
  },
  leaveBalance: {
    casual: Number,
    sick: Number,
    annual: Number,
  },
  createdAt: Date,
  updatedAt: Date,
});

const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);

const demoEmployees = [
  {
    employeeId: 'EMP001',
    name: 'John Doe',
    email: 'john.doe@company.com',
    phone: '+1234567890',
    department: 'Engineering',
    position: 'Senior Developer',
    joinDate: new Date('2023-01-15'),
    status: 'active',
    workSchedule: {
      startTime: '09:00',
      endTime: '18:00',
      workingDays: [1, 2, 3, 4, 5],
    },
    leaveBalance: {
      casual: 10,
      sick: 10,
      annual: 15,
    },
  },
  {
    employeeId: 'EMP002',
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    phone: '+1234567891',
    department: 'Product',
    position: 'Product Manager',
    joinDate: new Date('2022-06-01'),
    status: 'active',
    workSchedule: {
      startTime: '09:00',
      endTime: '18:00',
      workingDays: [1, 2, 3, 4, 5],
    },
    leaveBalance: {
      casual: 8,
      sick: 10,
      annual: 15,
    },
  },
  {
    employeeId: 'EMP003',
    name: 'Mike Johnson',
    email: 'mike.johnson@company.com',
    phone: '+1234567892',
    department: 'Design',
    position: 'UI/UX Designer',
    joinDate: new Date('2023-03-20'),
    status: 'active',
    workSchedule: {
      startTime: '09:00',
      endTime: '18:00',
      workingDays: [1, 2, 3, 4, 5],
    },
    leaveBalance: {
      casual: 10,
      sick: 10,
      annual: 15,
    },
  },
  {
    employeeId: 'EMP004',
    name: 'Sarah Williams',
    email: 'sarah.williams@company.com',
    phone: '+1234567893',
    department: 'Marketing',
    position: 'Marketing Lead',
    joinDate: new Date('2021-11-10'),
    status: 'active',
    workSchedule: {
      startTime: '09:00',
      endTime: '18:00',
      workingDays: [1, 2, 3, 4, 5],
    },
    leaveBalance: {
      casual: 5,
      sick: 10,
      annual: 15,
    },
  },
  {
    employeeId: 'EMP005',
    name: 'David Brown',
    email: 'david.brown@company.com',
    phone: '+1234567894',
    department: 'Engineering',
    position: 'DevOps Engineer',
    joinDate: new Date('2023-07-01'),
    status: 'active',
    workSchedule: {
      startTime: '09:00',
      endTime: '18:00',
      workingDays: [1, 2, 3, 4, 5],
    },
    leaveBalance: {
      casual: 10,
      sick: 10,
      annual: 15,
    },
  },
];

async function seedEmployees() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/business-ai';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing employees
    console.log('Clearing existing employees...');
    await Employee.deleteMany({});
    console.log('Existing employees cleared');

    // Insert demo employees
    console.log('Inserting demo employees...');
    const result = await Employee.insertMany(demoEmployees);
    console.log(`Successfully created ${result.length} employees`);

    // Display created employees
    console.log('\nCreated Employees:');
    result.forEach(emp => {
      console.log(`  - ${emp.name} (${emp.employeeId}) - ${emp.position} in ${emp.department}`);
    });

    console.log('\n✅ Seed completed successfully!');
    console.log('\nYou can now use these employee IDs for testing:');
    demoEmployees.forEach(emp => {
      console.log(`  - ${emp.employeeId}: ${emp.name}`);
    });

  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the seed function
seedEmployees();
