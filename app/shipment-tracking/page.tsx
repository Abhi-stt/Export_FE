"use client"

import { useState } from "react"
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
import { Search, Truck, Ship, Plane, Package, MapPin, Clock, AlertTriangle, CheckCircle, Eye, Plus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Shipment {
  id: string
  trackingNumber: string
  exporter: string
  consignee: string
  origin: string
  destination: string
  mode: "sea" | "air" | "road"
  status: "in-transit" | "customs" | "delivered" | "delayed" | "pending"
  progress: number
  estimatedDelivery: string
  actualDelivery?: string
  documentsStatus: "complete" | "pending" | "issues"
  value: number
  weight: number
  containers: string[]
}

const DEMO_SHIPMENTS: Shipment[] = [
  {
    id: "1",
    trackingNumber: "SH2024001",
    exporter: "ABC Exports Ltd",
    consignee: "Global Imports LLC",
    origin: "Mumbai, India",
    destination: "New York, USA",
    mode: "sea",
    status: "in-transit",
    progress: 65,
    estimatedDelivery: "2024-02-15",
    documentsStatus: "complete",
    value: 125000,
    weight: 15000,
    containers: ["MSKU7834567", "TCLU5678901"],
  },
  {
    id: "2",
    trackingNumber: "SH2024002",
    exporter: "XYZ Trading Co",
    consignee: "European Distributors",
    origin: "Chennai, India",
    destination: "Hamburg, Germany",
    mode: "sea",
    status: "customs",
    progress: 85,
    estimatedDelivery: "2024-01-20",
    documentsStatus: "issues",
    value: 89000,
    weight: 12000,
    containers: ["COSCO8901234"],
  },
  {
    id: "3",
    trackingNumber: "SH2024003",
    exporter: "Tech Exports Pvt Ltd",
    consignee: "Silicon Valley Inc",
    origin: "Bangalore, India",
    destination: "San Francisco, USA",
    mode: "air",
    status: "delivered",
    progress: 100,
    estimatedDelivery: "2024-01-12",
    actualDelivery: "2024-01-12",
    documentsStatus: "complete",
    value: 250000,
    weight: 500,
    containers: ["AI7834567890"],
  },
  {
    id: "4",
    trackingNumber: "SH2024004",
    exporter: "Global Traders",
    consignee: "Middle East Trading",
    origin: "Delhi, India",
    destination: "Dubai, UAE",
    mode: "air",
    status: "delayed",
    progress: 45,
    estimatedDelivery: "2024-01-18",
    documentsStatus: "pending",
    value: 67000,
    weight: 800,
    containers: ["EK9876543210"],
  },
]

export default function ShipmentTracking() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedMode, setSelectedMode] = useState("all")
  const [shipments, setShipments] = useState<Shipment[]>(DEMO_SHIPMENTS)
  const [isAddShipmentDialogOpen, setIsAddShipmentDialogOpen] = useState(false)
  const [addingShipment, setAddingShipment] = useState(false)
  const { toast } = useToast()

  // Form state for new shipment
  const [newShipment, setNewShipment] = useState({
    trackingNumber: "",
    exporter: "",
    consignee: "",
    origin: "",
    destination: "",
    mode: "sea" as "sea" | "air" | "road",
    estimatedDelivery: "",
    value: "",
    weight: "",
    containers: "",
    notes: ""
  })

  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch =
      shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.exporter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.consignee.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || shipment.status === selectedStatus
    const matchesMode = selectedMode === "all" || shipment.mode === selectedMode

    return matchesSearch && matchesStatus && matchesMode
  })

  const handleAddNewShipment = async () => {
    try {
      setAddingShipment(true)
      
      // Validate required fields
      if (!newShipment.trackingNumber || !newShipment.exporter || !newShipment.consignee || !newShipment.origin || !newShipment.destination) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (Tracking Number, Exporter, Consignee, Origin, Destination)",
          variant: "destructive",
        })
        return
      }

      // Create new shipment
      const newShipmentData: Shipment = {
        id: Math.random().toString(36).substr(2, 9),
        trackingNumber: newShipment.trackingNumber,
        exporter: newShipment.exporter,
        consignee: newShipment.consignee,
        origin: newShipment.origin,
        destination: newShipment.destination,
        mode: newShipment.mode,
        status: "pending" as "in-transit" | "customs" | "delivered" | "delayed" | "pending",
        progress: 0,
        estimatedDelivery: newShipment.estimatedDelivery,
        documentsStatus: "pending" as "complete" | "pending" | "issues",
        value: parseFloat(newShipment.value) || 0,
        weight: parseFloat(newShipment.weight) || 0,
        containers: newShipment.containers ? newShipment.containers.split(',').map(c => c.trim()) : [],
      }

      setShipments(prev => [newShipmentData, ...prev])
      
      // Reset form
      setNewShipment({
        trackingNumber: "",
        exporter: "",
        consignee: "",
        origin: "",
        destination: "",
        mode: "sea",
        estimatedDelivery: "",
        value: "",
        weight: "",
        containers: "",
        notes: ""
      })
      
      setIsAddShipmentDialogOpen(false)
      
      toast({
        title: "Success",
        description: "New shipment added successfully",
        variant: "default",
      })

      // Try to call the API in the background (for demo purposes)
      try {
        const shipmentData = {
          trackingNumber: newShipment.trackingNumber,
          exporter: newShipment.exporter,
          consignee: newShipment.consignee,
          origin: newShipment.origin,
          destination: newShipment.destination,
          mode: newShipment.mode,
          estimatedDelivery: newShipment.estimatedDelivery,
          value: parseFloat(newShipment.value) || 0,
          weight: parseFloat(newShipment.weight) || 0,
          containers: newShipment.containers ? newShipment.containers.split(',').map(c => c.trim()) : [],
          notes: newShipment.notes,
          status: "pending"
        }

        const response = await fetch('/api/shipments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(shipmentData)
        })

        if (!response.ok) {
          console.log('API call failed (expected in demo mode):', response.status)
        }
      } catch (apiError) {
        console.log('API call error (expected in demo mode):', apiError)
      }
      
    } catch (error) {
      console.error('Error adding new shipment:', error)
      toast({
        title: "Error",
        description: "Failed to add new shipment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAddingShipment(false)
    }
  }

  const resetForm = () => {
    setNewShipment({
      trackingNumber: "",
      exporter: "",
      consignee: "",
      origin: "",
      destination: "",
      mode: "sea",
      estimatedDelivery: "",
      value: "",
      weight: "",
      containers: "",
      notes: ""
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "default"
      case "in-transit":
        return "secondary"
      case "customs":
        return "outline"
      case "delayed":
        return "destructive"
      case "pending":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "default"
      case "pending":
        return "secondary"
      case "issues":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "sea":
        return <Ship className="h-4 w-4" />
      case "air":
        return <Plane className="h-4 w-4" />
      case "road":
        return <Truck className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const totalShipments = shipments.length
  const inTransitShipments = shipments.filter((s) => s.status === "in-transit").length
  const deliveredShipments = shipments.filter((s) => s.status === "delivered").length
  const delayedShipments = shipments.filter((s) => s.status === "delayed").length

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shipment Tracking</h1>
            <p className="text-gray-600 mt-2">Track and manage all shipments in real-time</p>
          </div>
          <Button onClick={() => setIsAddShipmentDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Shipment
          </Button>
        </div>

        {/* Forwarder-specific Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalShipments}</div>
              <p className="text-xs text-muted-foreground">Active shipments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Truck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inTransitShipments}</div>
              <p className="text-xs text-muted-foreground">Currently moving</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliveredShipments}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delayed</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{delayedShipments}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tracking" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tracking">Live Tracking</TabsTrigger>
            <TabsTrigger value="documents">Document Status</TabsTrigger>
            <TabsTrigger value="analytics">Logistics Analytics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts & Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="tracking" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Shipment Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                      <Input
                        placeholder="Search shipments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="in-transit">In Transit</SelectItem>
                        <SelectItem value="customs">At Customs</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="delayed">Delayed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select value={selectedMode} onValueChange={setSelectedMode}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Modes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Modes</SelectItem>
                        <SelectItem value="sea">Sea Freight</SelectItem>
                        <SelectItem value="air">Air Freight</SelectItem>
                        <SelectItem value="road">Road Transport</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Button variant="outline" className="w-full bg-transparent">
                      Export Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipment List */}
            <Card>
              <CardHeader>
                <CardTitle>Active Shipments</CardTitle>
                <CardDescription>Real-time tracking of all shipments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredShipments.map((shipment) => (
                    <div key={shipment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            {getModeIcon(shipment.mode)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{shipment.trackingNumber}</h4>
                            <p className="text-sm text-gray-600">
                              {shipment.exporter} → {shipment.consignee}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                              <MapPin className="h-3 w-3" />
                              <span>
                                {shipment.origin} → {shipment.destination}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-lg font-semibold">${shipment.value.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">Value</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold">{shipment.weight}kg</div>
                            <div className="text-xs text-gray-500">Weight</div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge variant={getStatusColor(shipment.status)}>{shipment.status}</Badge>
                            <div className="text-xs text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              ETA: {shipment.estimatedDelivery}
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{shipment.progress}%</span>
                        </div>
                        <Progress value={shipment.progress} />
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-2">
                            {shipment.containers.map((container) => (
                              <Badge key={container} variant="outline" className="text-xs">
                                {container}
                              </Badge>
                            ))}
                          </div>
                          <Badge variant={getDocumentStatusColor(shipment.documentsStatus)}>
                            Docs: {shipment.documentsStatus}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Compliance Status</CardTitle>
                <CardDescription>Track document processing and compliance for all shipments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shipments.map((shipment) => (
                    <div key={shipment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{shipment.trackingNumber}</h4>
                          <p className="text-sm text-gray-600">{shipment.exporter}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge variant={getDocumentStatusColor(shipment.documentsStatus)}>
                            {shipment.documentsStatus}
                          </Badge>
                          <Button variant="outline" size="sm">
                            View Documents
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>On-Time Delivery Rate</span>
                      <span className="font-semibold">94%</span>
                    </div>
                    <Progress value={94} />
                    <div className="flex items-center justify-between">
                      <span>Average Transit Time</span>
                      <span className="font-semibold">18 days</span>
                    </div>
                    <Progress value={75} />
                    <div className="flex items-center justify-between">
                      <span>Customer Satisfaction</span>
                      <span className="font-semibold">4.8/5</span>
                    </div>
                    <Progress value={96} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mode Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Ship className="h-5 w-5 text-blue-500" />
                        <span>Sea Freight</span>
                      </div>
                      <span className="font-semibold">65%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Plane className="h-5 w-5 text-green-500" />
                        <span>Air Freight</span>
                      </div>
                      <span className="font-semibold">30%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Truck className="h-5 w-5 text-orange-500" />
                        <span>Road Transport</span>
                      </div>
                      <span className="font-semibold">5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
                <CardDescription>Important notifications and alerts for your shipments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium">Shipment Delayed - SH2024004</p>
                        <p className="text-sm text-gray-600">Flight delayed due to weather conditions</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Update Customer
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium">Document Issues - SH2024002</p>
                        <p className="text-sm text-gray-600">Missing customs declaration form</p>
                        <p className="text-xs text-gray-500">4 hours ago</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Resolve
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Delivery Confirmed - SH2024003</p>
                        <p className="text-sm text-gray-600">Package delivered successfully to consignee</p>
                        <p className="text-xs text-gray-500">6 hours ago</p>
                      </div>
                    </div>
                    <Badge variant="default">Completed</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isAddShipmentDialogOpen} onOpenChange={setIsAddShipmentDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Shipment</DialogTitle>
              <DialogDescription>
                Fill in the details to add a new shipment for tracking.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trackingNumber">Tracking Number *</Label>
                  <Input
                    id="trackingNumber"
                    value={newShipment.trackingNumber}
                    onChange={(e) => setNewShipment(prev => ({ ...prev, trackingNumber: e.target.value }))}
                    placeholder="Enter tracking number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mode">Transport Mode</Label>
                  <Select value={newShipment.mode} onValueChange={(value) => setNewShipment(prev => ({ ...prev, mode: value as "sea" | "air" | "road" }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transport mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sea">Sea Freight</SelectItem>
                      <SelectItem value="air">Air Freight</SelectItem>
                      <SelectItem value="road">Road Transport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exporter">Exporter *</Label>
                  <Input
                    id="exporter"
                    value={newShipment.exporter}
                    onChange={(e) => setNewShipment(prev => ({ ...prev, exporter: e.target.value }))}
                    placeholder="Enter exporter name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consignee">Consignee *</Label>
                  <Input
                    id="consignee"
                    value={newShipment.consignee}
                    onChange={(e) => setNewShipment(prev => ({ ...prev, consignee: e.target.value }))}
                    placeholder="Enter consignee name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin *</Label>
                  <Input
                    id="origin"
                    value={newShipment.origin}
                    onChange={(e) => setNewShipment(prev => ({ ...prev, origin: e.target.value }))}
                    placeholder="Enter origin location"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination *</Label>
                  <Input
                    id="destination"
                    value={newShipment.destination}
                    onChange={(e) => setNewShipment(prev => ({ ...prev, destination: e.target.value }))}
                    placeholder="Enter destination location"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedDelivery">Estimated Delivery</Label>
                  <Input
                    id="estimatedDelivery"
                    type="date"
                    value={newShipment.estimatedDelivery}
                    onChange={(e) => setNewShipment(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Shipment Value ($)</Label>
                  <Input
                    id="value"
                    type="number"
                    value={newShipment.value}
                    onChange={(e) => setNewShipment(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="Enter shipment value"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={newShipment.weight}
                    onChange={(e) => setNewShipment(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="Enter weight in kg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="containers">Container Numbers</Label>
                  <Input
                    id="containers"
                    value={newShipment.containers}
                    onChange={(e) => setNewShipment(prev => ({ ...prev, containers: e.target.value }))}
                    placeholder="Enter container numbers (comma separated)"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newShipment.notes}
                  onChange={(e) => setNewShipment(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any additional notes for the shipment"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                resetForm()
                setIsAddShipmentDialogOpen(false)
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddNewShipment} disabled={addingShipment}>
                {addingShipment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Shipment
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
