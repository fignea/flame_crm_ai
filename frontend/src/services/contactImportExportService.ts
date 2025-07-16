import api from './api';
import { ApiResponse } from '../types/api';

export interface ImportResult {
  success: boolean;
  imported: number;
  duplicates: number;
  errors: number;
  details: {
    imported: any[];
    duplicates: any[];
    errors: any[];
  };
}

export interface ImportContact {
  name: string;
  number: string;
  email?: string;
  companyName?: string;
  position?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  birthday?: string;
  customerType?: string;
  notes?: string;
  socials?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    x?: string;
  };
}

export interface ExportOptions {
  format: 'csv' | 'json';
  fields?: string[];
  filters?: {
    search?: string;
    status?: string;
    tag?: string;
    city?: string;
    state?: string;
    country?: string;
    customerType?: string;
    organizationId?: string;
  };
}

export interface ValidationResult {
  duplicates: Array<{
    number: string;
    keep: any;
    duplicates: any[];
  }>;
  invalid: Array<{
    contact: any;
    issues: string[];
  }>;
  fixed: number;
}

export const contactImportExportService = {
  // Importar contactos desde CSV
  async importFromCSV(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<ImportResult>>('/contacts/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (!response.data.data) {
      throw new Error('Error importando contactos desde CSV');
    }

    return response.data.data;
  },

  // Importar contactos desde JSON
  async importFromJSON(contacts: ImportContact[]): Promise<ImportResult> {
    const response = await api.post<ApiResponse<ImportResult>>('/contacts/import/json', {
      contacts
    });

    if (!response.data.data) {
      throw new Error('Error importando contactos desde JSON');
    }

    return response.data.data;
  },

  // Exportar contactos
  async exportContacts(options: ExportOptions): Promise<Blob> {
    const params = new URLSearchParams();
    
    params.append('format', options.format);
    
    if (options.fields && options.fields.length > 0) {
      params.append('fields', options.fields.join(','));
    }

    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });
    }

    const response = await api.get(`/contacts/export?${params.toString()}`, {
      responseType: 'blob'
    });

    return response.data;
  },

  // Obtener template CSV
  async getCSVTemplate(): Promise<Blob> {
    const response = await api.get('/contacts/template/csv', {
      responseType: 'blob'
    });

    return response.data;
  },

  // Validar y deduplicar contactos
  async validateAndDeduplicateContacts(): Promise<ValidationResult> {
    const response = await api.post<ApiResponse<ValidationResult>>('/contacts/validate');

    if (!response.data.data) {
      throw new Error('Error validando contactos');
    }

    return response.data.data;
  },

  // Descargar archivo blob
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Leer archivo CSV como texto
  async readCSVFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Error leyendo archivo'));
        }
      };
      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsText(file);
    });
  },

  // Parsear CSV simple para preview
  parseCSVPreview(csvText: string, maxRows: number = 5): Array<{ [key: string]: string }> {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1, maxRows + 1);

    return rows.map(row => {
      const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
      const obj: { [key: string]: string } = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  },

  // Validar archivo CSV
  validateCSVFile(file: File): { isValid: boolean; error?: string } {
    // Validar tipo de archivo
    if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
      return { isValid: false, error: 'El archivo debe ser formato CSV' };
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { isValid: false, error: 'El archivo no puede ser mayor a 10MB' };
    }

    return { isValid: true };
  },

  // Validar archivo JSON
  validateJSONFile(file: File): { isValid: boolean; error?: string } {
    // Validar tipo de archivo
    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
      return { isValid: false, error: 'El archivo debe ser formato JSON' };
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { isValid: false, error: 'El archivo no puede ser mayor a 10MB' };
    }

    return { isValid: true };
  },

  // Leer archivo JSON
  async readJSONFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (e.target?.result) {
            const json = JSON.parse(e.target.result as string);
            resolve(json);
          } else {
            reject(new Error('Error leyendo archivo'));
          }
        } catch (error) {
          reject(new Error('El archivo JSON no es válido'));
        }
      };
      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsText(file);
    });
  },

  // Generar nombre de archivo para exportación
  generateExportFilename(format: 'csv' | 'json', prefix: string = 'contacts'): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${prefix}_${timestamp}.${format}`;
  },

  // Obtener campos disponibles para exportación
  getAvailableFields(): Array<{ value: string; label: string }> {
    return [
      { value: 'id', label: 'ID' },
      { value: 'name', label: 'Nombre' },
      { value: 'number', label: 'Teléfono' },
      { value: 'email', label: 'Email' },
      { value: 'companyName', label: 'Empresa' },
      { value: 'position', label: 'Cargo' },
      { value: 'address', label: 'Dirección' },
      { value: 'city', label: 'Ciudad' },
      { value: 'state', label: 'Provincia/Estado' },
      { value: 'country', label: 'País' },
      { value: 'postalCode', label: 'Código Postal' },
      { value: 'birthday', label: 'Fecha de Nacimiento' },
      { value: 'status', label: 'Estado' },
      { value: 'customerType', label: 'Tipo de Cliente' },
      { value: 'notes', label: 'Notas' },
      { value: 'isBlocked', label: 'Bloqueado' },
      { value: 'linkedin', label: 'LinkedIn' },
      { value: 'facebook', label: 'Facebook' },
      { value: 'instagram', label: 'Instagram' },
      { value: 'x', label: 'X (Twitter)' },
      { value: 'tags', label: 'Etiquetas' },
      { value: 'createdAt', label: 'Fecha de Creación' },
      { value: 'updatedAt', label: 'Fecha de Actualización' }
    ];
  },

  // Obtener formato de fecha legible
  formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}; 