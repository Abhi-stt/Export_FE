// AI Document Analysis Service
// Integrates with real AI services for document processing
import { AI_CONFIG } from './config'

export interface DocumentAnalysisResult {
  success: boolean
  text: string
  confidence: number
  entities: DocumentEntity[]
  validation: ValidationResult
  suggestions: Suggestion[]
  errors: ValidationError[]
  metadata: DocumentMetadata
}

export interface DocumentEntity {
  type: 'company' | 'person' | 'date' | 'amount' | 'hs_code' | 'product' | 'location'
  value: string
  confidence: number
  position: { start: number; end: number }
}

export interface ValidationResult {
  isValid: boolean
  score: number
  checks: ValidationCheck[]
}

export interface ValidationCheck {
  name: string
  passed: boolean
  message: string
  severity: 'error' | 'warning' | 'info'
}

export interface ValidationError {
  type: 'missing_field' | 'invalid_format' | 'incomplete_info' | 'compliance_issue'
  field: string
  message: string
  suggestion: string
}

export interface Suggestion {
  type: 'hs_code' | 'compliance' | 'format' | 'completion'
  message: string
  priority: 'high' | 'medium' | 'low'
}

export interface DocumentMetadata {
  documentType: 'invoice' | 'boe' | 'packing_list' | 'certificate' | 'shipping_bill' | 'other'
  confidence: number
  language: string
  pages: number
  processingTime: number
}

class AIDocumentAnalyzer {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = AI_CONFIG.API_KEY
    this.baseUrl = AI_CONFIG.API_URL
  }

  async analyzeDocument(file: File): Promise<DocumentAnalysisResult> {
    // Check if AI API is configured
    if (!this.apiKey || this.apiKey === 'your_openai_api_key_here') {
      console.warn('AI API not configured, using demo mode')
      return this.getDemoAnalysis(file)
    }

    try {
      // Step 1: Extract text using OCR
      const ocrResult = await this.performOCR(file)
      
      // Step 2: Analyze document structure and type
      const documentType = await this.classifyDocument(ocrResult.text, file.name)
      
      // Step 3: Extract entities and validate
      const entities = await this.extractEntities(ocrResult.text)
      const validation = await this.validateDocument(ocrResult.text, documentType)
      
      // Step 4: Generate suggestions and identify errors
      const suggestions = await this.generateSuggestions(ocrResult.text, documentType, entities)
      const errors = await this.identifyErrors(validation, entities, documentType)
      
      // Step 5: Compile results
      const result: DocumentAnalysisResult = {
        success: true,
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        entities,
        validation,
        suggestions,
        errors,
        metadata: {
          documentType,
          confidence: ocrResult.confidence,
          language: await this.detectLanguage(ocrResult.text),
          pages: await this.countPages(file),
          processingTime: Date.now()
        }
      }

      return result
    } catch (error) {
      console.error('AI Document Analysis failed:', error)
      return {
        success: false,
        text: '',
        confidence: 0,
        entities: [],
        validation: { isValid: false, score: 0, checks: [] },
        suggestions: [],
        errors: [{ type: 'compliance_issue', field: 'general', message: 'Analysis failed', suggestion: 'Please try again' }],
        metadata: {
          documentType: 'other',
          confidence: 0,
          language: 'en',
          pages: 1,
          processingTime: 0
        }
      }
    }
  }

  private async performOCR(file: File): Promise<{ text: string; confidence: number }> {
    // Use OpenAI's Vision API for OCR
    const formData = new FormData()
    formData.append('file', file)
    formData.append('model', AI_CONFIG.MODEL)
    formData.append('messages', JSON.stringify([
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract all text from this document. Return only the extracted text without any additional formatting or comments.'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${file.type};base64,${await this.fileToBase64(file)}`
            }
          }
        ]
      }
    ]))
    formData.append('max_tokens', AI_CONFIG.MAX_TOKENS.toString())

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error('OCR processing failed')
    }

    const data = await response.json()
    const extractedText = data.choices[0].message.content

    return {
      text: extractedText,
      confidence: 0.95 // High confidence for GPT-4 Vision
    }
  }

  private async classifyDocument(text: string, fileName: string): Promise<DocumentMetadata['documentType']> {
    const prompt = `Classify this document as one of: invoice, boe, packing_list, certificate, shipping_bill, other.
    
    Document name: ${fileName}
    Content: ${text.substring(0, 500)}
    
    Return only the classification.`

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
        temperature: AI_CONFIG.TEMPERATURE
      })
    })

    if (!response.ok) {
      return 'other'
    }

    const data = await response.json()
    const classification = data.choices[0].message.content.toLowerCase().trim()
    
    const validTypes: DocumentMetadata['documentType'][] = ['invoice', 'boe', 'packing_list', 'certificate', 'shipping_bill', 'other']
    return validTypes.includes(classification as any) ? classification as DocumentMetadata['documentType'] : 'other'
  }

  private async extractEntities(text: string): Promise<DocumentEntity[]> {
    const prompt = `Extract entities from this document text. Return as JSON array with:
    - type: company, person, date, amount, hs_code, product, location
    - value: the extracted value
    - confidence: 0-1
    - position: {start, end} character positions
    
    Text: ${text.substring(0, 1000)}
    
    Return only valid JSON array.`

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: AI_CONFIG.TEMPERATURE
      })
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    try {
      return JSON.parse(data.choices[0].message.content)
    } catch {
      return []
    }
  }

  private async validateDocument(text: string, documentType: DocumentMetadata['documentType']): Promise<ValidationResult> {
    const validationRules = this.getValidationRules(documentType)
    const checks: ValidationCheck[] = []

    for (const rule of validationRules) {
      const passed = await this.checkValidationRule(text, rule)
      checks.push({
        name: rule.name,
        passed,
        message: passed ? rule.successMessage : rule.errorMessage,
        severity: rule.severity
      })
    }

    const passedChecks = checks.filter(check => check.passed).length
    const score = (passedChecks / checks.length) * 100

    return {
      isValid: score >= 70,
      score,
      checks
    }
  }

  private getValidationRules(documentType: DocumentMetadata['documentType']) {
    const baseRules = [
      { name: 'has_content', check: (text: string) => text.length > 50, successMessage: 'Document has sufficient content', errorMessage: 'Document appears to be empty or incomplete', severity: 'error' as const },
      { name: 'has_dates', check: (text: string) => /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(text), successMessage: 'Document contains dates', errorMessage: 'Document missing date information', severity: 'warning' as const }
    ]

    const typeSpecificRules = {
      invoice: [
        { name: 'has_invoice_number', check: (text: string) => /invoice.*number|inv.*#|bill.*number/i.test(text), successMessage: 'Invoice number found', errorMessage: 'Missing invoice number', severity: 'error' as const },
        { name: 'has_amounts', check: (text: string) => /\$[\d,]+\.?\d*|\d+\.?\d*\s*(USD|INR|EUR)/i.test(text), successMessage: 'Monetary amounts found', errorMessage: 'Missing monetary amounts', severity: 'error' as const },
        { name: 'has_parties', check: (text: string) => /(buyer|seller|consignee|shipper)/i.test(text), successMessage: 'Party information found', errorMessage: 'Missing party information', severity: 'warning' as const }
      ],
      boe: [
        { name: 'has_customs_declaration', check: (text: string) => /customs|declaration|duty/i.test(text), successMessage: 'Customs declaration found', errorMessage: 'Missing customs declaration', severity: 'error' as const },
        { name: 'has_hs_codes', check: (text: string) => /\d{4}\.\d{2}\.\d{2}/.test(text), successMessage: 'HS codes found', errorMessage: 'Missing HS codes', severity: 'error' as const }
      ],
      packing_list: [
        { name: 'has_items', check: (text: string) => /item|product|description/i.test(text), successMessage: 'Item descriptions found', errorMessage: 'Missing item descriptions', severity: 'error' as const },
        { name: 'has_quantities', check: (text: string) => /quantity|qty|pieces|units/i.test(text), successMessage: 'Quantity information found', errorMessage: 'Missing quantity information', severity: 'warning' as const }
      ]
    }

    return [...baseRules, ...(typeSpecificRules[documentType] || [])]
  }

  private async checkValidationRule(text: string, rule: any): Promise<boolean> {
    return rule.check(text)
  }

  private async generateSuggestions(text: string, documentType: DocumentMetadata['documentType'], entities: DocumentEntity[]): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = []

    // HS Code suggestions
    const products = entities.filter(e => e.type === 'product')
    if (products.length > 0) {
      suggestions.push({
        type: 'hs_code',
        message: `Consider adding HS codes for products: ${products.map(p => p.value).join(', ')}`,
        priority: 'high'
      })
    }

    // Compliance suggestions based on document type
    if (documentType === 'invoice') {
      if (!text.toLowerCase().includes('gst')) {
        suggestions.push({
          type: 'compliance',
          message: 'Add GST registration number for tax compliance',
          priority: 'high'
        })
      }
    }

    if (documentType === 'boe') {
      if (!text.toLowerCase().includes('origin')) {
        suggestions.push({
          type: 'compliance',
          message: 'Include country of origin certificate',
          priority: 'high'
        })
      }
    }

    // Format suggestions
    if (text.length < 200) {
      suggestions.push({
        type: 'format',
        message: 'Document appears incomplete. Ensure all required fields are filled.',
        priority: 'medium'
      })
    }

    return suggestions
  }

  private async identifyErrors(validation: ValidationResult, entities: DocumentEntity[], documentType: DocumentMetadata['documentType']): Promise<ValidationError[]> {
    const errors: ValidationError[] = []

    // Add validation errors
    validation.checks.forEach(check => {
      if (!check.passed) {
        errors.push({
          type: check.severity === 'error' ? 'missing_field' : 'incomplete_info',
          field: check.name,
          message: check.message,
          suggestion: `Please add the missing ${check.name.replace('_', ' ')} information`
        })
      }
    })

    // Add entity-based errors
    if (documentType === 'invoice' && !entities.some(e => e.type === 'amount')) {
      errors.push({
        type: 'missing_field',
        field: 'amount',
        message: 'Missing invoice amounts',
        suggestion: 'Include all monetary amounts with currency'
      })
    }

    if (documentType === 'boe' && !entities.some(e => e.type === 'hs_code')) {
      errors.push({
        type: 'missing_field',
        field: 'hs_code',
        message: 'Missing HS codes',
        suggestion: 'Add HS codes for all products'
      })
    }

    return errors
  }

  private async detectLanguage(text: string): Promise<string> {
    // Simple language detection based on common patterns
    if (/[а-яё]/i.test(text)) return 'ru'
    if (/[一-龯]/.test(text)) return 'zh'
    if (/[あ-ん]/.test(text)) return 'ja'
    if (/[가-힣]/.test(text)) return 'ko'
    return 'en'
  }

  private async countPages(file: File): Promise<number> {
    // Simple page estimation based on file size
    const sizeInMB = file.size / (1024 * 1024)
    return Math.max(1, Math.ceil(sizeInMB * 2))
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.onerror = reject
    })
  }

  private getDemoAnalysis(file: File): DocumentAnalysisResult {
    const fileName = file.name.toLowerCase()
    let documentType: DocumentMetadata['documentType'] = 'other'
    let entities: DocumentEntity[] = []
    let errors: ValidationError[] = []
    let suggestions: Suggestion[] = []

    // Determine document type based on filename
    if (fileName.includes('invoice')) {
      documentType = 'invoice'
      entities = [
        { type: 'company', value: 'ABC Trading Co.', confidence: 0.9, position: { start: 0, end: 15 } },
        { type: 'amount', value: '$15,000.00', confidence: 0.95, position: { start: 50, end: 60 } },
        { type: 'date', value: '2024-01-15', confidence: 0.9, position: { start: 100, end: 110 } }
      ]
      errors = [
        { type: 'missing_field', field: 'gst', message: 'Missing GST registration number', suggestion: 'Add GST number for tax compliance' }
      ]
      suggestions = [
        { type: 'compliance', message: 'Add GST registration number for tax compliance', priority: 'high' },
        { type: 'hs_code', message: 'Consider adding HS codes for products', priority: 'medium' }
      ]
    } else if (fileName.includes('boe') || fileName.includes('bill')) {
      documentType = 'boe'
      entities = [
        { type: 'company', value: 'XYZ Customs', confidence: 0.9, position: { start: 0, end: 10 } },
        { type: 'hs_code', value: '8471.30.00', confidence: 0.95, position: { start: 50, end: 60 } }
      ]
      errors = [
        { type: 'missing_field', field: 'origin', message: 'Missing country of origin', suggestion: 'Include country of origin certificate' }
      ]
      suggestions = [
        { type: 'compliance', message: 'Include country of origin certificate', priority: 'high' },
        { type: 'hs_code', message: 'Verify HS codes for all items', priority: 'medium' }
      ]
    } else if (fileName.includes('packing')) {
      documentType = 'packing_list'
      entities = [
        { type: 'product', value: 'Electronics', confidence: 0.9, position: { start: 0, end: 10 } },
        { type: 'amount', value: '100 units', confidence: 0.95, position: { start: 50, end: 60 } }
      ]
      errors = [
        { type: 'missing_field', field: 'weight', message: 'Missing weight specifications', suggestion: 'Add weight and dimensions' }
      ]
      suggestions = [
        { type: 'format', message: 'Add weight and dimensions for each item', priority: 'medium' },
        { type: 'completion', message: 'Include detailed item descriptions', priority: 'low' }
      ]
    } else {
      entities = [
        { type: 'company', value: 'Demo Company', confidence: 0.8, position: { start: 0, end: 12 } }
      ]
      errors = [
        { type: 'incomplete_info', field: 'general', message: 'Document appears incomplete', suggestion: 'Ensure all required fields are filled' }
      ]
      suggestions = [
        { type: 'completion', message: 'Ensure document is complete', priority: 'medium' }
      ]
    }

    return {
      success: true,
      text: `Demo text extracted from ${file.name}. This is a simulated AI analysis result.`,
      confidence: 0.85,
      entities,
      validation: {
        isValid: errors.length === 0,
        score: errors.length === 0 ? 95 : 70,
        checks: [
          { name: 'has_content', passed: true, message: 'Document has sufficient content', severity: 'info' },
          { name: 'has_dates', passed: true, message: 'Document contains dates', severity: 'info' }
        ]
      },
      suggestions,
      errors,
      metadata: {
        documentType,
        confidence: 0.85,
        language: 'en',
        pages: Math.max(1, Math.ceil(file.size / (1024 * 1024) * 2)),
        processingTime: Date.now()
      }
    }
  }
}

export const aiDocumentAnalyzer = new AIDocumentAnalyzer() 