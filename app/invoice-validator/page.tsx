"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Shield, AlertTriangle, CheckCircle, X, Download, Eye, FileText, Zap } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

// Demo data for fallback
const DEMO_VALIDATION_RESULTS = [
  {
    field: "Invoice Number",
    status: "valid",
    message: "Invoice number format is correct",
  },
  {
    field: "Date Format",
    status: "valid", 
    message: "Date format matches DD/MM/YYYY standard",
  },
  {
    field: "Consignee Information",
    status: "error",
    message: "Missing consignee postal code",
    suggestion: "Add complete postal code for consignee address",
  }
]

// Define interfaces for AI processing results
interface AIValidationResult {
  extractedText: string
  confidence: number
  entities: any[]
  structuredData: any
  complianceAnalysis: {
    isValid: boolean
    score: number
    checks: any[]
  }
  complianceErrors: any[]
  complianceCorrections: any[]
}

export default function InvoiceValidator() {
  const { toast } = useToast()
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [aiProcessingResults, setAiProcessingResults] = useState<AIValidationResult | null>(null)

  const pollDocumentProcessing = async (documentId: string) => {
    return new Promise<void>((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          const response = await apiClient.getDocument(documentId)
          
          if (response.success !== false && response.data) {
            const document = response.data
            
            if (document.status === 'completed') {
              // AI processing is complete
              setAiProcessingResults({
                extractedText: document.extractedText,
                confidence: document.confidence,
                entities: document.entities || [],
                structuredData: document.structuredData,
                complianceAnalysis: document.complianceAnalysis,
                complianceErrors: document.complianceErrors || [],
                complianceCorrections: document.complianceCorrections || []
              })
              
              clearInterval(pollInterval)
              resolve()
            } else if (document.status === 'error') {
              clearInterval(pollInterval)
              reject(new Error('Document processing failed'))
            }
            // Continue polling if status is 'processing'
          } else {
            clearInterval(pollInterval)
            reject(new Error('Failed to get document status'))
          }
        } catch (error) {
          clearInterval(pollInterval)
          reject(error)
        }
      }, 2000) // Poll every 2 seconds
      
      // Timeout after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval)
        reject(new Error('Processing timeout'))
      }, 120000)
    })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setFileName(file.name)
      startValidation(file)
    }
  }

  const startValidation = async (file: File) => {
    setIsValidating(true);
    setValidationResult(null);
    setAiProcessingResults(null);

    try {
      // Step 1: Upload document for AI processing
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', 'invoice');
      formData.append('description', 'Invoice validation document');

      const uploadResponse = await apiClient.uploadDocument(formData);

      // Fix: uploadResponse.document does not exist on type ApiResponse<any>
      // Assume the document is in uploadResponse.data
      if (uploadResponse.success !== false && uploadResponse.data) {
        const docId = uploadResponse.data._id;
        setDocumentId(docId);

        toast({
          title: "Document Uploaded",
          description: "Starting AI processing with Gemini 1.5 Pro + GPT-4 Turbo...",
        });

        // Step 2: Poll for processing completion
        await pollDocumentProcessing(docId);

        // Step 3: Run validation on the processed document
        const validationResponse = await apiClient.validateInvoice(docId);
        if (validationResponse.success !== false && validationResponse.data) {
          setValidationResult(validationResponse.data);
          toast({
            title: "Validation Complete",
            description: "Invoice validation completed successfully!",
          });
        } else {
          throw new Error(validationResponse.message || 'Validation failed');
        }
      } else {
        throw new Error(uploadResponse.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Invoice validation failed:', error);
      toast({
        title: "Validation Failed",
        description: error instanceof Error ? error.message : "Failed to validate invoice",
        variant: "destructive",
      });
      
      // Fallback to demo data
      setValidationResult({
        success: true,
        text: "Demo validation result",
        confidence: 0.75,
        entities: [],
        compliance: {
          isValid: false,
          score: 30,
          checks: [
            { name: 'has_invoice_number', passed: false, message: 'Invoice number is missing', severity: 'error', requirement: 'Invoice must have a unique invoice number' },
            { name: 'has_invoice_date', passed: false, message: 'Invoice date is missing', severity: 'error', requirement: 'Invoice must have a date' }
          ]
        },
        errors: [
          {
            type: 'missing_entity',
            field: 'invoice_number',
            message: 'Missing invoice number',
            severity: 'error',
            requirement: 'Invoice number is required'
          }
        ],
        corrections: [
          {
            type: 'add_field',
            field: 'invoice_number',
            message: 'Add invoice number to the document',
            suggestion: 'Include a unique invoice number in the document',
            priority: 'high'
          }
        ],
        metadata: {
          fileName: file.name,
          confidence: 0.75,
          language: 'en',
          pages: 1,
          processingTime: Date.now()
        }
      });
    } finally {
      setIsValidating(false);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <X className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "default"
      case "warning":
        return "secondary"
      case "error":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Calculate metrics from real AI processing results or validation results
  type ComplianceCheck = {
    passed: boolean;
    severity: 'warning' | 'error' | string;
    // add other properties if needed
  };

  type ComplianceData = {
    checks?: ComplianceCheck[];
    score?: number;
    // add other properties if needed
  };

  const complianceData: ComplianceData | undefined = aiProcessingResults?.complianceAnalysis || validationResult?.compliance;
  const validCount = complianceData?.checks?.filter((r: ComplianceCheck) => r.passed).length || 0;
  const warningCount = complianceData?.checks?.filter((r: ComplianceCheck) => !r.passed && r.severity === 'warning').length || 0;
  const errorCount = complianceData?.checks?.filter((r: ComplianceCheck) => !r.passed && r.severity === 'error').length || 0;
  const totalChecks = complianceData?.checks?.length || 0;
  const complianceScore = complianceData?.score || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Validator</h1>
          <p className="text-gray-600 mt-2">AI-powered invoice validation and compliance checking</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {!fileName && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-500" />
                    Upload Invoice for Validation
                  </CardTitle>
                  <CardDescription>Upload your commercial invoice for AI-powered compliance validation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-gray-900">Drop your invoice here</p>
                      <p className="text-sm text-gray-500">Supports PDF, JPG, PNG, DOCX formats</p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="invoice-upload"
                    />
                    <Button 
                      className="mt-4" 
                      onClick={() => document.getElementById('invoice-upload')?.click()}
                    >
                      Select Invoice File
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isValidating && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-blue-500 animate-pulse" />
                    AI Processing Pipeline
                  </CardTitle>
                  <CardDescription>Real-time processing with Gemini 1.5 Pro + GPT-4 Turbo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>📄 Uploading document...</span>
                        <span>✓ Complete</span>
                      </div>
                      <Progress value={100} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>🤖 OCR with Gemini 1.5 Pro...</span>
                        <span>Processing...</span>
                      </div>
                      <Progress value={75} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>🧠 Compliance analysis with GPT-4...</span>
                        <span>Queued</span>
                      </div>
                      <Progress value={25} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>🔍 Final validation...</span>
                        <span>Pending</span>
                      </div>
                      <Progress value={0} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {validationResult && (
              <Tabs defaultValue="results" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="results">Validation Results</TabsTrigger>
                  <TabsTrigger value="data">Extracted Data</TabsTrigger>
                  <TabsTrigger value="corrections">Auto-Corrections</TabsTrigger>
                </TabsList>

                <TabsContent value="results" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Compliance Score</CardTitle>
                      <CardDescription>Overall invoice compliance assessment</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-3xl font-bold">{complianceScore}%</div>
                        <div className="flex space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{validCount} Valid</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <span>{warningCount} Warnings</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <X className="h-4 w-4 text-red-500" />
                            <span>{errorCount} Errors</span>
                          </div>
                        </div>
                      </div>
                      <Progress value={complianceScore} className="mb-4" />
                      <p className="text-sm text-gray-600">
                        {errorCount > 0
                          ? `${errorCount} critical issues need to be resolved before export`
                          : warningCount > 0
                            ? `${warningCount} warnings should be reviewed`
                            : "Invoice is fully compliant for export"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Detailed Validation Results</CardTitle>
                      <CardDescription>Field-by-field compliance analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {validationResult.compliance.checks.map((check: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                {check.passed ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : check.severity === 'warning' ? (
                                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                ) : (
                                  <X className="h-4 w-4 text-red-500" />
                                )}
                                <div>
                                  <h4 className="font-medium">
                                    {check.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                  </h4>
                                  <p className="text-sm text-gray-600">{check.message}</p>
                                </div>
                              </div>
                              <Badge variant={check.passed ? "default" : check.severity === 'warning' ? "secondary" : "destructive"}>
                                {check.passed ? "valid" : check.severity}
                              </Badge>
                            </div>
                            {!check.passed && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                  <strong>Requirement:</strong> {check.requirement}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="data" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Extracted Invoice Data</CardTitle>
                      <CardDescription>AI-extracted information from your invoice</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <h4 className="font-medium mb-2 flex items-center">
                          <Zap className="h-4 w-4 mr-2 text-blue-500" />
                          OCR Extracted Text (Gemini 1.5 Pro)
                        </h4>
                        <div className="bg-gray-50 border rounded-lg p-4 max-h-40 overflow-y-auto">
                          <pre className="text-sm whitespace-pre-wrap font-mono">
                            {aiProcessingResults?.extractedText || validationResult?.text || "No text extracted"}
                          </pre>
                        </div>
                        {aiProcessingResults?.confidence && (
                          <div className="mt-2 text-sm text-gray-600">
                            OCR Confidence: {(aiProcessingResults.confidence * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>

                      {/* Structured Data */}
                      {aiProcessingResults?.structuredData && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2 flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-green-500" />
                            Structured Data Extraction
                          </h4>
                          <div className="bg-gray-50 border rounded-lg p-4 max-h-40 overflow-y-auto">
                            <pre className="text-sm whitespace-pre-wrap font-mono">
                              {JSON.stringify(aiProcessingResults.structuredData, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-medium">Extracted Entities</h4>
                          {(aiProcessingResults?.entities?.length || validationResult?.entities?.length) ? (
                            <div className="space-y-3">
                              {(aiProcessingResults?.entities || validationResult?.entities || []).map(
                                (entity: { type: string; value: unknown; confidence: number }, index: number) => (
                                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="text-xs font-medium text-blue-600 uppercase">{entity.type.replace(/_/g, ' ')}</p>
                                      <p className="text-sm font-semibold">{String(entity.value)}</p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {(entity.confidence * 100).toFixed(0)}%
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No entities extracted</p>
                          )}
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-medium">Document Metadata</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Confidence:</span>
                              <span className="text-sm font-medium">{(validationResult.confidence * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Language:</span>
                              <span className="text-sm font-medium">{validationResult.metadata.language.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Pages:</span>
                              <span className="text-sm font-medium">{validationResult.metadata.pages}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Processing Time:</span>
                              <span className="text-sm font-medium">{new Date(validationResult.metadata.processingTime).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="corrections" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Auto-Corrections Available</CardTitle>
                      <CardDescription>AI-suggested corrections for identified issues</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {validationResult.corrections.length > 0 ? (
                        <div className="space-y-4">
                          {validationResult.corrections.map(
                            (correction: { message: string; suggestion: string; priority: string }, index: number) => (
                              <div key={index} className="border rounded-lg p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h4 className="font-medium mb-2">{correction.message}</h4>
                                  <p className="text-sm text-gray-600 mb-3">{correction.suggestion}</p>
                                  <Badge variant={correction.priority === 'high' ? 'destructive' : correction.priority === 'medium' ? 'secondary' : 'outline'}>
                                    {correction.priority} priority
                                  </Badge>
                                </div>
                                <Button size="sm">Apply</Button>
                              </div>
                            </div>
                          ))}

                          <div className="mt-6 flex space-x-3">
                            <Button>Apply All Corrections</Button>
                            <Button variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              Download Corrected Invoice
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Corrections Needed</h3>
                          <p className="text-sm text-gray-600">Your invoice is compliant and doesn't require any corrections.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Validation Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <span className="text-sm">AI-Powered OCR</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Compliance Checking</span>
                </div>
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm">Error Detection</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-purple-500" />
                  <span className="text-sm">Auto-Corrections</span>
                </div>
              </CardContent>
            </Card>

            {fileName && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Document</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3 mb-4">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">{fileName}</p>
                      <p className="text-sm text-gray-500">
                        {validationResult ? 'Processing complete' : 'Processing...'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Documents Validated</span>
                    <span className="font-medium">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Compliance Score</span>
                    <span className="font-medium">94%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Errors Prevented</span>
                    <span className="font-medium">2,567</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Processing Time</span>
                    <span className="font-medium">&lt; 30 seconds</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
