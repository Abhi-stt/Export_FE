"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Download, FileText, TrendingUp, CheckCircle, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const DEMO_COMPLIANCE_DATA = {
  overview: {
    totalDocuments: 1456,
    complianceScore: 94,
    errorsReduced: 67,
    avgProcessingTime: 28,
  },
  monthlyData: [
    { month: "Jan", documents: 120, errors: 15, compliance: 87 },
    { month: "Feb", documents: 135, errors: 12, compliance: 91 },
    { month: "Mar", documents: 142, errors: 8, compliance: 94 },
    { month: "Apr", documents: 158, errors: 6, compliance: 96 },
    { month: "May", documents: 167, errors: 9, compliance: 95 },
    { month: "Jun", documents: 189, errors: 7, compliance: 96 },
  ],
  errorTypes: [
    { name: "Missing Information", value: 35, color: "#ef4444" },
    { name: "Invalid HS Codes", value: 28, color: "#f97316" },
    { name: "Date Inconsistencies", value: 20, color: "#eab308" },
    { name: "Port Code Errors", value: 17, color: "#3b82f6" },
  ],
  topIssues: [
    { issue: "Missing consignee postal code", frequency: 45, severity: "high" },
    { issue: "Invalid HS code format", frequency: 38, severity: "high" },
    { issue: "Incorrect port codes", frequency: 32, severity: "medium" },
    { issue: "Date format inconsistency", frequency: 28, severity: "medium" },
    { issue: "Missing country of origin", frequency: 24, severity: "low" },
  ],
}

export default function ComplianceReports() {
  const [selectedPeriod, setSelectedPeriod] = useState("last-6-months")
  const [selectedReport, setSelectedReport] = useState("overview")
  const { toast } = useToast()

  const exportComplianceReport = () => {
    try {
      // Create report data based on selected period
      const reportData = {
        period: selectedPeriod,
        generatedAt: new Date().toISOString(),
        overview: DEMO_COMPLIANCE_DATA.overview,
        monthlyData: DEMO_COMPLIANCE_DATA.monthlyData,
        errorTypes: DEMO_COMPLIANCE_DATA.errorTypes,
        topIssues: DEMO_COMPLIANCE_DATA.topIssues,
        summary: {
          totalDocuments: DEMO_COMPLIANCE_DATA.overview.totalDocuments,
          complianceScore: DEMO_COMPLIANCE_DATA.overview.complianceScore,
          errorsReduced: DEMO_COMPLIANCE_DATA.overview.errorsReduced,
          avgProcessingTime: DEMO_COMPLIANCE_DATA.overview.avgProcessingTime,
        }
      }

      // Convert to JSON string
      const jsonData = JSON.stringify(reportData, null, 2)
      
      // Create blob and download
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `compliance-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      console.log('Compliance report exported successfully')
      toast({
        title: "Report Exported",
        description: `Compliance report for ${selectedPeriod} has been downloaded successfully.`,
        variant: "default",
      })
    } catch (error) {
      console.error('Failed to export compliance report:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export the compliance report. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Compliance Reports</h1>
            <p className="text-gray-600 mt-2">Monitor and analyze your export compliance performance</p>
          </div>
          <div className="flex space-x-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                <SelectItem value="last-year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportComplianceReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{DEMO_COMPLIANCE_DATA.overview.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">+12% from last period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{DEMO_COMPLIANCE_DATA.overview.complianceScore}%</div>
              <Progress value={DEMO_COMPLIANCE_DATA.overview.complianceScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors Reduced</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{DEMO_COMPLIANCE_DATA.overview.errorsReduced}%</div>
              <p className="text-xs text-muted-foreground">Since using AI</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{DEMO_COMPLIANCE_DATA.overview.avgProcessingTime}s</div>
              <p className="text-xs text-muted-foreground">Per document</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList>
            <TabsTrigger value="trends">Compliance Trends</TabsTrigger>
            <TabsTrigger value="errors">Error Analysis</TabsTrigger>
            <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Compliance Trend</CardTitle>
                  <CardDescription>Compliance score over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={DEMO_COMPLIANCE_DATA.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="compliance" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Document Volume & Errors</CardTitle>
                  <CardDescription>Monthly document processing and error rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={DEMO_COMPLIANCE_DATA.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="documents" fill="#3b82f6" />
                      <Bar dataKey="errors" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="errors" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Error Distribution</CardTitle>
                  <CardDescription>Types of errors by frequency</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={DEMO_COMPLIANCE_DATA.errorTypes}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {DEMO_COMPLIANCE_DATA.errorTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Issues</CardTitle>
                  <CardDescription>Most frequent compliance issues</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {DEMO_COMPLIANCE_DATA.topIssues.map((issue, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{issue.issue}</p>
                          <p className="text-xs text-gray-500">Frequency: {issue.frequency} occurrences</p>
                        </div>
                        <Badge
                          variant={
                            issue.severity === "high"
                              ? "destructive"
                              : issue.severity === "medium"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {issue.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Processing Speed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">28.5s</div>
                  <p className="text-sm text-gray-600 mb-4">Average processing time</p>
                  <Progress value={85} />
                  <p className="text-xs text-gray-500 mt-2">15% faster than industry average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Accuracy Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">96.2%</div>
                  <p className="text-sm text-gray-600 mb-4">AI validation accuracy</p>
                  <Progress value={96} />
                  <p className="text-xs text-gray-500 mt-2">Above target of 95%</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">4.8/5</div>
                  <p className="text-sm text-gray-600 mb-4">Average user rating</p>
                  <Progress value={96} />
                  <p className="text-xs text-gray-500 mt-2">Based on 234 reviews</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">↑ 23%</div>
                    <p className="text-sm text-gray-600">Processing Speed Improvement</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">↑ 67%</div>
                    <p className="text-sm text-gray-600">Error Reduction</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">↑ 45%</div>
                    <p className="text-sm text-gray-600">User Productivity</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Custom Report</CardTitle>
                <CardDescription>Create detailed compliance reports for specific periods and criteria</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Report Type</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compliance">Compliance Summary</SelectItem>
                        <SelectItem value="errors">Error Analysis</SelectItem>
                        <SelectItem value="performance">Performance Report</SelectItem>
                        <SelectItem value="audit">Audit Trail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Date Range</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last-week">Last Week</SelectItem>
                        <SelectItem value="last-month">Last Month</SelectItem>
                        <SelectItem value="last-quarter">Last Quarter</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Format</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full" onClick={exportComplianceReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Monthly Compliance Report - June 2024</p>
                      <p className="text-sm text-gray-500">Generated on June 30, 2024</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => exportComplianceReport()}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Error Analysis Report - Q2 2024</p>
                      <p className="text-sm text-gray-500">Generated on June 28, 2024</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => exportComplianceReport()}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Performance Metrics - May 2024</p>
                      <p className="text-sm text-gray-500">Generated on May 31, 2024</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => exportComplianceReport()}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
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
