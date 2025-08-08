"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Download, Eye, Calendar, AlertTriangle, CheckCircle, Plus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AuditReport {
  id: string
  title: string
  client: string
  date: string
  status: "completed" | "pending" | "in_progress"
  type: "compliance" | "financial" | "operational"
  findings: number
  recommendations: number
}

const DEMO_REPORTS: AuditReport[] = [
  {
    id: "AR001",
    title: "Q4 2023 Compliance Audit",
    client: "ABC Exports Ltd",
    date: "2024-01-15",
    status: "completed",
    type: "compliance",
    findings: 3,
    recommendations: 5,
  },
  {
    id: "AR002",
    title: "Financial Year End Review",
    client: "XYZ Trading Co",
    date: "2024-01-10",
    status: "in_progress",
    type: "financial",
    findings: 2,
    recommendations: 4,
  },
  {
    id: "AR003",
    title: "Operational Efficiency Audit",
    client: "Global Traders",
    date: "2024-01-05",
    status: "pending",
    type: "operational",
    findings: 1,
    recommendations: 3,
  },
]

export default function AuditReports() {
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [reports, setReports] = useState<AuditReport[]>(DEMO_REPORTS)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [creatingReport, setCreatingReport] = useState(false)
  const { toast } = useToast()

  // Form state for new audit report
  const [newReport, setNewReport] = useState({
    title: "",
    client: "",
    type: "compliance" as "compliance" | "financial" | "operational",
    startDate: "",
    endDate: "",
    scope: "",
    objectives: "",
    methodology: ""
  })

  const filteredReports = reports.filter((report) => {
    const statusMatch = selectedStatus === "all" || report.status === selectedStatus
    const typeMatch = selectedType === "all" || report.type === selectedType
    return statusMatch && typeMatch
  })

  const handleCreateReport = async () => {
    try {
      setCreatingReport(true)
      
      // Validate required fields
      if (!newReport.title || !newReport.client) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (Title, Client)",
          variant: "destructive",
        })
        return
      }

      // Create new audit report
      const newAuditReport: AuditReport = {
        id: `AR${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        title: newReport.title,
        client: newReport.client,
        date: new Date().toISOString().split('T')[0],
        status: "pending" as "completed" | "pending" | "in_progress",
        type: newReport.type,
        findings: 0,
        recommendations: 0,
      }

      setReports(prev => [newAuditReport, ...prev])
      
      // Reset form
      setNewReport({
        title: "",
        client: "",
        type: "compliance",
        startDate: "",
        endDate: "",
        scope: "",
        objectives: "",
        methodology: ""
      })
      
      setIsCreateDialogOpen(false)
      
      toast({
        title: "Success",
        description: "Audit report created successfully",
        variant: "default",
      })

      // Try to call the API in the background (for demo purposes)
      try {
        const reportData = {
          title: newReport.title,
          client: newReport.client,
          type: newReport.type,
          startDate: newReport.startDate,
          endDate: newReport.endDate,
          scope: newReport.scope,
          objectives: newReport.objectives,
          methodology: newReport.methodology,
          status: "pending"
        }

        const response = await fetch('/api/audit-reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(reportData)
        })

        if (!response.ok) {
          console.log('API call failed (expected in demo mode):', response.status)
        }
      } catch (apiError) {
        console.log('API call error (expected in demo mode):', apiError)
      }
      
    } catch (error) {
      console.error('Error creating audit report:', error)
      toast({
        title: "Error",
        description: "Failed to create audit report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreatingReport(false)
    }
  }

  const resetForm = () => {
    setNewReport({
      title: "",
      client: "",
      type: "compliance",
      startDate: "",
      endDate: "",
      scope: "",
      objectives: "",
      methodology: ""
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
      case "pending":
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "compliance":
        return <Badge className="bg-blue-100 text-blue-800">Compliance</Badge>
      case "financial":
        return <Badge className="bg-purple-100 text-purple-800">Financial</Badge>
      case "operational":
        return <Badge className="bg-orange-100 text-orange-800">Operational</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Reports</h1>
        <p className="text-gray-600 mt-2">Manage and review audit reports for your clients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter((r) => r.status === "completed").length}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter((r) => r.status === "in_progress").length}
            </div>
            <p className="text-xs text-muted-foreground">Active audits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter((r) => r.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit Reports</CardTitle>
              <CardDescription>Review and manage audit reports for your clients</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Report
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Audit Report</DialogTitle>
                  <DialogDescription>
                    Fill in the details to create a new audit report for your client.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Report Title *</Label>
                      <Input
                        id="title"
                        value={newReport.title}
                        onChange={(e) => setNewReport(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter report title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client">Client Name *</Label>
                      <Input
                        id="client"
                        value={newReport.client}
                        onChange={(e) => setNewReport(prev => ({ ...prev, client: e.target.value }))}
                        placeholder="Enter client name"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Report Type</Label>
                      <Select value={newReport.type} onValueChange={(value) => setNewReport(prev => ({ ...prev, type: value as "compliance" | "financial" | "operational" }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compliance">Compliance</SelectItem>
                          <SelectItem value="financial">Financial</SelectItem>
                          <SelectItem value="operational">Operational</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={newReport.startDate}
                        onChange={(e) => setNewReport(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newReport.endDate}
                      onChange={(e) => setNewReport(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="scope">Audit Scope</Label>
                    <Textarea
                      id="scope"
                      value={newReport.scope}
                      onChange={(e) => setNewReport(prev => ({ ...prev, scope: e.target.value }))}
                      placeholder="Describe the scope of the audit"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="objectives">Audit Objectives</Label>
                    <Textarea
                      id="objectives"
                      value={newReport.objectives}
                      onChange={(e) => setNewReport(prev => ({ ...prev, objectives: e.target.value }))}
                      placeholder="List the main objectives of this audit"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="methodology">Audit Methodology</Label>
                    <Textarea
                      id="methodology"
                      value={newReport.methodology}
                      onChange={(e) => setNewReport(prev => ({ ...prev, methodology: e.target.value }))}
                      placeholder="Describe the methodology to be used"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    resetForm()
                    setIsCreateDialogOpen(false)
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateReport} disabled={creatingReport}>
                    {creatingReport ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Report
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-medium">{report.title}</h3>
                      <p className="text-sm text-gray-600">{report.client}</p>
                    </div>
                    <div className="flex space-x-2">
                      {getStatusBadge(report.status)}
                      {getTypeBadge(report.type)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>{report.date}</span>
                    <span>•</span>
                    <span>{report.findings} findings</span>
                    <span>•</span>
                    <span>{report.recommendations} recommendations</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 