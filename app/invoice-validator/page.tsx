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

// AI Processing Status Enum
const AI_PROCESSING_STATUS = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  VALIDATING: 'validating',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

// AI Processing Steps
const AI_PROCESSING_STEPS = [
  { id: 'upload', name: 'Document Upload', description: 'Uploading invoice for AI processing' },
  { id: 'ocr', name: 'OCR Text Extraction', description: 'Extracting text using Gemini 1.5 Pro' },
  { id: 'compliance', name: 'Compliance Analysis', description: 'Analyzing compliance using GPT-4 Turbo' },
  { id: 'validation', name: 'Final Validation', description: 'Running comprehensive validation checks' }
];

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
  hsCodeSuggestions?: any[]
  aiProvider?: string
  processingTime?: number
}

interface AIProcessingStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  details?: string
}

export default function InvoiceValidator() {
  const { toast } = useToast()
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [aiProcessingResults, setAiProcessingResults] = useState<AIValidationResult | null>(null)
  const [aiProcessingStatus, setAiProcessingStatus] = useState<keyof typeof AI_PROCESSING_STATUS>('IDLE')
  const [processingSteps, setProcessingSteps] = useState<AIProcessingStep[]>(AI_PROCESSING_STEPS.map(step => ({
    ...step,
    status: 'pending',
    progress: 0
  })))

  const pollDocumentProcessing = async (documentId: string) => {
    return new Promise<void>((resolve, reject) => {
      let pollCount = 0;
      const maxPolls = 60; // 2 minutes with 2-second intervals
      
      const pollInterval = setInterval(async () => {
        try {
          pollCount++;
          console.log(`🔄 Polling document status (attempt ${pollCount}/${maxPolls})...`);
          
          const response = await apiClient.getDocument(documentId)
          console.log(`📡 Document status response:`, response);
          
          if (response.success !== false && response.data) {
            const document = response.data
            console.log(`📄 Document status: ${document.status}`);
            
            // Update processing steps based on document status
            if (document.status === 'processing') {
              // Update OCR step
              setProcessingSteps(prev => prev.map(step => 
                step.id === 'ocr' 
                  ? { ...step, status: 'processing', progress: 75, details: 'Extracting text with Gemini 1.5 Pro...' }
                  : step
              ));
            } else if (document.status === 'completed') {
              // All steps completed
              setProcessingSteps(prev => prev.map(step => ({
                ...step,
                status: 'completed',
                progress: 100,
                details: step.id === 'ocr' ? 'Text extraction completed' :
                         step.id === 'compliance' ? 'Compliance analysis completed' :
                         step.id === 'validation' ? 'Validation completed' : 'Step completed'
              })));
              
              // AI processing is complete
              setAiProcessingResults({
                extractedText: document.extractedText,
                confidence: document.confidence,
                entities: document.entities || [],
                structuredData: document.structuredData,
                complianceAnalysis: document.complianceAnalysis,
                complianceErrors: document.complianceErrors || [],
                complianceCorrections: document.complianceCorrections || [],
                hsCodeSuggestions: document.hsCodeSuggestions,
                aiProvider: document.aiProvider,
                processingTime: document.processingTime
              })
              
              setAiProcessingStatus('COMPLETED');
              clearInterval(pollInterval)
              resolve()
            } else if (document.status === 'error') {
              console.error('❌ Document processing failed with error status');
              setProcessingSteps(prev => prev.map(step => ({ ...step, status: 'failed', progress: 0 })));
              setAiProcessingStatus('FAILED');
              clearInterval(pollInterval)
              reject(new Error('Document processing failed with error status'))
            } else if (document.status === 'processing') {
              console.log('⏳ Document still processing...');
              // Continue polling
            } else {
              console.log(`⚠️ Unknown document status: ${document.status}`);
              // Continue polling for unknown statuses
            }
          } else {
            console.error('❌ Failed to get document status:', response);
            clearInterval(pollInterval)
            reject(new Error(`Failed to get document status: ${response.message || 'Unknown error'}`))
          }
        } catch (error) {
          console.error('❌ Error during document polling:', error);
          clearInterval(pollInterval)
          reject(error)
        }
      }, 2000) // Poll every 2 seconds
      
      // Timeout after 2 minutes
      setTimeout(() => {
        console.error('⏰ Document processing timeout after 2 minutes');
        setProcessingSteps(prev => prev.map(step => ({ ...step, status: 'failed', progress: 0 })));
        setAiProcessingStatus('FAILED');
        clearInterval(pollInterval)
        reject(new Error('Processing timeout after 2 minutes'))
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
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    console.log('🔑 Authentication check - Token present:', !!token);
    console.log('🔑 Token value:', token ? `${token.substring(0, 20)}...` : 'None');
    
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use the invoice validator. You can still upload documents, but validation requires authentication.",
        variant: "destructive",
      });
      
      // Show a helpful message about what they can do
      setValidationResult({
        success: false,
        text: "Authentication required for validation",
        confidence: 0,
        entities: [],
        compliance: {
          isValid: false,
          score: 0,
          checks: []
        },
        errors: [{
          type: 'authentication_required',
          field: 'system',
          message: 'Please log in to use the invoice validator',
          severity: 'error',
          requirement: 'Authentication is required for AI validation'
        }],
        corrections: [{
          type: 'authentication_fix',
          field: 'system',
          message: 'Log in to your account',
          suggestion: 'Please log in to access the AI validation features',
          priority: 'high'
        }],
        metadata: {
          fileName: file.name,
          confidence: 0,
          language: 'en',
          pages: 1,
          processingTime: Date.now()
        }
      });
      return;
    }

    // Reset AI processing state
    setIsValidating(true);
    setValidationResult(null);
    setAiProcessingResults(null);
    setAiProcessingStatus('UPLOADING');
    
    // Reset processing steps
    setProcessingSteps(prev => prev.map(step => ({
      ...step,
      status: 'pending',
      progress: 0,
      details: undefined
    })));
    
    // Clear any previous file
    setUploadedFile(null);
    setFileName("");
    setDocumentId(null);

    try {
      // Step 1: Upload document for AI processing
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', 'invoice');
      formData.append('description', 'Invoice validation document');



      // Test basic backend connectivity first
      try {
        console.log('🌐 Testing basic backend connectivity...');
        const basicTest = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/health`);
        console.log('🌐 Basic connectivity test result:', basicTest.status, basicTest.statusText);
      } catch (basicError) {
        console.warn('⚠️ Basic connectivity test failed:', basicError);
      }
      
      // Update upload step
      setProcessingSteps(prev => prev.map(step => 
        step.id === 'upload' 
          ? { ...step, status: 'processing', progress: 50, details: 'Uploading document...' }
          : step
      ));
      
      console.log('📤 Uploading document...');
      const uploadResponse = await apiClient.uploadDocument(formData);
      console.log('📡 Upload response:', uploadResponse);
      
      // Mark upload as completed
      setProcessingSteps(prev => prev.map(step => 
        step.id === 'upload' 
          ? { ...step, status: 'completed', progress: 100, details: 'Upload completed' }
          : step
      ));
      
      setAiProcessingStatus('PROCESSING');

      // Fix: uploadResponse.document does not exist on type ApiResponse<any>
      // Assume the document is in uploadResponse.data
      if (uploadResponse.success !== false && uploadResponse.data) {
        const docId = uploadResponse.data._id;
        console.log('✅ Document uploaded successfully, ID:', docId);
        setDocumentId(docId);

        toast({
          title: "Document Uploaded",
          description: "Starting AI processing with Gemini 1.5 Pro + GPT-4 Turbo...",
        });

        // Step 2: Poll for processing completion
        console.log('🔄 Starting document processing polling...');
        try {
          await pollDocumentProcessing(docId);
          console.log('✅ Document processing completed successfully');
          
          // Check if we have AI processing results
          if (aiProcessingResults) {
            console.log('🤖 AI processing results available:', aiProcessingResults);
            setAiProcessingStatus('COMPLETED');
          } else {
            console.log('⚠️ No AI processing results, checking document status...');
            // Try to get the document again to see final status
            const finalDocResponse = await apiClient.getDocument(docId);
            if (finalDocResponse.success && finalDocResponse.data) {
              console.log('📄 Final document status:', finalDocResponse.data);
            }
          }
        } catch (pollError) {
          console.error('❌ Document processing failed:', pollError);
          // Don't throw error immediately, try to get partial results
          console.log('🔄 Attempting to get partial results...');
          
          try {
            const partialDocResponse = await apiClient.getDocument(docId);
            if (partialDocResponse.success && partialDocResponse.data) {
              const document = partialDocResponse.data;
              console.log('📄 Retrieved partial document results:', document);
              
              // Set partial results even if processing failed
              if (document.extractedText) {
                setAiProcessingResults({
                  extractedText: document.extractedText,
                  confidence: document.confidence || 0,
                  entities: document.entities || [],
                  structuredData: document.structuredData || {},
                  complianceAnalysis: document.complianceAnalysis || {
                    isValid: false,
                    score: 0,
                    checks: []
                  },
                  complianceErrors: document.complianceErrors || [],
                  complianceCorrections: document.complianceCorrections || [],
                  hsCodeSuggestions: document.hsCodeSuggestions || [],
                  aiProvider: document.aiProvider || 'fallback',
                  processingTime: document.processingTime || Date.now()
                });
                
                setAiProcessingStatus('COMPLETED');
                console.log('✅ Set partial AI results successfully');
              }
            }
          } catch (partialError) {
            console.error('❌ Failed to get partial results:', partialError);
            throw new Error(`Document processing failed: ${pollError instanceof Error ? pollError.message : 'Unknown error'}`);
          }
        }

        // Step 3: Run validation on the processed document
        setAiProcessingStatus('VALIDATING');
        setProcessingSteps(prev => prev.map(step => 
          step.id === 'validation' 
            ? { ...step, status: 'processing', progress: 50, details: 'Running AI validation...' }
            : step
        ));
        
        console.log('🔍 Starting invoice validation for document:', docId);
        
        // Check if we have a valid token before making the API call
        const currentToken = localStorage.getItem('token');
        if (!currentToken) {
          throw new Error('Authentication token not found. Please log in again.');
        }
        
        console.log('🔑 Token found, making validation API call...');
        
        // Test backend connectivity first
        try {
          const healthResponse = await fetch('/api/health');
          if (!healthResponse.ok) {
            throw new Error(`Backend health check failed: ${healthResponse.status}`);
          }
          console.log('✅ Backend connectivity confirmed');
        } catch (healthError) {
          console.error('❌ Backend connectivity failed:', healthError);
          throw new Error('Backend server is not accessible. Please ensure your backend is running on port 5000.');
        }
        
        // Make the validation API call
        const validationResponse = await apiClient.validateInvoice(docId);
        console.log('🔍 Validation API response:', validationResponse);
        
        if (validationResponse.success && validationResponse.data) {
          console.log('✅ Invoice validation completed successfully');
          
          // Update processing steps
          setProcessingSteps(prev => prev.map(step => 
            step.id === 'validation' 
              ? { ...step, status: 'completed', progress: 100, details: 'AI validation completed' }
              : step
          ));
          
          // Set the validation result
          setValidationResult(validationResponse.data);
          
          // Set AI processing results if available
          if (validationResponse.data.aiAnalysis) {
            // setAiAnalysisMetadata(validationResponse.data.aiAnalysis); // This state variable is not defined
          }
          
          if (validationResponse.data.hsCodeSuggestions) {
            // setHsCodeSuggestions(validationResponse.data.hsCodeSuggestions); // This state variable is not defined
          }
          
          // Set completion status
          setAiProcessingStatus('COMPLETED');
          
          toast({
            title: "AI Validation Complete!",
            description: "Real-time AI validation completed successfully!",
          });
        } else {
          console.error('❌ Validation failed:', validationResponse);
          
          // Check if we have partial results from document processing
          if (aiProcessingResults && aiProcessingResults.extractedText) {
            console.log('🔄 Using partial results from document processing');
            setAiProcessingStatus('COMPLETED');
            
            toast({
              title: "Partial AI Processing Complete",
              description: "Document was processed but AI validation failed. Using partial results.",
              variant: "default",
            });
          } else {
            throw new Error(validationResponse.message || 'Validation failed');
          }
        }
      } else {
        throw new Error(uploadResponse.message || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ Invoice validation failed:', error);
      
      // Set error status
      setAiProcessingStatus('FAILED');
      setProcessingSteps(prev => prev.map(step => ({ ...step, status: 'failed', progress: 0 })));
      
      // Show single, clear error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      
      // Check if we have partial results
      if (aiProcessingResults && aiProcessingResults.extractedText) {
        toast({
          title: "Partial AI Processing Complete",
          description: "Document was processed with fallback data. Some AI features may be limited.",
          variant: "default",
        });
        
        // Set completion status for partial results
        setAiProcessingStatus('COMPLETED');
      } else {
        // Only show error toast if we have no partial results
        toast({
          title: "AI Validation Failed",
          description: `The document was uploaded but AI validation failed: ${errorMessage}`,
          variant: "destructive",
        });
      }
      
      // Add helpful guidance to console
      console.log('💡 Troubleshooting tips:');
      console.log('1. Check if you are logged in (localStorage should have a token)');
      console.log('2. Check if the backend server is running');
      console.log('3. Check the browser console for detailed error messages');
      console.log('4. Ensure your API keys are configured in the backend');
      
      // Set a minimal error result
      setValidationResult({
        success: false,
        text: "AI validation failed - see error details above",
        confidence: 0,
        entities: [],
        compliance: {
          isValid: false,
          score: 0,
          checks: []
        },
        errors: [{
          type: 'validation_failed',
          field: 'system',
          message: errorMessage,
          severity: 'error',
          requirement: 'Please check authentication and try again'
        }],
        corrections: [],
        metadata: {
          fileName: file.name,
          confidence: 0,
          language: 'en',
          pages: 1,
          processingTime: Date.now()
        }
      });
      
      // Try to get basic document info even if validation failed
      if (documentId) {
        try {
          console.log('🔄 Attempting to get basic document info...');
          const docResponse = await apiClient.getDocument(documentId);
          if (docResponse.success !== false && docResponse.data) {
            const document = docResponse.data;
            console.log('📄 Retrieved basic document info:', document);
            
            // Set basic results even if validation failed
            if (document.extractedText) {
              setAiProcessingResults({
                extractedText: document.extractedText,
                confidence: document.confidence || 0,
                entities: document.entities || [],
                structuredData: document.structuredData || {},
                complianceAnalysis: document.complianceAnalysis || {
                  isValid: false,
                  score: 0,
                  checks: []
                },
                complianceErrors: document.complianceErrors || [],
                complianceCorrections: document.complianceCorrections || [],
                hsCodeSuggestions: document.hsCodeSuggestions || [],
                aiProvider: document.aiProvider || 'fallback',
                processingTime: document.processingTime || Date.now()
              });
              
              // If we got basic results, mark as completed
              setAiProcessingStatus('COMPLETED');
              console.log('✅ Set basic document results successfully');
            }
          }
        } catch (partialError) {
          console.error('❌ Failed to get basic document info:', partialError);
          // Don't throw another error, just log it
        }
      }
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
          
          {/* Authentication Status */}
          {typeof window !== 'undefined' && !localStorage.getItem('token') && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Authentication Required
                  </p>
                  <p className="text-sm text-yellow-700">
                    Please log in to use the invoice validator. The document upload will work, but validation requires authentication.
                  </p>
                </div>
              </div>
            </div>
          )}
          


          {/* AI Processing Status */}
          {aiProcessingStatus !== 'IDLE' && (
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  aiProcessingStatus === 'UPLOADING' ? 'bg-blue-500 animate-pulse' :
                  aiProcessingStatus === 'PROCESSING' ? 'bg-yellow-500 animate-pulse' :
                  aiProcessingStatus === 'VALIDATING' ? 'bg-purple-500 animate-pulse' :
                  aiProcessingStatus === 'COMPLETED' ? 'bg-green-500' :
                  aiProcessingStatus === 'FAILED' ? 'bg-red-500' : 'bg-gray-500'
                }`}></div>
                <div>
                  <h3 className="font-medium text-purple-900">
                    {aiProcessingStatus === 'UPLOADING' ? 'AI Processing Started' :
                     aiProcessingStatus === 'PROCESSING' ? 'AI Processing in Progress...' :
                     aiProcessingStatus === 'VALIDATING' ? 'AI Validation Running...' :
                     aiProcessingStatus === 'COMPLETED' ? 'AI Analysis Complete!' :
                     aiProcessingStatus === 'FAILED' ? 'AI Processing Failed' : 'AI Processing'}
                  </h3>
                  <p className="text-sm text-purple-700">
                    {aiProcessingStatus === 'UPLOADING' ? 'Uploading document for AI processing' :
                     aiProcessingStatus === 'PROCESSING' ? 'Running OCR with Gemini 1.5 Pro + Compliance analysis with GPT-4 Turbo' :
                     aiProcessingStatus === 'VALIDATING' ? 'Executing final validation checks' :
                     aiProcessingStatus === 'COMPLETED' ? 'Real-time AI validation completed successfully' :
                     aiProcessingStatus === 'FAILED' ? 'Please check console for error details and try again' : 'Preparing AI processing'}
                  </p>
                  
                  {/* Show fallback status if using fallback data */}
                  {aiProcessingResults && aiProcessingResults.aiProvider === 'fallback' && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      <strong>Note:</strong> Using fallback data due to AI service limitations. Some features may be limited.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Troubleshooting Guide */}
          {aiProcessingStatus === 'FAILED' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800">Troubleshooting Guide</h3>
                  <div className="mt-2 text-sm text-red-700 space-y-1">
                    <p>• <strong>Authentication:</strong> Make sure you are logged in</p>
                    <p>• <strong>Backend Server:</strong> Ensure backend is running on port 5000</p>
                    <p>• <strong>API Keys:</strong> Check if OpenAI/Gemini API keys are configured</p>
                    <p>• <strong>Console:</strong> Check browser console for detailed error messages</p>
                    <p>• <strong>Quick Fix:</strong> Try refreshing the page and logging in again</p>
                  </div>
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> If you see "Document uploaded successfully" error, it means the upload worked but validation failed. 
                      This usually indicates a backend connectivity or authentication issue.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {!fileName && !isValidating && (
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
                      
                      {/* Authentication notice */}
                      {typeof window !== 'undefined' && !localStorage.getItem('token') && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700">
                            <strong>Note:</strong> You can upload documents, but AI validation requires login.
                          </p>
                          <div className="mt-2 text-xs text-blue-600">
                            <p>• Upload will work without login</p>
                            <p>• AI validation requires authentication</p>
                            <p>• Check console for detailed error messages</p>
                            <p>• Ensure backend server is running on port 5000</p>
                          </div>
                        </div>
                      )}
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

            {fileName && isValidating && (
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
                    {processingSteps.map((step, index) => (
                      <div key={step.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center space-x-2">
                            {step.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {step.status === 'processing' && <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />}
                            {step.status === 'failed' && <X className="h-4 w-4 text-red-500" />}
                            {step.status === 'pending' && <div className="w-3 h-3 rounded-full bg-gray-300" />}
                            <span>{step.name}</span>
                          </span>
                          <span className="text-xs text-gray-500">
                            {step.status === 'completed' && '✓ Complete'}
                            {step.status === 'processing' && 'Processing...'}
                            {step.status === 'failed' && 'Failed'}
                            {step.status === 'pending' && 'Pending'}
                          </span>
                        </div>
                        <Progress value={step.progress} className="h-2" />
                        {step.details && (
                          <p className="text-xs text-gray-600">{step.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show completion status when processing is done */}
            {fileName && !isValidating && aiProcessingStatus === 'COMPLETED' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    AI Processing Complete
                  </CardTitle>
                  <CardDescription>Real-time AI analysis completed successfully</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="font-medium text-green-800">{fileName}</p>
                        <p className="text-sm text-green-600">AI validation completed with real-time processing</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setFileName("");
                        setValidationResult(null);
                        setAiProcessingResults(null);
                        setAiProcessingStatus('IDLE');
                        setProcessingSteps(prev => prev.map(step => ({
                          ...step,
                          status: 'pending',
                          progress: 0,
                          details: undefined
                        })));
                      }}
                    >
                      Process New Document
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show error status when processing fails */}
            {fileName && !isValidating && aiProcessingStatus === 'FAILED' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <X className="h-5 w-5 mr-2 text-red-500" />
                    AI Processing Failed
                  </CardTitle>
                  <CardDescription>There was an issue with AI validation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                        <div>
                          <p className="font-medium text-red-800">AI Validation Error</p>
                          <p className="text-sm text-red-600">
                            The document was uploaded successfully, but AI validation failed.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Troubleshooting Steps:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Check if you are logged in (authentication required)</li>
                        <li>• Ensure backend server is running on port 5000</li>
                        <li>• Check browser console for detailed error messages</li>
                        <li>• Verify API keys are configured in backend</li>
                        <li>• Check OpenAI/Anthropic account balance</li>
                      </ul>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setFileName("");
                          setValidationResult(null);
                          setAiProcessingResults(null);
                          setAiProcessingStatus('IDLE');
                          setProcessingSteps(prev => prev.map(step => ({
                            ...step,
                            status: 'pending',
                            progress: 0,
                            details: undefined
                          })));
                        }}
                      >
                        Try Again
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          // Show console for debugging
                          console.log('🔍 Debug info for user:');
                          console.log('Current state:', {
                            fileName,
                            aiProcessingStatus,
                            processingSteps,
                            validationResult,
                            aiProcessingResults
                          });
                          alert('Check browser console (F12) for detailed debug information');
                        }}
                      >
                        Show Debug Info
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {validationResult && (
              <Tabs defaultValue="results" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="results">Validation Results</TabsTrigger>
                  <TabsTrigger value="data">Extracted Data</TabsTrigger>
                  <TabsTrigger value="corrections">Auto-Corrections</TabsTrigger>
                  <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
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

                <TabsContent value="ai-analysis" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Analysis Results</CardTitle>
                      <CardDescription>Real-time AI processing details and insights</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {aiProcessingResults ? (
                        <div className="space-y-6">
                          {/* AI Processing Summary */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">
                                {Math.round(aiProcessingResults.confidence * 100)}%
                              </div>
                              <div className="text-sm text-blue-800">Confidence Score</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">
                                {aiProcessingResults.entities?.length || 0}
                              </div>
                              <div className="text-sm text-green-800">Entities Detected</div>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                              <div className="text-2xl font-bold text-purple-600">
                                {aiProcessingResults.complianceAnalysis?.score || 0}%
                              </div>
                              <div className="text-sm text-purple-800">Compliance Score</div>
                            </div>
                            <div className="text-center p-4 bg-orange-50 rounded-lg">
                              <div className="text-2xl font-bold text-orange-600">
                                {aiProcessingResults.hsCodeSuggestions?.length || 0}
                              </div>
                              <div className="text-sm text-orange-800">HS Codes</div>
                            </div>
                          </div>

                          {/* AI Provider Info */}
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium mb-2">AI Processing Details</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Provider:</span> {aiProcessingResults.aiProvider || 'Gemini + OpenAI'}
                              </div>
                              <div>
                                <span className="font-medium">Processing Time:</span> {aiProcessingResults.processingTime ? `${Math.round(aiProcessingResults.processingTime / 1000)}s` : 'N/A'}
                              </div>
                            </div>
                          </div>

                          {/* Extracted Text Preview */}
                          {aiProcessingResults.extractedText && (
                            <div>
                              <h4 className="font-medium mb-3">Extracted Text (OCR)</h4>
                              <div className="p-4 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {aiProcessingResults.extractedText.length > 500 
                                    ? aiProcessingResults.extractedText.substring(0, 500) + '...'
                                    : aiProcessingResults.extractedText
                                  }
                                </p>
                              </div>
                            </div>
                          )}

                          {/* HS Code Suggestions */}
                          {aiProcessingResults.hsCodeSuggestions && aiProcessingResults.hsCodeSuggestions.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-4">HS Code Suggestions</h4>
                              <div className="space-y-3">
                                {aiProcessingResults.hsCodeSuggestions.map((hsCode: any, index: number) => (
                                  <div key={index} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                      <div>
                                        <h5 className="font-medium text-lg">{hsCode.code}</h5>
                                        <p className="text-sm text-gray-600">{hsCode.description}</p>
                                      </div>
                                      <div className="text-right">
                                        <Badge variant="outline" className="mb-2">
                                          {hsCode.confidence}% confidence
                                        </Badge>
                                        <div className="text-sm text-gray-500">{hsCode.category}</div>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="font-medium">Duty Rate:</span> {hsCode.dutyRate}
                                      </div>
                                      <div>
                                        <span className="font-medium">Category:</span> {hsCode.category}
                                      </div>
                                    </div>
                                    {hsCode.restrictions && hsCode.restrictions.length > 0 && (
                                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-sm text-yellow-800">
                                          <strong>Restrictions:</strong> {Array.isArray(hsCode.restrictions) ? hsCode.restrictions.join(', ') : hsCode.restrictions}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>AI analysis results will appear here after processing</p>
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
