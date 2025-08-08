"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Zap, Key, Eye, EyeOff, Copy, Trash2, Plus, Activity, Shield } from "lucide-react"
import { apiClient, authUtils } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface APIKey {
  _id: string
  name: string
  key?: string // Only available on creation
  status: "active" | "inactive" | "expired"
  permissions: string[]
  lastUsed?: string
  requests?: number
  description?: string
  createdBy: {
    name: string
    email: string
  }
  createdAt: string
}

export default function APIManagement() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form state for creating API key
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: ["read"] as string[]
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Check if user is authenticated
    if (!authUtils.isAuthenticated()) {
      setError('Please login to access this resource');
      setLoading(false);
      return;
    }
    
    fetchAPIKeys();
  }, [mounted]);

  const fetchAPIKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getAPIKeys();
      if (response.success && response.data) {
        setApiKeys(Array.isArray(response.data) ? response.data : []);
      } else {
        console.warn('API did not return API keys, using empty array');
        setApiKeys([]);
        setError('Could not load API keys. Please check your connection.');
      }
    } catch (err) {
      console.error('Error fetching API keys:', err);
      setApiKeys([]); // Set empty array as fallback
      setError('Failed to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAPIKey = async () => {
    try {
      const response = await apiClient.createAPIKey(formData);
      if (response.success) {
        toast({
          title: "API Key Created",
          description: `API Key "${formData.name}" has been created successfully.`,
        });
        
        // Show the API key to user (only shown once)
        if (response.data?.apiKey?.key) {
          toast({
            title: "API Key Generated",
            description: `Key: ${response.data.apiKey.key}`,
            duration: 10000,
          });
        }
        
        setIsCreateDialogOpen(false);
        resetForm();
        fetchAPIKeys();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create API key",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create API key. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAPIKey = async (keyId: string) => {
    try {
      const response = await apiClient.deleteAPIKey(keyId);
      if (response.success) {
        toast({
          title: "API Key Deleted",
          description: "API key has been deleted successfully.",
        });
        fetchAPIKeys();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete API key",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete API key. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      permissions: ["read"]
    });
  };

  const filteredKeys = apiKeys.filter((key) => {
    return selectedStatus === "all" || key.status === selectedStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      case "expired":
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const maskKey = (key: string) => {
    return key.substring(0, 8) + "..." + key.substring(key.length - 4)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">API Management</h1>
        <p className="text-gray-600 mt-2">Manage API integrations and access keys - UPDATED</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Keys</CardTitle>
            <Key className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiKeys.length}</div>
            <p className="text-xs text-muted-foreground">Active keys</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apiKeys.filter((k) => k.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apiKeys.reduce((sum, key) => sum + (key.requests || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limit</CardTitle>
            <Zap className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,000/hr</div>
            <p className="text-xs text-muted-foreground">Per key</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage your API access keys and permissions</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    Generate a new API key for your application. Store it securely as it will only be shown once.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="API Key Name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Description (optional)"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Permissions</Label>
                    <Select 
                      value={formData.permissions[0] || 'read'} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, permissions: [value] }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select permissions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read">Read Only</SelectItem>
                        <SelectItem value="write">Read & Write</SelectItem>
                        <SelectItem value="admin">Admin Access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAPIKey}>
                    Create API Key
                  </Button>
                </DialogFooter>
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowKeys(!showKeys)}
              className="ml-auto"
            >
              {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showKeys ? "Hide Keys" : "Show Keys"}
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">Loading API keys...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          ) : filteredKeys.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">No API keys found. Create your first API key to get started.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredKeys.map((apiKey) => (
                <div key={apiKey._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-medium">{apiKey.name}</h3>
                      <p className="text-sm text-gray-600">
                        {showKeys ? (apiKey.key || 'Hidden') : (apiKey.key ? maskKey(apiKey.key) : 'N/A')}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {getStatusBadge(apiKey.status)}
                      {apiKey.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Last used: {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString() : 'Never'}</span>
                    <span>•</span>
                    <span>{(apiKey.requests || 0).toLocaleString()} requests</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => apiKey.key && copyToClipboard(apiKey.key)}
                    disabled={!apiKey.key}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Activity className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteAPIKey(apiKey._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API Documentation</CardTitle>
            <CardDescription>Integration guides and examples</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Authentication</h4>
              <p className="text-sm text-gray-600">
                Include your API key in the Authorization header:
              </p>
              <div className="bg-gray-100 p-2 rounded text-sm font-mono">
                Authorization: Bearer sk_live_1234567890abcdef
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Base URL</h4>
              <div className="bg-gray-100 p-2 rounded text-sm font-mono">
                https://api.aiexportplatform.com/v1
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Rate Limits</h4>
              <p className="text-sm text-gray-500">
                • 1,000 requests per hour per API key<br />
                • 10,000 requests per day per API key<br />
                • Rate limit headers included in responses
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook Configuration</CardTitle>
            <CardDescription>Configure webhook endpoints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input placeholder="https://your-domain.com/webhook" />
            </div>
            <div className="space-y-2">
              <Label>Events</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="user-registered" defaultChecked />
                  <Label htmlFor="user-registered">User Registered</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="document-uploaded" defaultChecked />
                  <Label htmlFor="document-uploaded">Document Uploaded</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="validation-completed" />
                  <Label htmlFor="validation-completed">Validation Completed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="payment-received" />
                  <Label htmlFor="payment-received">Payment Received</Label>
                </div>
              </div>
            </div>
            <Button>Save Webhook</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
