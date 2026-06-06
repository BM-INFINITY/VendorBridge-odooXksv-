"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Bell,
  Building2,
  Plus,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleLogout = async () => {
    setIsLoggingOut(true);
    // Simulate logout delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoggingOut(false);
    router.push("/login");
  };

  const stats = [
    {
      title: "Total Spend",
      value: "$1,248,500",
      change: "+12.3% vs last month",
      icon: DollarSign,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      trend: "up",
    },
    {
      title: "Active Vendors",
      value: "142",
      change: "+4 onboarded this week",
      icon: Users,
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
      trend: "up",
    },
    {
      title: "Pending POs",
      value: "18",
      change: "6 require urgent review",
      icon: Clock,
      color: "bg-amber-500",
      textColor: "text-amber-600",
      trend: "warning",
    },
    {
      title: "Compliance Rate",
      value: "98.4%",
      change: "+0.2% improvement",
      icon: CheckCircle2,
      color: "bg-purple-500",
      textColor: "text-purple-600",
      trend: "up",
    },
  ];

  const recentPOs = [
    {
      id: "PO-2026-004",
      vendor: "Acme Industrial Corp",
      amount: "$45,200",
      status: "Approved",
      date: "Jun 5, 2026",
      badgeColor: "bg-green-50 text-green-700 border-green-200",
    },
    {
      id: "PO-2026-003",
      vendor: "Globex Global Logistics",
      amount: "$12,500",
      status: "Pending Approval",
      date: "Jun 4, 2026",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      id: "PO-2026-002",
      vendor: "Initech Software Corp",
      amount: "$8,200",
      status: "Approved",
      date: "Jun 2, 2026",
      badgeColor: "bg-green-50 text-green-700 border-green-200",
    },
    {
      id: "PO-2026-001",
      vendor: "Stark Energy Solutions",
      amount: "$120,000",
      status: "Rejected",
      date: "May 28, 2026",
      badgeColor: "bg-red-50 text-red-700 border-red-200",
    },
  ];

  const activities = [
    {
      time: "10 mins ago",
      text: "Acme Industrial Corp uploaded compliance document 'W-9 Form'",
      type: "compliance",
    },
    {
      time: "2 hours ago",
      text: "Purchase Order PO-2026-003 created by John Doe (Procurement Officer)",
      type: "po",
    },
    {
      time: "1 day ago",
      text: "Vendor request from 'Umbrella Corp' approved for onboarding",
      type: "vendor",
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        {/* Brand/Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="flex items-center justify-center w-9 h-9 bg-blue-600 rounded-lg">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight text-sm">VendorBridge</h1>
            <p className="text-[10px] text-slate-400">Enterprise ERP</p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "dashboard"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("vendors")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "vendors"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            Vendors
          </button>
          <button
            onClick={() => setActiveTab("pos")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "pos"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            Purchase Orders
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "settings"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-sm">
              JD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">John Doe</p>
              <p className="text-[10px] text-slate-400 truncate">Procurement Admin</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-slate-800/50 cursor-pointer h-9 px-3 gap-2"
          >
            <LogOut className="w-4 h-4" />
            {isLoggingOut ? "Signing out..." : "Sign Out"}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 w-96">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <Input
              type="text"
              placeholder="Search purchase orders, vendors, files..."
              className="border-none bg-transparent shadow-none h-8 text-slate-700 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-600">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
            </button>
            <Separator orientation="vertical" className="h-6 bg-slate-200" />
            <div className="text-xs font-semibold text-slate-700">VendorBridge v1.2</div>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Page Title & Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">ERP Dashboard Overview</h2>
                <p className="text-sm text-slate-500">Real-time insight into procurement, spending, and vendor onboarding.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="border-slate-200 h-9 text-slate-700 hover:bg-slate-50">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white h-9">
                  <Plus className="w-4 h-4 mr-2" />
                  Create PO
                </Button>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {stats.map((stat) => (
                <Card key={stat.title} className="border border-slate-200/80 shadow-sm shadow-slate-100/30">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.title}</p>
                      <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                      <p className="text-xs flex items-center gap-1 font-medium text-slate-400">
                        {stat.trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
                        {stat.trend === "warning" && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                        <span className={stat.trend === "up" ? "text-green-600 font-semibold" : stat.trend === "warning" ? "text-amber-600 font-semibold" : ""}>
                          {stat.change.split(" ")[0]}
                        </span>{" "}
                        {stat.change.split(" ").slice(1).join(" ")}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${stat.color} bg-opacity-95 shadow-sm`}>
                      <stat.icon className="w-5.5 h-5.5" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Bottom Row Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Purchase Orders Table */}
              <Card className="lg:col-span-2 border border-slate-200/80 shadow-sm shadow-slate-100/30">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 text-sm">Recent Purchase Orders</h3>
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5 transition-colors">
                    View all POs
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-5">PO Number</th>
                        <th className="py-3 px-5">Vendor</th>
                        <th className="py-3 px-5">Amount</th>
                        <th className="py-3 px-5">Date</th>
                        <th className="py-3 px-5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
                      {recentPOs.map((po) => (
                        <tr key={po.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-5 font-bold text-slate-800">{po.id}</td>
                          <td className="py-3.5 px-5 text-slate-700">{po.vendor}</td>
                          <td className="py-3.5 px-5 text-slate-900 font-bold">{po.amount}</td>
                          <td className="py-3.5 px-5 text-slate-400">{po.date}</td>
                          <td className="py-3.5 px-5 text-right">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${po.badgeColor}`}>
                              {po.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Vendor Activity Stream */}
              <Card className="border border-slate-200/80 shadow-sm shadow-slate-100/30">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800 text-sm">System Audit &amp; Activity Log</h3>
                </div>
                <div className="p-5">
                  <div className="relative border-l-2 border-slate-100 pl-4 space-y-6">
                    {activities.map((activity, index) => (
                      <div key={index} className="relative">
                        {/* Bullet point icon mapping */}
                        <span className={`absolute -left-[25px] top-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white ring-4 ring-slate-50 ${
                          activity.type === "compliance" ? "bg-purple-100 text-purple-600" :
                          activity.type === "po" ? "bg-amber-100 text-amber-600" :
                          "bg-emerald-100 text-emerald-600"
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        </span>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-medium">{activity.time}</span>
                          <p className="text-xs text-slate-600 font-semibold leading-relaxed">{activity.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
