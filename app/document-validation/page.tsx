"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Shield, FileText, CheckCircle, AlertTriangle, Clock, Download, Eye, Plus, Loader2, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DocumentValidation {
  id: string
  documentType: string
  exporter: string
  status: "validated" | "pending" | "error" | "in_progress"
  date: string
  errors: number
  warnings: number
  validationTime: string
}

const DEMO_VALIDATIONS: DocumentValidation[] = [
  {
    id: "DV001",
    documentType: "Invoice",
    exporter: "ABC Exports Ltd",
    status: "validated",
    date: "2024-01-15",
    errors: 0,
    warnings: 1,
    validationTime: "2.3s",
  },
  {
    id: "DV002",
    documentType: "BOE",
    exporter: "XYZ Trading Co",
    status: "in_progress",
    date: "2024-01-15",
    errors: 2,
    warnings: 0,
    validationTime: "1.8s",
  },
  {
    id: "DV003",
    documentType: "Packing List",
    exporter: "Global Traders",
    status: "error",
    date: "2024-01-14",
    errors: 5,
    warnings: 2,
    validationTime: "3.1s",
  },
  {
    id: "DV004",
    documentType: "Certificate of Origin",
    exporter: "Tech Solutions",
    status: "pending",
    date: "2024-01-14",
    errors: 0,
    warnings: 0,
    validationTime: "0.0s",
  },
]

export default function DocumentValidation() {
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [validations, setValidations] = useState<DocumentValidation[]>(DEMO_VALIDATIONS)
  const [isValidateDialogOpen, setIsValidateDialogOpen] = useState(false)
  const [validatingDocument, setValidatingDocument] = useState(false)
  const { toast } = useToast()

  // Form state for new document validation
  const [newValidation, setNewValidation] = useState({
    documentType: "",
    exporter: "",
    documentId: "",
    priority: "medium" as "low" | "medium" | "high",
    notes: "",
    file: null as File | null
  })

  const filteredValidations = validations.filter((validation) => {
    const statusMatch = selectedStatus === "all" || validation.status === selectedStatus
    const typeMatch = selectedType === "all" || validation.documentType === selectedType
    return statusMatch && typeMatch
  })

  const handleValidateNewDocument = async () => {
    try {
      setValidatingDocument(true)
      
      // Validate required fields
      if (!newValidation.documentType || !newValidation.exporter || !newValidation.documentId) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (Document Type, Exporter, Document ID)",
          variant: "destructive",
        })
        return
      }

      // Simulate validation process
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Create new document validation
      const newDocumentValidation: DocumentValidation = {
        id: `DV${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        documentType: newValidation.documentType,
        exporter: newValidation.exporter,
        date: new Date().toISOString().split('T')[0],
        status: "validated" as "validated" | "pending" | "error" | "in_progress",
        errors: Math.floor(Math.random() * 3), // Random errors for demo
        warnings: Math.floor(Math.random() * 2), // Random warnings for demo
        validationTime: `${(Math.random() * 5 + 1).toFixed(1)}s`,
      }

      setValidations(prev => [newDocumentValidation, ...prev])
      
      // Reset form
      setNewValidation({
        documentType: "",
        exporter: "",
        documentId: "",
        priority: "medium",
        notes: "",
        file: null
      })
      
      setIsValidateDialogOpen(false)
      
      toast({
        title: "Success",
        description: "Document validation completed successfully",
        variant: "default",
      })

      // Try to call the API in the background (for demo purposes)
      try {
        const validationData = {
          documentType: newValidation.documentType,
          exporter: newValidation.exporter,
          documentId: newValidation.documentId,
          priority: newValidation.priority,
          notes: newValidation.notes,
          status: "validated"
        }

        const response = await fetch('/api/document-validations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(validationData)
        })

        if (!response.ok) {
          console.log('API call failed (expected in demo mode):', response.status)
        }
      } catch (apiError) {
        console.log('API call error (expected in demo mode):', apiError)
      }
      
    } catch (error) {
      console.error('Error validating document:', error)
      toast({
        title: "Error",
        description: "Failed to validate document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setValidatingDocument(false)
    }
  }

  const resetForm = () => {
    setNewValidation({
      documentType: "",
      exporter: "",
      documentId: "",
      priority: "medium",
      notes: "",
      file: null
    })
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setNewValidation(prev => ({ ...prev, file }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "validated":
        return <Badge className="bg-green-100 text-green-800">Validated</Badge>
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      case "pending":
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "validated":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in_progress":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "pending":
        return <FileText className="h-4 w-4 text-gray-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Document Validation</h1>
        <p className="text-gray-600 mt-2">Validate shipment documents for compliance and accuracy</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{validations.length}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validated</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {validations.filter((v) => v.status === "validated").length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {validations.filter((v) => v.status === "error").length}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1s</div>
            <p className="text-xs text-muted-foreground">Per document</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Document Validations</CardTitle>
              <CardDescription>Track validation status and results</CardDescription>
            </div>
            <Button onClick={() => setIsValidateDialogOpen(true)}>
              <Shield className="mr-2 h-4 w-4" />
              Validate New Document
            </Button>
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
                <SelectItem value="validated">Validated</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Invoice">Invoice</SelectItem>
                <SelectItem value="BOE">BOE</SelectItem>
                <SelectItem value="Packing List">Packing List</SelectItem>
                <SelectItem value="Certificate of Origin">Certificate of Origin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredValidations.map((validation) => (
              <div key={validation.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(validation.status)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{validation.documentType}</h3>
                        <p className="text-sm text-gray-600">{validation.exporter}</p>
                      </div>
                      <div className="flex space-x-2">
                        {getStatusBadge(validation.status)}
                        {validation.errors > 0 && (
                          <Badge variant="destructive">{validation.errors} errors</Badge>
                        )}
                        {validation.warnings > 0 && (
                          <Badge variant="secondary">{validation.warnings} warnings</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>{validation.date}</span>
                      <span>•</span>
                      <span>{validation.validationTime}</span>
                    </div>
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

      <Dialog open={isValidateDialogOpen} onOpenChange={setIsValidateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Validate New Document</DialogTitle>
            <DialogDescription>
              Upload and validate a new document for compliance and accuracy.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type *</Label>
                <Select value={newValidation.documentType} onValueChange={(value) => setNewValidation(prev => ({ ...prev, documentType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Invoice">Invoice</SelectItem>
                    <SelectItem value="BOE">BOE</SelectItem>
                    <SelectItem value="Packing List">Packing List</SelectItem>
                    <SelectItem value="Certificate of Origin">Certificate of Origin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={newValidation.priority} onValueChange={(value) => setNewValidation(prev => ({ ...prev, priority: value as "low" | "medium" | "high" }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exporter">Exporter *</Label>
                <Input
                  id="exporter"
                  value={newValidation.exporter}
                  onChange={(e) => setNewValidation(prev => ({ ...prev, exporter: e.target.value }))}
                  placeholder="Enter exporter name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentId">Document ID *</Label>
                <Input
                  id="documentId"
                  value={newValidation.documentId}
                  onChange={(e) => setNewValidation(prev => ({ ...prev, documentId: e.target.value }))}
                  placeholder="Enter document ID"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file">Upload Document</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">Drag and drop your document here, or click to browse</p>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button variant="outline" size="sm" onClick={() => document.getElementById('file')?.click()}>
                  Choose File
                </Button>
                {newValidation.file && (
                  <p className="text-sm text-green-600 mt-2">{newValidation.file.name}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Validation Notes</Label>
              <Textarea
                id="notes"
                value={newValidation.notes}
                onChange={(e) => setNewValidation(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any specific validation requirements or notes"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              resetForm()
              setIsValidateDialogOpen(false)
            }}>
              Cancel
            </Button>
            <Button onClick={handleValidateNewDocument} disabled={validatingDocument}>
              {validatingDocument ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Validate Document
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
