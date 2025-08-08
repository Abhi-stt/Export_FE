"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts"
import { Activity, Server, AlertTriangle, CheckCircle, Clock, Cpu, HardDrive, Wifi, RefreshCw } from "lucide-react"

interface SystemMetric {
  timestamp: string
  cpu: number
  memory: number
  disk: number
  network: number
  responseTime: number
}

interface ServiceStatus {
  name: string
  status: "healthy" | "warning" | "critical" | "maintenance"
  uptime: number
  responseTime: number
  lastCheck: string
  description: string
}

const DEMO_METRICS: SystemMetric[] = [
  { timestamp: "00:00", cpu: 45, memory: 62, disk: 78, network: 23, responseTime: 120 },
  { timestamp: "04:00", cpu: 52, memory: 58, disk: 78, network: 34, responseTime: 135 },
  { timestamp: "08:00", cpu: 78, memory: 71, disk: 79, network: 67, responseTime: 180 },
  { timestamp: "12:00", cpu: 85, memory: 82, disk: 80, network: 89, responseTime: 220 },
  { timestamp: "16:00", cpu: 72, memory: 75, disk: 81, network: 76, responseTime: 165 },
  { timestamp: "20:00", cpu: 58, memory: 68, disk: 82, network: 45, responseTime: 145 },
]

const DEMO_SERVICES: ServiceStatus[] = [
  {
    name: "AI Processing Engine",
    status: "healthy",
    uptime: 99.9,
    responseTime: 145,
    lastCheck: "2024-01-15 14:30",
    description: "Document processing and HS code suggestions",
  },
  {
    name: "Document Parser",
    status: "healthy",
    uptime: 99.7,
    responseTime: 89,
    lastCheck: "2024-01-15 14:30",
    description: "OCR and document extraction service",
  },
  {
    name: "Database Cluster",
    status: "warning",
    uptime: 98.5,
    responseTime: 234,
    lastCheck: "2024-01-15 14:29",
    description: "Primary database for user data and documents",
  },
  {
    name: "Authentication Service",
    status: "healthy",
    uptime: 99.8,
    responseTime: 67,
    lastCheck: "2024-01-15 14:30",
    description: "User authentication and authorization",
  },
  {
    name: "File Storage",
    status: "healthy",
    uptime: 99.6,
    responseTime: 123,
    lastCheck: "2024-01-15 14:30",
    description: "Document and file storage system",
  },
  {
    name: "API Gateway",
    status: "critical",
    uptime: 95.2,
    responseTime: 456,
    lastCheck: "2024-01-15 14:28",
    description: "External API integrations and routing",
  },
]

export default function SystemHealth() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h")
  const [autoRefresh, setAutoRefresh] = useState(true)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "default"
      case "warning":
        return "secondary"
      case "critical":
        return "destructive"
      case "maintenance":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "maintenance":
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const healthyServices = DEMO_SERVICES.filter((s) => s.status === "healthy").length
  const warningServices = DEMO_SERVICES.filter((s) => s.status === "warning").length
  const criticalServices = DEMO_SERVICES.filter((s) => s.status === "critical").length
  const avgUptime = DEMO_SERVICES.reduce((sum, s) => sum + s.uptime, 0) / DEMO_SERVICES.length

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
            <p className="text-gray-600 mt-2">Monitor platform performance and service status</p>
          </div>
          <div className="flex space-x-3">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Admin-specific System Health Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgUptime.toFixed(1)}%</div>
              <Progress value={avgUptime} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Healthy Services</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{healthyServices}</div>
              <p className="text-xs text-muted-foreground">of {DEMO_SERVICES.length} services</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{warningServices}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{criticalServices}</div>
              <p className="text-xs text-muted-foreground">Immediate action required</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">System Overview</TabsTrigger>
            <TabsTrigger value="services">Service Status</TabsTrigger>
            <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts & Incidents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Resource Usage</CardTitle>
                  <CardDescription>Real-time system resource monitoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={DEMO_METRICS}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="cpu"
                        stackId="1"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="memory"
                        stackId="1"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="disk"
                        stackId="1"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Response Time Trends</CardTitle>
                  <CardDescription>API response time over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={DEMO_METRICS}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="responseTime" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                  <Cpu className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">72%</div>
                  <Progress value={72} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">8 cores active</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  <Server className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">68%</div>
                  <Progress value={68} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">27.2GB / 40GB</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                  <HardDrive className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">82%</div>
                  <Progress value={82} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">820GB / 1TB</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Network I/O</CardTitle>
                  <Wifi className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">45%</div>
                  <Progress value={45} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">450 Mbps</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Status Monitor</CardTitle>
                <CardDescription>Real-time status of all platform services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DEMO_SERVICES.map((service, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            {getStatusIcon(service.status)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{service.name}</h4>
                            <p className="text-sm text-gray-600">{service.description}</p>
                            <p className="text-xs text-gray-500">Last checked: {service.lastCheck}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-lg font-semibold">{service.uptime}%</div>
                            <div className="text-xs text-gray-500">Uptime</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold">{service.responseTime}ms</div>
                            <div className="text-xs text-gray-500">Response</div>
                          </div>
                          <Badge variant={getStatusColor(service.status)}>{service.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={DEMO_METRICS}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="responseTime" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Network Traffic</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={DEMO_METRICS}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="network" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">99.8%</div>
                    <p className="text-sm text-gray-600">API Availability</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">165ms</div>
                    <p className="text-sm text-gray-600">Avg Response Time</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">1.2M</div>
                    <p className="text-sm text-gray-600">Requests/Day</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
                <CardDescription>Current system alerts and incidents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium">API Gateway High Response Time</p>
                        <p className="text-sm text-gray-600">Response time exceeded 400ms threshold</p>
                        <p className="text-xs text-gray-500">Started: 2024-01-15 14:15</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant="destructive">Critical</Badge>
                      <Button variant="outline" size="sm">
                        Investigate
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium">Database Connection Pool Warning</p>
                        <p className="text-sm text-gray-600">Connection pool usage at 85%</p>
                        <p className="text-xs text-gray-500">Started: 2024-01-15 13:45</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant="secondary">Warning</Badge>
                      <Button variant="outline" size="sm">
                        Monitor
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Disk Space Alert Resolved</p>
                        <p className="text-sm text-gray-600">Disk cleanup completed successfully</p>
                        <p className="text-xs text-gray-500">Resolved: 2024-01-15 12:30</p>
                      </div>
                    </div>
                    <Badge variant="default">Resolved</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Incident History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>System Maintenance - Database Upgrade</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Scheduled</Badge>
                      <span className="text-gray-500">2024-01-14</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>API Rate Limiting Issue</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">Resolved</Badge>
                      <span className="text-gray-500">2024-01-13</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Document Processing Slowdown</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">Resolved</Badge>
                      <span className="text-gray-500">2024-01-12</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
