"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  Upload,
  Search,
  BarChart3,
} from "lucide-react"
import Link from "next/link"

const DEMO_DATA = {
  exporter: {
    stats: {
      totalDocuments: 156,
      pendingValidation: 8,
      complianceScore: 94,
      errorsReduced: 67,
    },
    recentDocuments: [
      { id: 1, name: "Invoice_INV001.pdf", status: "validated", date: "2024-01-15", errors: 0 },
      { id: 2, name: "BOE_BOE002.pdf", status: "pending", date: "2024-01-14", errors: 2 },
      { id: 3, name: "Invoice_INV003.pdf", status: "error", date: "2024-01-13", errors: 5 },
    ],
  },
  ca: {
    stats: {
      clientsManaged: 45,
      auditsCompleted: 23,
      complianceIssues: 12,
      avgResolutionTime: 2.3,
    },
    clients: [
      { name: "ABC Exports Ltd", compliance: 96, issues: 1 },
      { name: "XYZ Trading Co", compliance: 89, issues: 3 },
      { name: "Global Traders", compliance: 92, issues: 2 },
    ],
  },
  forwarder: {
    stats: {
      shipmentsProcessed: 234,
      documentsValidated: 456,
      avgProcessingTime: 1.8,
      errorRate: 3.2,
    },
    shipments: [
      { id: "SH001", exporter: "ABC Exports", status: "cleared", docs: 5 },
      { id: "SH002", exporter: "XYZ Trading", status: "pending", docs: 3 },
      { id: "SH003", exporter: "Global Traders", status: "error", docs: 4 },
    ],
  },
  admin: {
    stats: {
      totalUsers: 1234,
      activeUsers: 892,
      systemUptime: 99.8,
      apiCalls: 45678,
    },
    systemHealth: [
      { service: "AI Engine", status: "healthy", uptime: 99.9 },
      { service: "Document Parser", status: "healthy", uptime: 99.7 },
      { service: "Database", status: "warning", uptime: 98.5 },
    ],
  },
}

export default function Dashboard() {
  const [userRole, setUserRole] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "exporter"
    const isAuth = localStorage.getItem("isAuthenticated")
    const token = localStorage.getItem("token")

    console.log('🏠 Dashboard - userRole from localStorage:', role)
    console.log('🏠 Dashboard - isAuthenticated from localStorage:', isAuth)
    console.log('🏠 Dashboard - token exists:', !!token)

    if (!isAuth) {
      console.log('❌ User not authenticated, redirecting to home')
      router.push("/")
      return
    }

    if (!role) {
      console.log('⚠️  No role found, defaulting to exporter')
      localStorage.setItem("userRole", "exporter")
      setUserRole("exporter")
    } else {
      console.log('✅ Setting user role to:', role)
      setUserRole(role)
    }

    console.log('🎯 Dashboard will render for role:', role)
  }, [router])

  const renderExporterDashboard = () => {
    const data = DEMO_DATA.exporter
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Validation</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.pendingValidation}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.complianceScore}%</div>
              <Progress value={data.stats.complianceScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors Reduced</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.errorsReduced}%</div>
              <p className="text-xs text-muted-foreground">Since using AI</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/document-upload">
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </Link>
              <Link href="/hs-code-copilot">
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Search className="mr-2 h-4 w-4" />
                  HS Code Copilot
                </Button>
              </Link>
              <Link href="/invoice-validator">
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Shield className="mr-2 h-4 w-4" />
                  Invoice Validator
                </Button>
              </Link>
              <Link href="/compliance-reports">
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Reports
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
              <CardDescription>Latest document processing status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">{doc.date}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          doc.status === "validated"
                            ? "default"
                            : doc.status === "pending"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {doc.status}
                      </Badge>
                      {doc.errors > 0 && <Badge variant="outline">{doc.errors} errors</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const renderCADashboard = () => {
    const data = DEMO_DATA.ca
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients Managed</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.clientsManaged}</div>
              <p className="text-xs text-muted-foreground">Active clients</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Audits Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.auditsCompleted}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.complianceIssues}</div>
              <p className="text-xs text-muted-foreground">Pending resolution</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.avgResolutionTime} days</div>
              <p className="text-xs text-muted-foreground">-15% improvement</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Client Compliance Overview</CardTitle>
            <CardDescription>Monitor client compliance scores and issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.clients.map((client, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{client.name}</h4>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Compliance:</span>
                        <Badge variant="default">{client.compliance}%</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Issues:</span>
                        <Badge variant={client.issues > 2 ? "destructive" : "secondary"}>{client.issues}</Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderForwarderDashboard = () => {
    const data = DEMO_DATA.forwarder
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shipments Processed</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.shipmentsProcessed}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents Validated</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.documentsValidated}</div>
              <p className="text-xs text-muted-foreground">Total processed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.avgProcessingTime} hrs</div>
              <p className="text-xs text-muted-foreground">Per shipment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.errorRate}%</div>
              <p className="text-xs text-muted-foreground">Below target</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Shipments</CardTitle>
            <CardDescription>Track shipment processing status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.shipments.map((shipment) => (
                <div key={shipment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">Shipment {shipment.id}</p>
                    <p className="text-sm text-muted-foreground">{shipment.exporter}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        shipment.status === "cleared"
                          ? "default"
                          : shipment.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {shipment.status}
                    </Badge>
                    <Badge variant="outline">{shipment.docs} docs</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderAdminDashboard = () => {
    const data = DEMO_DATA.admin
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.systemUptime}%</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Calls</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.apiCalls.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Monitor system components and services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.systemHealth.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{service.service}</h4>
                    <p className="text-sm text-muted-foreground">Uptime: {service.uptime}%</p>
                  </div>
                  <Badge
                    variant={
                      service.status === "healthy"
                        ? "default"
                        : service.status === "warning"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {service.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getDashboardTitle = () => {
    switch (userRole) {
      case "exporter":
        return "Exporter Dashboard"
      case "ca":
        return "CA/Consultant Dashboard"
      case "forwarder":
        return "Freight Forwarder Dashboard"
      case "admin":
        return "Admin Dashboard"
      default:
        return "Dashboard"
    }
  }

  const renderDashboard = () => {
    switch (userRole) {
      case "exporter":
        return renderExporterDashboard()
      case "ca":
        return renderCADashboard()
      case "forwarder":
        return renderForwarderDashboard()
      case "admin":
        return renderAdminDashboard()
      default:
        return renderExporterDashboard()
    }
  }

  if (!userRole) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-xl font-semibold">{getDashboardTitle()}</h1>
        </div>
      </div>

      <div className="p-6">{renderDashboard()}</div>
    </div>
  )
}
