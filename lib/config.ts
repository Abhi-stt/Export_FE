// AI Document Analysis Configuration
export const AI_CONFIG = {
  API_KEY: process.env.NEXT_PUBLIC_AI_API_KEY || '',
  API_URL: process.env.NEXT_PUBLIC_AI_API_URL || 'https://api.openai.com/v1',
  MODEL: 'openai/gpt-4o-search-preview',
  MAX_TOKENS: 4000,
  TEMPERATURE: 0
}

// Backend API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 30000
}

// Document Processing Configuration
export const DOCUMENT_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png', '.docx']
} 