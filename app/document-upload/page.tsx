"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload, FileText, CheckCircle, AlertTriangle, X, Eye, Download, Brain, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  status: "uploading" | "processing" | "completed" | "error"
  progress: number
  errors?: string[]
  suggestions?: string[]
  analysis?: any
  documentId?: string
  
  // AI Processing Results
  extractedText?: string
  entities?: any[]
  confidence?: number
  structuredData?: any
  complianceAnalysis?: {
    isValid: boolean
    score: number
    checks: any[]
  }
  complianceErrors?: any[]
  complianceCorrections?: any[]
  ocrMetadata?: any
}

export default function DocumentUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [documentType, setDocumentType] = useState("")
  const [description, setDescription] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // No authentication required for document upload

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])

    selectedFiles.forEach((file) => {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `File ${file.name} is too large. Maximum size is 10MB.`,
          variant: "destructive",
        })
        return
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Unsupported File Type",
          description: `File ${file.name} is not a supported format. Please upload PDF, JPG, PNG, or DOCX files.`,
          variant: "destructive",
        })
        return
      }

      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        status: "uploading",
        progress: 0,
      }

      setFiles((prev) => [...prev, newFile])

      // Upload file to backend
      uploadFileToBackend(newFile.id, file)
    })
  }

  const uploadFileToBackend = async (fileId: string, file: File) => {
    try {
      console.log('🔄 Starting file upload to backend...')
      
      // Get authentication token
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }
      
      // Create FormData
      const formData = new FormData()
      formData.append('document', file) // Backend expects 'document' field name
      formData.append('documentType', documentType || 'other')
      if (description) {
        formData.append('description', description)
      }

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: "uploading", progress: 0 } : f
        )
      )

      // Upload using API client
      const data = await apiClient.uploadDocument(formData)
      console.log('📄 Upload response data:', data)

      if (data.success !== false && data.document) {
        // Update file status to processing
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId 
              ? { 
                  ...f, 
                  status: "processing", 
                  progress: 50,
                  documentId: data.document._id 
                } 
              : f
          )
        )

        // Start polling for processing status
        pollDocumentStatus(fileId, data.document._id)
      } else {
        console.error('❌ Upload failed:', data)
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "error",
                  progress: 0,
                  errors: [data.message || 'Upload failed']
                }
              : f
          )
        )
        
        toast({
          title: "Upload Failed",
          description: data.message || "Failed to upload document",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('❌ Upload error:', error)
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "error",
                progress: 0,
                errors: ['Upload failed. Please try again.']
              }
            : f
        )
      )
      
      toast({
        title: "Upload Error",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    }
  }

  const pollDocumentStatus = async (fileId: string, documentId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        // Debug authentication
        const token = localStorage.getItem('token')
        console.log('🔍 Frontend Debug - Polling document:', {
          documentId,
          hasToken: !!token,
          tokenStart: token ? token.substring(0, 20) + '...' : 'No token'
        })
        
        const response = await apiClient.getDocument(documentId)

        if (response.success !== false && response.document) {
          const document = response.document

          // Update progress
          console.log(`📊 Document status update for ${fileId}:`, {
            status: document.status,
            confidence: document.confidence,
            extractedText: !!document.extractedText,
            entities: document.entities?.length || 0,
            complianceAnalysis: !!document.complianceAnalysis,
            aiProcessingResults: !!document.aiProcessingResults
          })
          
          // Create analysis object from document data
          const analysis = {
            extractedText: document.extractedText,
            entities: document.entities || [],
            confidence: document.confidence || 0,
            complianceAnalysis: document.complianceAnalysis,
            complianceErrors: document.complianceErrors || [],
            complianceCorrections: document.complianceCorrections || [],
            complianceRecommendations: document.complianceRecommendations || [],
            aiProcessingResults: document.aiProcessingResults
          }
          
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    progress: document.status === 'completed' ? 100 : 
                             document.status === 'processing' ? 75 : 50,
                    status: document.status,
                    analysis: analysis,
                    errors: document.complianceErrors || [],
                    suggestions: document.complianceCorrections?.map(c => c.message) || [],
                    // Add AI processing results
                    extractedText: document.extractedText,
                    entities: document.entities,
                    confidence: document.confidence,
                    structuredData: document.structuredData,
                    complianceAnalysis: document.complianceAnalysis,
                    complianceErrors: document.complianceErrors,
                    complianceCorrections: document.complianceCorrections,
                    ocrMetadata: document.ocrMetadata
                  }
                : f
            )
          )

          // If processing is complete, stop polling
          if (document.status === 'completed' || document.status === 'error') {
            console.log(`✅ Stopping polling for ${fileId} - Status: ${document.status}`);
            console.log(`📊 Final document state:`, {
              id: document._id,
              status: document.status,
              progress: document.progress,
              hasAiResults: !!document.aiResults,
              aiResultsKeys: document.aiResults ? Object.keys(document.aiResults) : []
            })
            clearInterval(pollInterval)
            
            if (document.status === 'completed') {
              toast({
                title: "Document Processed Successfully!",
                description: "AI analysis complete. You can now preview and download OCR data.",
                variant: "default",
              })
            } else {
              toast({
                title: "Processing Error",
                description: "Document processing failed. Please try again.",
                variant: "destructive",
              })
            }
          } else {
            console.log(`🔄 Continuing polling for ${fileId} - Status: ${document.status}, Progress: ${document.progress}`)
          }
        }
      } catch (error) {
        console.error('❌ Polling error:', error)
        clearInterval(pollInterval)
      }
    }, 2000) // Poll every 2 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
    }, 300000)
  }

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const downloadOCRData = (file: UploadedFile) => {
    if (!hasAnalysisData(file)) {
      toast({
        title: "No Analysis Data",
        description: "Please wait for document processing to complete or try again",
        variant: "destructive",
      })
      return
    }

    const ocrData = {
      fileName: file.name,
      documentType: file.type,
      status: file.status,
      progress: file.progress,
      
      // AI Processing Results
      extractedText: file.extractedText || "No text extracted",
      confidence: file.confidence || 0,
      structuredData: file.structuredData || {},
      entities: file.entities || [],
      ocrMetadata: file.ocrMetadata || {},
      
      // Compliance Analysis
      complianceAnalysis: file.complianceAnalysis || null,
      complianceErrors: file.complianceErrors || [],
      complianceCorrections: file.complianceCorrections || [],
      
      // Legacy fields for compatibility
      suggestions: file.suggestions || [],
      errors: file.errors || [],
      analysis: file.analysis || {},
      downloadTime: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(ocrData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${file.name.replace(/\.[^/.]+$/, '')}_OCR_Data.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "OCR Data Downloaded",
      description: "Document analysis data has been downloaded successfully",
      variant: "default",
    })
  }

  const openPreview = (file: UploadedFile) => {
    if (!hasAnalysisData(file)) {
      toast({
        title: "No Analysis Data",
        description: "Please wait for document processing to complete or try again",
        variant: "destructive",
      })
      return
    }
    setPreviewFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    droppedFiles.forEach((file) => {
      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        status: "uploading",
        progress: 0,
      }

      setFiles((prev) => [...prev, newFile])
      uploadFileToBackend(newFile.id, file)
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "processing":
        return <span className="h-5 w-5 flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </span>
      default:
        return <FileText className="h-5 w-5 text-blue-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "processing":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Helper function to check if document has analysis data
  const hasAnalysisData = (file: UploadedFile) => {
    // Check for real AI processing results
    const hasExtractedText = !!file.extractedText
    const hasEntities = !!file.entities && file.entities.length > 0
    const hasStructuredData = !!file.structuredData
    const hasComplianceAnalysis = !!file.complianceAnalysis
    
    // Check legacy analysis data for backward compatibility
    const hasLegacyAnalysis = !!file.analysis?.extractedText || !!file.analysis?.content
    
    const hasData = hasExtractedText || hasEntities || hasStructuredData || hasComplianceAnalysis || hasLegacyAnalysis
    
    console.log(`🔍 Checking analysis data for ${file.name}:`, {
      hasExtractedText,
      hasEntities,
      hasStructuredData,
      hasComplianceAnalysis,
      hasLegacyAnalysis,
      result: hasData,
      extractedText: !!file.extractedText,
      entitiesCount: file.entities?.length || 0
    })
    
    return hasData
  }

  // Helper function to get button text based on status
  const getButtonText = (status: any, defaultText: string) => {
    return status === "processing" ? "Processing..." : defaultText
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Upload</h1>
          <p className="text-gray-600 mt-2">Upload and process your export documents with AI-powered validation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>Supported formats: PDF, JPG, PNG, DOCX. Maximum file size: 10MB</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="document-type">Document Type</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">Commercial Invoice</SelectItem>
                      <SelectItem value="boe">Bill of Entry</SelectItem>
                      <SelectItem value="packing-list">Packing List</SelectItem>
                      <SelectItem value="certificate">Certificate of Origin</SelectItem>
                      <SelectItem value="shipping-bill">Shipping Bill</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add any additional context or notes about the document"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragOver 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-900">
                      {isDragOver ? 'Drop files here' : 'Drop files here or click to upload'}
                    </p>
                    <p className="text-sm text-gray-500">Upload multiple files at once</p>
                  </div>
                  <Input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Button className="mt-4" onClick={() => document.getElementById('file-upload')?.click()}>
                      Select Files
                    </Button>
                  </Label>
                </div>
              </CardContent>
            </Card>

            {files.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Processing Status</CardTitle>
                      <CardDescription>AI-powered document analysis and validation</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setFiles([])}
                      className="text-red-600 hover:text-red-700"
                    >
                      Clear All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {files.map((file) => (
                      <div key={file.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(file.status)}
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={getStatusColor(file.status)}>{file.status}</Badge>
                            <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {(file.status === "uploading" || file.status === "processing") && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{file.status === "uploading" ? "Uploading..." : "Processing with AI..."}</span>
                              <span>{file.progress}%</span>
                            </div>
                            <Progress value={file.progress} />
                          </div>
                        )}

                        {/* Show completed analysis summary */}
                        {file.status === "completed" && hasAnalysisData(file) && (
                          <div className="space-y-4 mt-3">
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <h4 className="font-medium text-green-800 mb-2 flex items-center">
                                <Brain className="h-4 w-4 mr-2" />
                                AI Processing Completed
                              </h4>
                              <p className="text-sm text-green-700 mb-1">
                                Document processed with Gemini 1.5 Pro (OCR) + GPT-4 Turbo (Compliance)
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
                                <div>OCR Confidence: {file.confidence ? (file.confidence * 100).toFixed(1) : 'N/A'}%</div>
                                <div>Compliance Score: {file.complianceAnalysis?.score || 'N/A'}/100</div>
                              </div>
                            </div>
                            {file.analysis.content && Object.keys(file.analysis.content).length > 0 && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="font-medium text-blue-800 mb-2">Extracted Entities:</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                  {Object.entries(file.analysis.content).map(([key, value]) => (
                                    <li key={key}><span className="font-semibold">{key}:</span> {String(value)}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {file.analysis.validation && (
                              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                <h4 className="font-medium text-purple-800 mb-2">Validation Score:</h4>
                                <div className="text-sm text-purple-700">{file.analysis.validation.score ? `${file.analysis.validation.score}%` : 'N/A'}</div>
                              </div>
                            )}
                            <div className="flex space-x-2 mt-3">
                              <Button 
                                variant="default" 
                                size="sm" 
                                onClick={() => openPreview(file)}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm" 
                                onClick={() => downloadOCRData(file)}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download OCR Data
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Always show buttons if there's analysis data */}
                        {hasAnalysisData(file) && file.status !== "completed" && (
                          <div className="space-y-4 mt-3">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <h4 className="font-medium text-blue-800 mb-2">AI Analysis Data Available</h4>
                              <p className="text-sm text-blue-700 mb-2">Document has been processed with AI analysis.</p>
                              <div className="text-xs text-blue-700">
                                Status: {file.status} | Has Text: {file.analysis?.extractedText ? 'Yes' : 'No'} | Has Content: {file.analysis?.content ? 'Yes' : 'No'} | Has Entities: {file.analysis?.entities ? 'Yes' : 'No'}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                variant="default" 
                                size="sm" 
                                onClick={() => openPreview(file)}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm" 
                                onClick={() => downloadOCRData(file)}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download OCR Data
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Show message when no analysis data */}
                        {file.status !== "completed" && !hasAnalysisData(file) && file.status !== "uploading" && (
                          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-sm text-gray-600">
                              ⏳ Waiting for AI analysis data...
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Processing Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">OCR Text Extraction</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">HS Code Suggestions</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Compliance Validation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Error Detection</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Auto-correction</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Uploads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Invoice_001.pdf</span>
                    <Badge variant="default">Completed</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>BOE_002.pdf</span>
                    <Badge variant="secondary">Processing</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Packing_List.pdf</span>
                    <Badge variant="destructive">Error</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Preview - {previewFile?.name}</DialogTitle>
            <DialogDescription>
              Extracted OCR text and AI analysis results
            </DialogDescription>
          </DialogHeader>
          
          {previewFile && (
            <div className="space-y-6">
              {/* Document Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">Document Type</p>
                  <p className="text-lg font-semibold">{previewFile.type.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">AI Confidence</p>
                  <p className="text-lg font-semibold">{previewFile.confidence ? (previewFile.confidence * 100).toFixed(1) : 'N/A'}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Processing Time</p>
                  <p className="text-lg font-semibold">{previewFile.analysis?.processingTime || 'N/A'}ms</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">File Size</p>
                  <p className="text-lg font-semibold">{(previewFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>

              {/* Extracted Text */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-blue-500" />
                  Extracted OCR Text (Gemini 1.5 Pro)
                </h3>
                <div className="bg-white border rounded-lg p-4 max-h-60 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {previewFile.extractedText || "Processing... AI text extraction in progress"}
                  </pre>
                </div>
              </div>

              {/* Structured Data */}
              {previewFile.structuredData && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-green-500" />
                    Structured Data Extraction
                  </h3>
                  <div className="bg-white border rounded-lg p-4 max-h-60 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {JSON.stringify(previewFile.structuredData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Entities */}
              {previewFile.entities && previewFile.entities.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Detected Entities</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {previewFile.entities.map((entity, index) => (
                      <div key={index} className="bg-white border rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{entity.type}</span>
                          <Badge variant="outline">{entity.confidence ? (entity.confidence * 100).toFixed(0) : 'N/A'}%</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{entity.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Compliance Analysis */}
              {previewFile.complianceAnalysis && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-blue-500" />
                    Compliance Analysis (GPT-4 Turbo)
                  </h3>
                  <div className="bg-white border rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Validity</p>
                        <Badge variant={previewFile.complianceAnalysis.isValid ? "default" : "destructive"}>
                          {previewFile.complianceAnalysis.isValid ? "Valid" : "Invalid"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                        <p className="text-lg font-semibold">{previewFile.complianceAnalysis.score}/100</p>
                      </div>
                    </div>
                    
                    {previewFile.complianceAnalysis.checks && previewFile.complianceAnalysis.checks.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600">Compliance Checks</p>
                        {previewFile.complianceAnalysis.checks.map((check, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{check.name}</span>
                            <Badge variant={check.passed ? "default" : "destructive"}>
                              {check.passed ? "Passed" : "Failed"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Compliance Errors & Corrections */}
              {(previewFile.complianceErrors && previewFile.complianceErrors.length > 0) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-red-600 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Compliance Issues
                  </h3>
                  <div className="space-y-3">
                    {previewFile.complianceErrors.map((error, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-red-800">{error.field}</p>
                            <p className="text-sm text-red-600">{error.message}</p>
                          </div>
                          <Badge variant="destructive">{error.severity}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Corrections & Suggestions */}
              {(previewFile.complianceCorrections && previewFile.complianceCorrections.length > 0) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-600 flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    AI Suggestions
                  </h3>
                  <div className="space-y-3">
                    {previewFile.complianceCorrections.map((correction, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-blue-800">{correction.field}</p>
                            <p className="text-sm text-blue-600">{correction.message}</p>
                            {correction.suggestion && (
                              <p className="text-sm text-blue-500 mt-1">💡 {correction.suggestion}</p>
                            )}
                          </div>
                          <Badge variant="secondary">{correction.priority}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Content */}
              {previewFile.analysis?.content && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Document Content</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {previewFile.analysis.content.invoiceNumber && (
                        <div>
                          <p className="text-sm font-medium text-blue-600">Invoice Number</p>
                          <p className="text-lg font-semibold">{previewFile.analysis.content.invoiceNumber}</p>
                        </div>
                      )}
                      {previewFile.analysis.content.boeNumber && (
                        <div>
                          <p className="text-sm font-medium text-blue-600">BOE Number</p>
                          <p className="text-lg font-semibold">{previewFile.analysis.content.boeNumber}</p>
                        </div>
                      )}
                      {previewFile.analysis.content.seller && (
                        <div>
                          <p className="text-sm font-medium text-blue-600">Seller</p>
                          <p className="text-lg font-semibold">{previewFile.analysis.content.seller}</p>
                        </div>
                      )}
                      {previewFile.analysis.content.buyer && (
                        <div>
                          <p className="text-sm font-medium text-blue-600">Buyer</p>
                          <p className="text-lg font-semibold">{previewFile.analysis.content.buyer}</p>
                        </div>
                      )}
                      {previewFile.analysis.content.totalAmount && (
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total Amount</p>
                          <p className="text-lg font-semibold">${previewFile.analysis.content.totalAmount}</p>
                        </div>
                      )}
                      {previewFile.analysis.content.currency && (
                        <div>
                          <p className="text-sm font-medium text-blue-600">Currency</p>
                          <p className="text-lg font-semibold">{previewFile.analysis.content.currency}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* Suggestions */}
              {previewFile.analysis.suggestions && previewFile.analysis.suggestions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Suggestions</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <ul className="space-y-2">
                      {previewFile.analysis.suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2 text-yellow-600">•</span>
                          <span className="text-sm">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Errors */}
              {previewFile.analysis.errors && previewFile.analysis.errors.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Errors</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <ul className="space-y-2">
                      {previewFile.analysis.errors.map((error: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2 text-red-600">•</span>
                          <span className="text-sm">{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}


            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
