"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { motion } from "framer-motion";
import { DollarSign, Calendar, Download, Calculator, CreditCard, FileText } from "lucide-react";
import Link from "next/link";

export default function Payroll() {
  const payrollData = [
    { id: 1, name: "John Doe", position: "Senior Developer", salary: "$8,500", tax: "$1,700", net: "$6,800" },
    { id: 2, name: "Jane Smith", position: "Product Manager", salary: "$9,000", tax: "$1,800", net: "$7,200" },
    { id: 3, name: "Mike Johnson", position: "Designer", salary: "$7,000", tax: "$1,400", net: "$5,600" },
    { id: 4, name: "Sarah Williams", position: "Marketing Lead", salary: "$7,500", tax: "$1,500", net: "$6,000" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 overflow-hidden bg-gradient-to-br from-green-500/5 via-background to-emerald-500/5">
          <div className="container relative px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl"
            >
              <Link href="/employee-management" className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block">
                ← Back to Employee Management
              </Link>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold">Payroll Management</h1>
              </div>
              <p className="text-xl text-muted-foreground">
                Automate payroll processing with accurate calculations, tax management, and direct deposits.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-8 border-y bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="p-4">
                <div className="text-2xl font-bold text-green-500">$245K</div>
                <div className="text-sm text-muted-foreground">Monthly Payroll</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-blue-500">$49K</div>
                <div className="text-sm text-muted-foreground">Total Deductions</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-purple-500">95</div>
                <div className="text-sm text-muted-foreground">Employees Paid</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-orange-500">100%</div>
                <div className="text-sm text-muted-foreground">On-Time</div>
              </Card>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="container px-4 md:px-6">
            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-1">Current Period</h2>
                <p className="text-sm text-muted-foreground">November 1 - November 30, 2025</p>
              </div>
              <div className="flex gap-2">
                <Button>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Payroll
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Payroll Table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-semibold">Employee</th>
                      <th className="p-4 font-semibold">Position</th>
                      <th className="p-4 font-semibold">Gross Salary</th>
                      <th className="p-4 font-semibold">Deductions</th>
                      <th className="p-4 font-semibold">Net Pay</th>
                      <th className="p-4 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollData.map((record) => (
                      <tr key={record.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-4 font-medium">{record.name}</td>
                        <td className="p-4 text-muted-foreground">{record.position}</td>
                        <td className="p-4 text-muted-foreground">{record.salary}</td>
                        <td className="p-4 text-muted-foreground">{record.tax}</td>
                        <td className="p-4 font-semibold text-green-600">{record.net}</td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <Card className="p-6">
                <Calculator className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Auto Calculations</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically calculate salaries, taxes, and deductions with precision.
                </p>
              </Card>
              <Card className="p-6">
                <CreditCard className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Direct Deposits</h3>
                <p className="text-sm text-muted-foreground">
                  Set up direct deposit for seamless salary transfers to employee accounts.
                </p>
              </Card>
              <Card className="p-6">
                <FileText className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Salary Slips</h3>
                <p className="text-sm text-muted-foreground">
                  Generate and distribute detailed salary slips to employees automatically.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
