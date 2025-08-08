"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import {
  Database,
  Zap,
  CheckCircle,
  AlertTriangle,
  Settings,
  FolderSyncIcon as Sync,
  Download,
  Activity,
} from "lucide-react"

interface ERPSystem {
  id: string
  name: string
  type: string
  status: "connected" | "disconnected" | "syncing" | "error"
  lastSync: string
  recordsSynced: number
  version: string
  apiEndpoint: string
}

const DEMO_ERP_SYSTEMS: ERPSystem[] = [
  {
    id: "1",
    name: "Tally Prime",
    type: "Accounting",
    status: "connected",
    lastSync: "2024-01-15 14:30",
    recordsSynced: 1245,
    version: "3.0.1",
    apiEndpoint: "https://api.tallysolutions.com/v1",
  },
  {
    id: "2",
    name: "SAP Business One",
    type: "ERP",
    status: "syncing",
    lastSync: "2024-01-15 14:25",
    recordsSynced: 2890,
    version: "10.0",
    apiEndpoint: "https://api.sap.com/businessone/v1",
  },
  {
    id: "3",
    name: "Oracle NetSuite",
    type: "Cloud ERP",
    status: "error",
    lastSync: "2024-01-15 12:00",
    recordsSynced: 567,
    version: "2024.1",
    apiEndpoint: "https://api.netsuite.com/v1",
  },
  {
    id: "4",
    name: "QuickBooks Enterprise",
    type: "Accounting",
    status: "disconnected",
    lastSync: "2024-01-14 18:00",
    recordsSynced: 0,
    version: "23.0",
    apiEndpoint: "https://api.quickbooks.com/v3",
  },
]

export default function ERPIntegration() {
  const { toast } = useToast();
  const [selectedSystem, setSelectedSystem] = useState("all")
  const [autoSync, setAutoSync] = useState(true)
  const [syncFrequency, setSyncFrequency] = useState("hourly")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [erpSystems, setErpSystems] = useState(DEMO_ERP_SYSTEMS)
  const [loading, setLoading] = useState(false)
  
  // Form state for adding new integration
  const [formData, setFormData] = useState({
    name: "",
    type: "ERP",
    endpoint: "",
    apiKey: "",
    username: "",
    password: "",
    description: ""
  })

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await apiClient.getIntegrations();
      if (response.success && response.data) {
        setErpSystems(response.data || []);
      } else {
        console.warn('Failed to fetch integrations, using demo data');
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
      // Keep using demo data as fallback
    }
  };

  const handleAddIntegration = async () => {
    if (!formData.name || !formData.endpoint) {
      toast({
        title: "Error",
        description: "Please fill in required fields (Name and Endpoint)",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Call the real API
      const response = await apiClient.createIntegration({
        name: formData.name,
        type: formData.type,
        endpoint: formData.endpoint,
        apiKey: formData.apiKey || undefined,
        username: formData.username || undefined,
        password: formData.password || undefined,
        description: formData.description || undefined
      });

      if (response.success) {
        toast({
          title: "Integration Added",
          description: `${formData.name} has been added successfully.`,
        });
        
        setIsAddDialogOpen(false);
        resetForm();
        
        // Refresh the integrations list
        fetchIntegrations();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to add integration",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add integration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "ERP",
      endpoint: "",
      apiKey: "",
      username: "",
      password: "",
      description: ""
    });
  };

  const handleSyncIntegration = async (integrationId: string) => {
    try {
      const response = await apiClient.syncIntegration(integrationId);
      if (response.success) {
        toast({
          title: "Sync Started",
          description: "Integration sync has been initiated.",
        });
        
        // Refresh the integrations list to show updated status
        fetchIntegrations();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to start sync",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start sync. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTestIntegration = async (integrationId: string) => {
    try {
      const response = await apiClient.testIntegration(integrationId);
      if (response.success) {
        toast({
          title: "Connection Test",
          description: response.data?.connected ? "Connection successful!" : "Connection failed",
          variant: response.data?.connected ? "default" : "destructive",
        });
      } else {
        toast({
          title: "Test Failed",
          description: response.message || "Connection test failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test connection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "default"
      case "syncing":
        return "secondary"
      case "error":
        return "destructive"
      case "disconnected":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "syncing":
        return <Sync className="h-4 w-4 text-blue-500 animate-spin" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "disconnected":
        return <Database className="h-4 w-4 text-gray-500" />
      default:
        return <Database className="h-4 w-4 text-gray-500" />
    }
  }

  const connectedSystems = erpSystems.filter((s) => s.status === "connected").length
  const totalRecords = erpSystems.reduce((sum, s) => sum + s.recordsSynced, 0)
  const systemsWithErrors = erpSystems.filter((s) => s.status === "error").length

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ERP Integration</h1>
            <p className="text-gray-600 mt-2">Connect and sync with your existing ERP and accounting systems</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Zap className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add ERP Integration</DialogTitle>
                <DialogDescription>
                  Connect a new ERP or accounting system to sync your data.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Integration Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Tally Prime"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">System Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select system type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ERP">ERP System</SelectItem>
                        <SelectItem value="Accounting">Accounting Software</SelectItem>
                        <SelectItem value="Cloud ERP">Cloud ERP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endpoint">API Endpoint *</Label>
                  <Input
                    id="endpoint"
                    placeholder="https://api.yourerpSystem.com/v1"
                    value={formData.endpoint}
                    onChange={(e) => setFormData(prev => ({ ...prev, endpoint: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="API Username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="API Password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key (Optional)</Label>
                  <Input
                    id="apiKey"
                    placeholder="API Key if required"
                    value={formData.apiKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Brief description of this integration"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddIntegration} disabled={loading}>
                  {loading ? "Adding..." : "Add Integration"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Forwarder-specific ERP Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected Systems</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connectedSystems}</div>
              <p className="text-xs text-muted-foreground">Active integrations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Records Synced</CardTitle>
              <Sync className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRecords.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total synchronized</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.5%</div>
              <p className="text-xs text-muted-foreground">Success rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Errors</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemsWithErrors}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="systems" className="space-y-6">
          <TabsList>
            <TabsTrigger value="systems">Connected Systems</TabsTrigger>
            <TabsTrigger value="mapping">Data Mapping</TabsTrigger>
            <TabsTrigger value="sync">Sync Settings</TabsTrigger>
            <TabsTrigger value="logs">Sync Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="systems" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ERP System Status</CardTitle>
                <CardDescription>Monitor and manage your ERP system connections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {erpSystems.map((system) => (
                    <div key={system.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Database className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{system.name}</h4>
                            <p className="text-sm text-gray-600">{system.type}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                              <span>Version: {system.version}</span>
                              <span>Last Sync: {system.lastSync}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-lg font-semibold">{system.recordsSynced.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">Records</div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(system.status)}
                              <Badge variant={getStatusColor(system.status)}>{system.status}</Badge>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleTestIntegration(system.id)}
                              title="Test Connection"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSyncIntegration(system.id)}
                              disabled={system.status === "syncing"}
                              title="Sync Data"
                            >
                              <Sync className={`h-4 w-4 ${system.status === "syncing" ? "animate-spin" : ""}`} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Integrations</CardTitle>
                <CardDescription>Connect with popular ERP and accounting systems</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 text-center">
                    <Database className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                    <h4 className="font-medium mb-2">Microsoft Dynamics</h4>
                    <p className="text-sm text-gray-600 mb-3">Enterprise ERP solution</p>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      Connect
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <Database className="h-8 w-8 mx-auto mb-3 text-green-600" />
                    <h4 className="font-medium mb-2">Zoho Books</h4>
                    <p className="text-sm text-gray-600 mb-3">Cloud accounting software</p>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      Connect
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <Database className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                    <h4 className="font-medium mb-2">Odoo</h4>
                    <p className="text-sm text-gray-600 mb-3">Open source ERP</p>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      Connect
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mapping" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Field Mapping</CardTitle>
                <CardDescription>Configure how data flows between systems</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium mb-3">Export Platform Fields</h4>
                      <div className="space-y-2">
                        <div className="p-2 border rounded bg-blue-50">Invoice Number</div>
                        <div className="p-2 border rounded bg-blue-50">Exporter Name</div>
                        <div className="p-2 border rounded bg-blue-50">Consignee Details</div>
                        <div className="p-2 border rounded bg-blue-50">HS Code</div>
                        <div className="p-2 border rounded bg-blue-50">Invoice Value</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                        <p className="text-sm text-gray-600">Auto Mapping</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">ERP System Fields</h4>
                      <div className="space-y-2">
                        <div className="p-2 border rounded bg-green-50">Bill_Number</div>
                        <div className="p-2 border rounded bg-green-50">Vendor_Name</div>
                        <div className="p-2 border rounded bg-green-50">Customer_Info</div>
                        <div className="p-2 border rounded bg-green-50">Product_Code</div>
                        <div className="p-2 border rounded bg-green-50">Amount</div>
                      </div>
                    </div>
                  </div>
                  <Button>Save Mapping Configuration</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sync" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Synchronization Settings</CardTitle>
                <CardDescription>Configure how and when data syncs between systems</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Auto Sync</h4>
                    <p className="text-sm text-gray-500">Automatically sync data at regular intervals</p>
                  </div>
                  <Switch checked={autoSync} onCheckedChange={setAutoSync} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sync Frequency</label>
                  <Select value={syncFrequency} onValueChange={setSyncFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="hourly">Every Hour</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Sync Direction</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Export Platform → ERP</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">ERP → Export Platform</span>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Bidirectional Sync</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Data Types to Sync</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Invoices</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Purchase Orders</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Customer Data</span>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Product Catalog</span>
                      <Switch />
                    </div>
                  </div>
                </div>

                <Button>Save Sync Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Synchronization Logs</CardTitle>
                <CardDescription>Monitor sync activities and troubleshoot issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Tally Prime Sync Completed</p>
                        <p className="text-sm text-gray-600">145 records synchronized successfully</p>
                        <p className="text-xs text-gray-500">2024-01-15 14:30:25</p>
                      </div>
                    </div>
                    <Badge variant="default">Success</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Sync className="h-5 w-5 text-blue-500 animate-spin" />
                      <div>
                        <p className="font-medium">SAP Business One Sync In Progress</p>
                        <p className="text-sm text-gray-600">Syncing invoice data...</p>
                        <p className="text-xs text-gray-500">Started: 2024-01-15 14:25:00</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">In Progress</Badge>
                      <Progress value={65} className="w-24 mt-2" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium">Oracle NetSuite Sync Failed</p>
                        <p className="text-sm text-gray-600">Authentication error - API key expired</p>
                        <p className="text-xs text-gray-500">2024-01-15 12:00:15</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant="destructive">Error</Badge>
                      <Button variant="outline" size="sm">
                        Retry
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Download className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium">Data Export Completed</p>
                        <p className="text-sm text-gray-600">Export compliance report generated</p>
                        <p className="text-xs text-gray-500">2024-01-15 11:45:30</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
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
