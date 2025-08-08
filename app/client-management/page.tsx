"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Plus,
  Eye,
  Edit,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FileText,
  Phone,
  Mail,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Client {
  _id?: string
  id?: string
  name: string
  email: string
  phone: string
  company: string
  complianceScore: number
  documentsProcessed: number
  lastActivity: string
  status: "active" | "inactive" | "pending"
  issues: number
  industry: string
  monthlyFee: number
  contractEnd: string
  type?: string
  notes?: string
}

const DEMO_CLIENTS: Client[] = [
  {
    id: "1",
    name: "Rajesh Kumar",
    email: "rajesh@abcexports.com",
    phone: "+91 98765 43210",
    company: "ABC Exports Ltd",
    complianceScore: 96,
    documentsProcessed: 145,
    lastActivity: "2024-01-15",
    status: "active",
    issues: 1,
    industry: "Textiles",
    monthlyFee: 25000,
    contractEnd: "2024-12-31",
  },
  {
    id: "2",
    name: "Priya Sharma",
    email: "priya@xyztrading.com",
    phone: "+91 87654 32109",
    company: "XYZ Trading Co",
    complianceScore: 89,
    documentsProcessed: 89,
    lastActivity: "2024-01-14",
    status: "active",
    issues: 3,
    industry: "Electronics",
    monthlyFee: 35000,
    contractEnd: "2024-11-30",
  },
  {
    id: "3",
    name: "Amit Patel",
    email: "amit@globaltraders.com",
    phone: "+91 76543 21098",
    company: "Global Traders",
    complianceScore: 92,
    documentsProcessed: 67,
    lastActivity: "2024-01-13",
    status: "active",
    issues: 2,
    industry: "Machinery",
    monthlyFee: 30000,
    contractEnd: "2025-03-31",
  },
  {
    id: "4",
    name: "Sunita Gupta",
    email: "sunita@techexports.com",
    phone: "+91 65432 10987",
    company: "Tech Exports Pvt Ltd",
    complianceScore: 78,
    documentsProcessed: 34,
    lastActivity: "2024-01-10",
    status: "inactive",
    issues: 5,
    industry: "Technology",
    monthlyFee: 40000,
    contractEnd: "2024-08-31",
  },
]

export default function ClientManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedIndustry, setSelectedIndustry] = useState("all")
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [addingClient, setAddingClient] = useState(false)
  const { toast } = useToast()

  // Form state for new client
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    type: "exporter" as "exporter" | "importer" | "manufacturer",
    status: "active" as "active" | "inactive" | "pending",
    industry: "",
    monthlyFee: 0,
    contractEnd: "",
    notes: ""
  })

  // Fetch clients from backend on component mount
  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.log('No token found, using demo data')
        setClients(DEMO_CLIENTS)
        setLoading(false)
        return
      }

      const response = await fetch('http://localhost:5000/api/clients', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data && data.data.clients) {
          setClients(data.data.clients)
        } else {
          console.log('No clients found in response, using demo data')
          setClients(DEMO_CLIENTS)
        }
      } else {
        console.log('Failed to fetch clients, using demo data')
        setClients(DEMO_CLIENTS)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      setClients(DEMO_CLIENTS)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || client.status === selectedStatus
    const matchesIndustry = selectedIndustry === "all" || client.industry === selectedIndustry

    return matchesSearch && matchesStatus && matchesIndustry
  })

  const handleAddClient = async () => {
    try {
      setAddingClient(true)
      
      // Validate required fields
      if (!newClient.name || !newClient.email || !newClient.company) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (Name, Email, Company)",
          variant: "destructive",
        })
        return
      }

      const token = localStorage.getItem('token')
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login to add clients",
          variant: "destructive",
        })
        return
      }

      const clientData = {
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        company: newClient.company,
        type: newClient.type,
        status: newClient.status,
        notes: newClient.notes,
        industry: newClient.industry,
        monthlyFee: newClient.monthlyFee,
        contractEnd: newClient.contractEnd
      }

      const response = await fetch('http://localhost:5000/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(clientData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data && data.data.client) {
          // Add the new client to the list
          const newClientWithId = {
            ...data.data.client,
            id: data.data.client._id || Math.random().toString(36).substr(2, 9),
            complianceScore: 85, // Default score
            documentsProcessed: 0,
            lastActivity: new Date().toISOString().split('T')[0],
            issues: 0
          }
          setClients(prev => [newClientWithId, ...prev])
          
          toast({
            title: "Success",
            description: "Client added successfully to database",
            variant: "default",
          })
        } else {
          throw new Error('Failed to add client to database')
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to add client')
      }
      
      // Reset form
      setNewClient({
        name: "",
        email: "",
        phone: "",
        company: "",
        type: "exporter",
        status: "active",
        industry: "",
        monthlyFee: 0,
        contractEnd: "",
        notes: ""
      })
      
      setIsAddDialogOpen(false)
      
    } catch (error) {
      console.error('Error adding client:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add client. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAddingClient(false)
    }
  }

  const resetForm = () => {
    setNewClient({
      name: "",
      email: "",
      phone: "",
      company: "",
      type: "exporter",
      status: "active",
      industry: "",
      monthlyFee: 0,
      contractEnd: "",
      notes: ""
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const totalClients = clients.length
  const activeClients = clients.filter(client => client.status === "active").length
  const inactiveClients = clients.filter(client => client.status === "inactive").length
  const pendingClients = clients.filter(client => client.status === "pending").length
  const avgComplianceScore = clients.length > 0 
    ? Math.round(clients.reduce((sum, client) => sum + client.complianceScore, 0) / clients.length)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading clients...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600 mt-2">Manage client relationships and compliance data</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Client
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeClients}</div>
            <p className="text-xs text-muted-foreground">
              {totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Compliance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{avgComplianceScore}%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {clients.reduce((sum, client) => sum + client.issues, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {inactiveClients + pendingClients} clients need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            <SelectItem value="Textiles">Textiles</SelectItem>
            <SelectItem value="Electronics">Electronics</SelectItem>
            <SelectItem value="Machinery">Machinery</SelectItem>
            <SelectItem value="Technology">Technology</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>
            {filteredClients.length} of {totalClients} clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredClients.map((client) => (
              <div key={client._id || client.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold">{client.name}</h3>
                    <p className="text-sm text-gray-600">{client.company}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{client.email}</span>
                      <Phone className="h-3 w-3 text-gray-400 ml-2" />
                      <span className="text-xs text-gray-500">{client.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(client.status)}>
                        {client.status}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {client.industry}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1">
                        <FileText className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {client.documentsProcessed} docs
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-gray-500">
                          {client.complianceScore}% compliance
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Client Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Create a new client account with company details and compliance information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  value={newClient.company}
                  onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Client Type</Label>
                <Select value={newClient.type} onValueChange={(value) => setNewClient({ ...newClient, type: value as any })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exporter">Exporter</SelectItem>
                    <SelectItem value="importer">Importer</SelectItem>
                    <SelectItem value="manufacturer">Manufacturer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={newClient.status} onValueChange={(value) => setNewClient({ ...newClient, status: value as any })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={newClient.industry}
                  onChange={(e) => setNewClient({ ...newClient, industry: e.target.value })}
                  placeholder="Enter industry"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyFee">Monthly Fee</Label>
                <Input
                  id="monthlyFee"
                  type="number"
                  value={newClient.monthlyFee}
                  onChange={(e) => setNewClient({ ...newClient, monthlyFee: Number(e.target.value) })}
                  placeholder="Enter monthly fee"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractEnd">Contract End Date</Label>
              <Input
                id="contractEnd"
                type="date"
                value={newClient.contractEnd}
                onChange={(e) => setNewClient({ ...newClient, contractEnd: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newClient.notes}
                onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                placeholder="Enter any additional notes"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              resetForm()
              setIsAddDialogOpen(false)
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddClient} disabled={addingClient}>
              {addingClient ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
