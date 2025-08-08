"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Download, Eye, Clock, User, FileText, Edit, Trash2, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AuditEntry {
  id: string
  timestamp: string
  user: string
  action: string
  document: string
  details: string
  status: "success" | "warning" | "error"
  ipAddress: string
  userAgent: string
}

const DEMO_AUDIT_DATA: AuditEntry[] = [
  {
    id: "1",
    timestamp: "2024-01-15 14:30:25",
    user: "john.doe@company.com",
    action: "Document Upload",
    document: "Invoice_INV001.pdf",
    details: "Commercial invoice uploaded and processed successfully",
    status: "success",
    ipAddress: "192.168.1.100",
    userAgent: "Chrome/120.0.0.0",
  },
  {
    id: "2",
    timestamp: "2024-01-15 14:28:15",
    user: "jane.smith@company.com",
    action: "HS Code Update",
    document: "Invoice_INV001.pdf",
    details: "HS Code changed from 8471.30.00 to 8471.41.00",
    status: "warning",
    ipAddress: "192.168.1.101",
    userAgent: "Firefox/121.0.0.0",
  },
  {
    id: "3",
    timestamp: "2024-01-15 14:25:10",
    user: "system@platform.com",
    action: "Validation Error",
    document: "BOE_BOE002.pdf",
    details: "Missing consignee postal code detected",
    status: "error",
    ipAddress: "127.0.0.1",
    userAgent: "System/1.0",
  },
  {
    id: "4",
    timestamp: "2024-01-15 14:20:45",
    user: "admin@company.com",
    action: "User Access",
    document: "N/A",
    details: "User login from new device",
    status: "success",
    ipAddress: "192.168.1.102",
    userAgent: "Safari/17.0",
  },
  {
    id: "5",
    timestamp: "2024-01-15 14:15:30",
    user: "john.doe@company.com",
    action: "Document Download",
    document: "Corrected_Invoice_INV001.pdf",
    details: "Downloaded corrected invoice with annotations",
    status: "success",
    ipAddress: "192.168.1.100",
    userAgent: "Chrome/120.0.0.0",
  },
]

export default function AuditTrail() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState("all")
  const [selectedAction, setSelectedAction] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const { toast } = useToast()

  const exportAuditLog = () => {
    try {
      // Create audit log data with current filters
      const auditLogData = {
        exportedAt: new Date().toISOString(),
        filters: {
          searchTerm,
          selectedUser,
          selectedAction,
          selectedStatus,
        },
        totalEntries: filteredData.length,
        auditEntries: filteredData,
        summary: {
          totalActivities: DEMO_AUDIT_DATA.length,
          successfulActions: DEMO_AUDIT_DATA.filter((e) => e.status === "success").length,
          warnings: DEMO_AUDIT_DATA.filter((e) => e.status === "warning").length,
          errors: DEMO_AUDIT_DATA.filter((e) => e.status === "error").length,
        }
      }

      // Convert to JSON string
      const jsonData = JSON.stringify(auditLogData, null, 2)
      
      // Create blob and download
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      console.log('Audit log exported successfully')
      toast({
        title: "Audit Log Exported",
        description: `Audit log with ${filteredData.length} entries has been downloaded successfully.`,
        variant: "default",
      })
    } catch (error) {
      console.error('Failed to export audit log:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export the audit log. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredData = DEMO_AUDIT_DATA.filter((entry) => {
    const matchesSearch =
      entry.document.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.user.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesUser = selectedUser === "all" || entry.user === selectedUser
    const matchesAction = selectedAction === "all" || entry.action === selectedAction
    const matchesStatus = selectedStatus === "all" || entry.status === selectedStatus

    return matchesSearch && matchesUser && matchesAction && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <div className="w-2 h-2 bg-green-500 rounded-full" />
      case "warning":
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />
      case "error":
        return <div className="w-2 h-2 bg-red-500 rounded-full" />
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "default"
      case "warning":
        return "secondary"
      case "error":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "Document Upload":
        return <Plus className="h-4 w-4" />
      case "Document Download":
        return <Download className="h-4 w-4" />
      case "HS Code Update":
        return <Edit className="h-4 w-4" />
      case "Validation Error":
        return <Trash2 className="h-4 w-4" />
      case "User Access":
        return <User className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
            <p className="text-gray-600 mt-2">Complete history of all system activities and document changes</p>
          </div>
          <Button onClick={exportAuditLog}>
            <Download className="h-4 w-4 mr-2" />
            Export Audit Log
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Search documents, users, or details..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">User</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="john.doe@company.com">John Doe</SelectItem>
                    <SelectItem value="jane.smith@company.com">Jane Smith</SelectItem>
                    <SelectItem value="admin@company.com">Admin</SelectItem>
                    <SelectItem value="system@platform.com">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Action</label>
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="Document Upload">Document Upload</SelectItem>
                    <SelectItem value="Document Download">Document Download</SelectItem>
                    <SelectItem value="HS Code Update">HS Code Update</SelectItem>
                    <SelectItem value="Validation Error">Validation Error</SelectItem>
                    <SelectItem value="User Access">User Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full bg-transparent"
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedUser("all")
                    setSelectedAction("all")
                    setSelectedStatus("all")
                    toast({
                      title: "Filters Cleared",
                      description: "All filters have been reset.",
                      variant: "default",
                    })
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="timeline" className="space-y-6">
          <TabsList>
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>Chronological view of all system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredData.map((entry) => (
                    <div key={entry.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          {getActionIcon(entry.action)}
                        </div>
                        <div className="w-px h-8 bg-gray-200 mt-2" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium text-gray-900">{entry.action}</h4>
                            <Badge variant={getStatusColor(entry.status)}>{entry.status}</Badge>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>{entry.timestamp}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{entry.details}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{entry.user}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FileText className="h-3 w-3" />
                            <span>{entry.document}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>IP: {entry.ipAddress}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log Table</CardTitle>
                <CardDescription>Detailed tabular view of audit entries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-3 text-left">Timestamp</th>
                        <th className="border border-gray-300 p-3 text-left">User</th>
                        <th className="border border-gray-300 p-3 text-left">Action</th>
                        <th className="border border-gray-300 p-3 text-left">Document</th>
                        <th className="border border-gray-300 p-3 text-left">Status</th>
                        <th className="border border-gray-300 p-3 text-left">Details</th>
                        <th className="border border-gray-300 p-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-3 text-sm">{entry.timestamp}</td>
                          <td className="border border-gray-300 p-3 text-sm">{entry.user}</td>
                          <td className="border border-gray-300 p-3 text-sm">
                            <div className="flex items-center space-x-2">
                              {getActionIcon(entry.action)}
                              <span>{entry.action}</span>
                            </div>
                          </td>
                          <td className="border border-gray-300 p-3 text-sm">{entry.document}</td>
                          <td className="border border-gray-300 p-3">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(entry.status)}
                              <Badge variant={getStatusColor(entry.status)} className="text-xs">
                                {entry.status}
                              </Badge>
                            </div>
                          </td>
                          <td className="border border-gray-300 p-3 text-sm max-w-xs truncate">{entry.details}</td>
                          <td className="border border-gray-300 p-3">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{DEMO_AUDIT_DATA.length}</div>
                  <p className="text-xs text-gray-500">Last 24 hours</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Successful Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {DEMO_AUDIT_DATA.filter((e) => e.status === "success").length}
                  </div>
                  <p className="text-xs text-gray-500">80% success rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Warnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {DEMO_AUDIT_DATA.filter((e) => e.status === "warning").length}
                  </div>
                  <p className="text-xs text-gray-500">Require attention</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {DEMO_AUDIT_DATA.filter((e) => e.status === "error").length}
                  </div>
                  <p className="text-xs text-gray-500">Need resolution</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="font-medium">Document Operations</span>
                    </div>
                    <span className="text-sm text-gray-600">3 activities</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                      <span className="font-medium">Data Updates</span>
                    </div>
                    <span className="text-sm text-gray-600">1 activity</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="font-medium">System Errors</span>
                    </div>
                    <span className="text-sm text-gray-600">1 activity</span>
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
