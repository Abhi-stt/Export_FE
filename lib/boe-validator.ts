// Frontend BOE Validator Service
// Communicates with backend BOE validation API

import { API_CONFIG } from './config';

export interface BOEValidationResult {
  field: string;
  invoiceValue: string;
  boeValue: string;
  status: 'match' | 'mismatch' | 'missing';
  variance?: string;
  suggestion?: string;
}

export interface BOEComparison {
  success: boolean;
  invoiceNumber: string;
  boeNumber: string;
  matchPercentage: number;
  overallStatus: 'passed' | 'failed' | 'warning';
  results: BOEValidationResult[];
  metadata: {
    invoiceFileName: string;
    boeFileName: string;
    processingTime: number;
    invoiceFields: number;
    boeFields: number;
  };
}

class BOEValidatorService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  async validateBOE(invoiceFile: File, boeFile: File): Promise<BOEComparison> {
    try {
      console.log('Starting BOE validation...');
      console.log('Invoice file:', invoiceFile.name);
      console.log('BOE file:', boeFile.name);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      // First, upload the invoice document
      const invoiceFormData = new FormData();
      invoiceFormData.append('document', invoiceFile);
      invoiceFormData.append('documentType', 'invoice');

      const invoiceUploadResponse = await fetch(`${this.baseURL}/documents/upload`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: invoiceFormData
      });

      if (!invoiceUploadResponse.ok) {
        throw new Error('Failed to upload invoice document');
      }

      const invoiceUploadData = await invoiceUploadResponse.json();
      const invoiceDocumentId = invoiceUploadData.document._id;

      // Then, upload the BOE document
      const boeFormData = new FormData();
      boeFormData.append('document', boeFile);
      boeFormData.append('documentType', 'boe');

      const boeUploadResponse = await fetch(`${this.baseURL}/documents/upload`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: boeFormData
      });

      if (!boeUploadResponse.ok) {
        throw new Error('Failed to upload BOE document');
      }

      const boeUploadData = await boeUploadResponse.json();
      const boeDocumentId = boeUploadData.document._id;

      // Finally, validate the BOE
      const response = await fetch(`${this.baseURL}/validation/boe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ 
          invoiceDocumentId,
          boeDocumentId 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('BOE validation completed:', data);
      
      // Transform backend response to expected format
      return {
        success: true,
        invoiceNumber: data.validation?.invoiceNumber || 'N/A',
        boeNumber: data.validation?.boeNumber || 'N/A',
        matchPercentage: data.validation?.matchPercentage || 0,
        overallStatus: data.validation?.overallStatus || 'warning',
        results: data.validation?.results || [],
        metadata: {
          invoiceFileName: invoiceFile.name,
          boeFileName: boeFile.name,
          processingTime: Date.now(),
          invoiceFields: data.validation?.invoiceFields || 0,
          boeFields: data.validation?.boeFields || 0
        }
      };
    } catch (error) {
      console.error('BOE validation failed:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/boe-validator/health`);
      return response.ok;
    } catch (error) {
      console.error('BOE validator health check failed:', error);
      return false;
    }
  }

  // Demo validation for testing
  getDemoValidation(): BOEComparison {
    return {
      success: true,
      invoiceNumber: 'INV-2024-001',
      boeNumber: 'BOE-2024-0012345',
      matchPercentage: 87,
      overallStatus: 'warning',
      results: [
        {
          field: 'Invoice Number',
          invoiceValue: 'INV-2024-001',
          boeValue: 'INV-2024-001',
          status: 'match',
        },
        {
          field: 'Invoice Date',
          invoiceValue: '15/01/2024',
          boeValue: '15/01/2024',
          status: 'match',
        },
        {
          field: 'Exporter Name',
          invoiceValue: 'ABC Exports Pvt Ltd',
          boeValue: 'ABC EXPORTS PVT LTD',
          status: 'match',
        },
        {
          field: 'Consignee',
          invoiceValue: 'Global Imports LLC',
          boeValue: 'Global Imports LLC',
          status: 'match',
        },
        {
          field: 'Total Invoice Value',
          invoiceValue: 'USD 25,487.50',
          boeValue: 'USD 25,500.00',
          status: 'mismatch',
          variance: '+$12.50',
          suggestion: 'Minor variance in total value - verify calculation',
        },
        {
          field: 'Currency',
          invoiceValue: 'USD',
          boeValue: 'USD',
          status: 'match',
        },
        {
          field: 'Port of Loading',
          invoiceValue: 'Mumbai',
          boeValue: 'INMAA',
          status: 'match',
          suggestion: 'Port codes match (Mumbai = INMAA)',
        },
        {
          field: 'Port of Discharge',
          invoiceValue: 'New York',
          boeValue: 'USNYC',
          status: 'match',
          suggestion: 'Port codes match (New York = USNYC)',
        },
        {
          field: 'HS Code - Item 1',
          invoiceValue: '6109.10.00',
          boeValue: '6109.10.00',
          status: 'match',
        },
        {
          field: 'HS Code - Item 2',
          invoiceValue: '8471.30.00',
          boeValue: '8471.30.00',
          status: 'match',
        },
        {
          field: 'HS Code - Item 3',
          invoiceValue: 'INVALID',
          boeValue: '7306.30.00',
          status: 'mismatch',
          suggestion: 'Invoice has invalid HS code, BOE shows correct code',
        },
        {
          field: 'Country of Origin',
          invoiceValue: 'Not specified',
          boeValue: 'India',
          status: 'missing',
          suggestion: 'Add country of origin to invoice',
        },
      ],
      metadata: {
        invoiceFileName: 'demo-invoice.pdf',
        boeFileName: 'demo-boe.pdf',
        processingTime: Date.now(),
        invoiceFields: 10,
        boeFields: 10,
      },
    };
  }
}

export const boeValidatorService = new BOEValidatorService(); 