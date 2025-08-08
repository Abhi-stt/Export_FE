// Frontend HS Code Suggestions Service
// Communicates with backend API for AI-powered HS code suggestions

import { API_CONFIG } from './config'

export interface HSCodeSuggestion {
  code: string
  description: string
  confidence: number
  category: string
  dutyRate: string
  restrictions?: string[]
  similarProducts: string[]
}

export interface HSCodeSuggestionsResponse {
  success: boolean
  data: {
    success: boolean
    suggestions: HSCodeSuggestion[]
    processingTime: number
  }
  message: string
}

class HSCodeSuggestionsService {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_URL}/hs-code-suggestions`
  }

  async getSuggestions(productDescription: string, additionalInfo: string = ''): Promise<HSCodeSuggestionsResponse> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/hs-codes/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          productDescription,
          additionalInfo
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Transform backend response to expected format
      return {
        success: true,
        data: {
          success: true,
          suggestions: data.suggestion?.suggestions || [],
          processingTime: data.suggestion?.processingTime || 0
        },
        message: data.message || 'HS code suggestions retrieved successfully'
      }
    } catch (error) {
      console.error('HS Code suggestions API error:', error)
      throw new Error('Failed to get HS code suggestions')
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      return response.ok
    } catch (error) {
      console.error('HS Code suggestions health check failed:', error)
      return false
    }
  }
}

export const hsCodeSuggestionsService = new HSCodeSuggestionsService() 