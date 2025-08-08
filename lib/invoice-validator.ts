// Frontend Invoice Validator Service
// Communicates with backend API for AI-powered invoice validation

import { API_CONFIG } from './config'

export interface InvoiceEntity {
  type: string
  value: string | any
  confidence: number
  position: { start: number; end: number }
}

export interface ComplianceCheck {
  name: string
  passed: boolean
  message: string
  severity: 'error' | 'warning' | 'info'
  requirement: string
}

export interface InvoiceError {
  type: 'compliance_error' | 'missing_entity' | 'format_error' | 'calculation_error'
  field: string
  message: string
  severity: 'error' | 'warning'
  requirement: string
}

export interface InvoiceCorrection {
  type: 'add_field' | 'format_field' | 'recalculate' | 'compliance_fix'
  field: string
  message: string
  suggestion: string
  priority: 'high' | 'medium' | 'low'
}

export interface InvoiceValidationResult {
  success: boolean
  text: string
  confidence: number
  entities: InvoiceEntity[]
  compliance: {
    isValid: boolean
    score: number
    checks: ComplianceCheck[]
  }
  errors: InvoiceError[]
  corrections: InvoiceCorrection[]
  metadata: {
    fileName: string
    confidence: number
    language: string
    pages: number
    processingTime: number
  }
}

export interface InvoiceValidationResponse {
  success: boolean
  data: InvoiceValidationResult
  message: string
}

class InvoiceValidatorService {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_URL}/invoice-validator`
  }

  async validateInvoice(file: File): Promise<InvoiceValidationResponse> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      
      // First, upload the document
      const formData = new FormData()
      formData.append('document', file)
      formData.append('documentType', 'invoice')

      const uploadResponse = await fetch(`${API_CONFIG.BASE_URL}/documents/upload`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload document')
      }

      const uploadData = await uploadResponse.json()
      const documentId = uploadData.document._id

      // Then validate the uploaded document
      const response = await fetch(`${API_CONFIG.BASE_URL}/validation/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ documentId })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Transform backend response to expected format
      return {
        success: true,
        data: {
          success: true,
          text: data.validation?.extractedText || '',
          confidence: data.validation?.confidence || 0,
          entities: data.validation?.entities || [],
          compliance: {
            isValid: data.validation?.complianceAnalysis?.isValid || false,
            score: data.validation?.complianceAnalysis?.score || 0,
            checks: data.validation?.complianceAnalysis?.checks || []
          },
          errors: data.validation?.complianceErrors || [],
          corrections: data.validation?.complianceCorrections || [],
          metadata: {
            fileName: file.name,
            confidence: data.validation?.confidence || 0,
            language: 'en',
            pages: 1,
            processingTime: Date.now()
          }
        },
        message: data.message || 'Invoice validation completed'
      }
    } catch (error) {
      console.error('Invoice validation API error:', error)
      throw new Error(error.message || 'Failed to validate invoice')
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      return response.ok
    } catch (error) {
      console.error('Invoice validator health check failed:', error)
      return false
    }
  }
}

export const invoiceValidatorService = new InvoiceValidatorService() 