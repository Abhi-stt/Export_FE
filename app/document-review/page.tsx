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
import { Shield, FileText, CheckCircle, AlertTriangle, Clock, Download, Eye, Users, Plus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DocumentReview {
  id: string
  documentType: string
  client: string
  status: "approved" | "pending" | "rejected" | "under_review"
  date: string
  reviewer: string
  issues: number
  recommendations: number
}

const DEMO_REVIEWS: DocumentReview[] = [
  {
    id: "DR001",
    documentType: "Invoice",
    client: "ABC Exports Ltd",
    status: "approved",
    date: "2024-01-15",
    reviewer: "CA John Smith",
    issues: 0,
    recommendations: 2,
  },
  {
    id: "DR002",
    documentType: "BOE",
    client: "XYZ Trading Co",
    status: "under_review",
    date: "2024-01-15",
    reviewer: "CA Sarah Johnson",
    issues: 3,
    recommendations: 1,
  },
  {
    id: "DR003",
    documentType: "Certificate of Origin",
    client: "Global Traders",
    status: "rejected",
    date: "2024-01-14",
    reviewer: "CA Mike Wilson",
    issues: 5,
    recommendations: 3,
  },
  {
    id: "DR004",
    documentType: "Packing List",
    client: "Tech Solutions",
    status: "pending",
    date: "2024-01-14",
    reviewer: "Unassigned",
    issues: 0,
    recommendations: 0,
  },
]

export default function DocumentReview() {
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [reviews, setReviews] = useState<DocumentReview[]>(DEMO_REVIEWS)
  const [isStartReviewDialogOpen, setIsStartReviewDialogOpen] = useState(false)
  const [startingReview, setStartingReview] = useState(false)
  const { toast } = useToast()

  // Form state for new document review
  const [newReview, setNewReview] = useState({
    documentType: "",
    client: "",
    documentId: "",
    priority: "medium" as "low" | "medium" | "high",
    notes: "",
    assignedTo: ""
  })

  const filteredReviews = reviews.filter((review) => {
    const statusMatch = selectedStatus === "all" || review.status === selectedStatus
    const typeMatch = selectedType === "all" || review.documentType === selectedType
    return statusMatch && typeMatch
  })

  const handleStartNewReview = async () => {
    try {
      setStartingReview(true)
      
      // Validate required fields
      if (!newReview.documentType || !newReview.client || !newReview.documentId) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (Document Type, Client, Document ID)",
          variant: "destructive",
        })
        return
      }

      // Create new document review
      const newDocumentReview: DocumentReview = {
        id: `DR${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        documentType: newReview.documentType,
        client: newReview.client,
        date: new Date().toISOString().split('T')[0],
        status: "pending" as "approved" | "pending" | "rejected" | "under_review",
        reviewer: newReview.assignedTo || "Unassigned",
        issues: 0,
        recommendations: 0,
      }

      setReviews(prev => [newDocumentReview, ...prev])
      
      // Reset form
      setNewReview({
        documentType: "",
        client: "",
        documentId: "",
        priority: "medium",
        notes: "",
        assignedTo: ""
      })
      
      setIsStartReviewDialogOpen(false)
      
      toast({
        title: "Success",
        description: "Document review started successfully",
        variant: "default",
      })

      // Try to call the API in the background (for demo purposes)
      try {
        const reviewData = {
          documentType: newReview.documentType,
          client: newReview.client,
          documentId: newReview.documentId,
          priority: newReview.priority,
          notes: newReview.notes,
          assignedTo: newReview.assignedTo,
          status: "pending"
        }

        const response = await fetch('/api/document-reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(reviewData)
        })

        if (!response.ok) {
          console.log('API call failed (expected in demo mode):', response.status)
        }
      } catch (apiError) {
        console.log('API call error (expected in demo mode):', apiError)
      }
      
    } catch (error) {
      console.error('Error starting document review:', error)
      toast({
        title: "Error",
        description: "Failed to start document review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setStartingReview(false)
    }
  }

  const resetForm = () => {
    setNewReview({
      documentType: "",
      client: "",
      documentId: "",
      priority: "medium",
      notes: "",
      assignedTo: ""
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "under_review":
        return <Badge className="bg-yellow-100 text-yellow-800">Under Review</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case "pending":
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "under_review":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "rejected":
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
        <h1 className="text-3xl font-bold text-gray-900">Document Review</h1>
        <p className="text-gray-600 mt-2">Review and validate client documents for compliance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews.length}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.filter((r) => r.status === "approved").length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully reviewed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.filter((r) => r.status === "under_review").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently reviewing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.filter((r) => r.status === "rejected").length}
            </div>
            <p className="text-xs text-muted-foreground">Requires correction</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Document Reviews</CardTitle>
              <CardDescription>Track review status and client documents</CardDescription>
            </div>
            <Button onClick={() => setIsStartReviewDialogOpen(true)}>
              <Shield className="mr-2 h-4 w-4" />
              Start New Review
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
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
                <SelectItem value="Certificate of Origin">Certificate of Origin</SelectItem>
                <SelectItem value="Packing List">Packing List</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div key={review.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(review.status)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{review.documentType}</h3>
                        <p className="text-sm text-gray-600">{review.client}</p>
                      </div>
                      <div className="flex space-x-2">
                        {getStatusBadge(review.status)}
                        {review.issues > 0 && (
                          <Badge variant="destructive">{review.issues} issues</Badge>
                        )}
                        {review.recommendations > 0 && (
                          <Badge variant="secondary">{review.recommendations} recommendations</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>{review.date}</span>
                      <span>•</span>
                      <span>Reviewed by: {review.reviewer}</span>
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

      <Dialog open={isStartReviewDialogOpen} onOpenChange={setIsStartReviewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Start New Document Review</DialogTitle>
            <DialogDescription>
              Fill in the details for the new document review.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type *</Label>
                <Select onValueChange={(value) => setNewReview(prev => ({ ...prev, documentType: value }))} value={newReview.documentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Invoice">Invoice</SelectItem>
                    <SelectItem value="BOE">BOE</SelectItem>
                    <SelectItem value="Certificate of Origin">Certificate of Origin</SelectItem>
                    <SelectItem value="Packing List">Packing List</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Input
                  id="client"
                  value={newReview.client}
                  onChange={(e) => setNewReview(prev => ({ ...prev, client: e.target.value }))}
                  placeholder="Enter client name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documentId">Document ID *</Label>
                <Input
                  id="documentId"
                  value={newReview.documentId}
                  onChange={(e) => setNewReview(prev => ({ ...prev, documentId: e.target.value }))}
                  placeholder="Enter document ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select onValueChange={(value) => setNewReview(prev => ({ ...prev, priority: value as "low" | "medium" | "high" }))} value={newReview.priority}>
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
            
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Select onValueChange={(value) => setNewReview(prev => ({ ...prev, assignedTo: value }))} value={newReview.assignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reviewer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CA John Smith">CA John Smith</SelectItem>
                  <SelectItem value="CA Sarah Johnson">CA Sarah Johnson</SelectItem>
                  <SelectItem value="CA Mike Wilson">CA Mike Wilson</SelectItem>
                  <SelectItem value="Unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newReview.notes}
                onChange={(e) => setNewReview(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any additional notes for the review"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              resetForm()
              setIsStartReviewDialogOpen(false)
            }}>
              Cancel
            </Button>
            <Button onClick={handleStartNewReview} disabled={startingReview}>
              {startingReview ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Start Review
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
