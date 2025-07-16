import { PrismaClient } from '@prisma/client';
import { contactService } from './contactService';
import { normalizeNumber } from '../utils/phoneUtils';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

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
  birthday?: string;
  notes?: string;
  tags?: string;
  socials?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    x?: string;
  };
}

export interface ContactData {
  name: string;
  number: string;
  email?: string;
  companyName?: string;
  position?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  birthday?: string | Date;
  notes?: string;
  tags?: string;
  socials?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    x?: string;
  };
}

export interface DuplicateResult {
  number: string;
  keep: any;
  duplicates: any[];
}

export interface ValidationResult {
  duplicates: DuplicateResult[];
  invalid: InvalidContactResult[];
  fixed: number;
}

export interface InvalidContactResult {
  contact: any;
  issues: string[];
}

export const contactImportExportService = {
  // Importar contactos desde CSV
  async importContactsFromCSV(companyId: string, filePath: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      duplicates: 0,
      errors: 0,
      details: {
        imported: [],
        duplicates: [],
        errors: []
      }
    };

    try {
      const contacts: ImportContact[] = [];
      
      // Leer archivo CSV
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({
            mapHeaders: ({ header }: { header: string }) => header.toLowerCase().trim()
          }))
          .on('data', (row: any) => {
            contacts.push(this.parseCSVRow(row));
          })
          .on('end', resolve)
          .on('error', reject);
      });

      // Procesar cada contacto
      for (const contact of contacts) {
        try {
          // Validar datos requeridos
          if (!contact.name || !contact.number) {
            result.errors++;
            result.details.errors.push({
              data: contact,
              error: 'Nombre y número son requeridos'
            });
            continue;
          }

          // Normalizar número
          const normalizedNumber = normalizeNumber(contact.number);
          if (!normalizedNumber) {
            result.errors++;
            result.details.errors.push({
              data: contact,
              error: 'Número de teléfono inválido'
            });
            continue;
          }

          // Verificar duplicados
          const existingContact = await prisma.contact.findFirst({
            where: {
              companyId,
              number: normalizedNumber
            }
          });

          if (existingContact) {
            result.duplicates++;
            result.details.duplicates.push({
              data: contact,
              existing: existingContact
            });
            continue;
          }

          // Crear contacto
          const createdContact = await contactService.create({
            ...contact,
            number: normalizedNumber,
            birthday: contact.birthday ? new Date(contact.birthday) : undefined,
            companyId
          });

          result.imported++;
          result.details.imported.push(createdContact);

        } catch (error: any) {
          result.errors++;
          result.details.errors.push({
            data: contact,
            error: error.message
          });
        }
      }

      result.success = true;
      return result;

    } catch (error: any) {
      throw new Error(`Error procesando archivo CSV: ${error.message}`);
    }
  },

  // Importar contactos desde JSON
  async importContactsFromJSON(companyId: string, filePath: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      duplicates: 0,
      errors: 0,
      details: {
        imported: [],
        duplicates: [],
        errors: []
      }
    };

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const contacts: ImportContact[] = JSON.parse(fileContent);

      // Procesar cada contacto
      for (const contact of contacts) {
        try {
          // Validar datos requeridos
          if (!contact.name || !contact.number) {
            result.errors++;
            result.details.errors.push({
              data: contact,
              error: 'Nombre y número son requeridos'
            });
            continue;
          }

          // Normalizar número
          const normalizedNumber = normalizeNumber(contact.number);
          if (!normalizedNumber) {
            result.errors++;
            result.details.errors.push({
              data: contact,
              error: 'Número de teléfono inválido'
            });
            continue;
          }

          // Verificar duplicados
          const existingContact = await prisma.contact.findFirst({
            where: {
              companyId,
              number: normalizedNumber
            }
          });

          if (existingContact) {
            result.duplicates++;
            result.details.duplicates.push({
              data: contact,
              existing: existingContact
            });
            continue;
          }

          // Crear contacto
          const createdContact = await contactService.create({
            ...contact,
            number: normalizedNumber,
            birthday: contact.birthday ? new Date(contact.birthday) : undefined,
            companyId
          });

          result.imported++;
          result.details.imported.push(createdContact);

        } catch (error: any) {
          result.errors++;
          result.details.errors.push({
            data: contact,
            error: error.message
          });
        }
      }

      result.success = true;
      return result;

    } catch (error: any) {
      throw new Error(`Error procesando archivo JSON: ${error.message}`);
    }
  },

  // Exportar contactos
  async exportContacts(companyId: string, options: { 
    format: 'csv' | 'json';
    fields?: string[];
    filters?: any;
  }): Promise<string> {
    try {
              // Obtener contactos con filtros
        const contacts = await prisma.contact.findMany({
          where: {
            companyId,
            ...(options.filters || {})
          },
          include: {
            tags: true
          }
        });

              // Preparar datos para exportación
        const exportData = contacts.map(contact => {
          const socials = contact.socials as any;
          const exportData: any = {
            name: contact.name,
            number: contact.number,
            email: contact.email,
            companyName: contact.companyName,
            position: contact.position,
            address: contact.address,
            city: contact.city,
            state: contact.state,
            country: contact.country,
            birthday: contact.birthday,
            notes: contact.notes,
            status: contact.status,
            linkedin: socials?.linkedin,
            facebook: socials?.facebook,
            instagram: socials?.instagram,
            x: socials?.x
          };

          // Agregar tags
          if (contact.tags && contact.tags.length > 0) {
            exportData.tags = contact.tags.map((tag: any) => `${tag.name || tag.attribute}:${tag.value || ''}`).join(', ');
          }

        // Filtrar campos si se especifican
        if (options.fields && options.fields.length > 0) {
          const filteredData: any = {};
          options.fields.forEach(field => {
            if (exportData.hasOwnProperty(field)) {
              filteredData[field] = exportData[field];
            }
          });
          return filteredData;
        }

        return exportData;
      });

      // Crear archivo según formato
      const uploadsDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `contacts_export_${timestamp}.${options.format}`;
      const filePath = path.join(uploadsDir, fileName);

      if (options.format === 'csv') {
        // Exportar como CSV
        const csvWriter = createObjectCsvWriter({
          path: filePath,
          header: Object.keys(exportData[0] || {}).map(key => ({
            id: key,
            title: key.toUpperCase()
          }))
        });

        await csvWriter.writeRecords(exportData);
      } else {
        // Exportar como JSON
        fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
      }

      return filePath;

    } catch (error: any) {
      throw new Error(`Error exportando contactos: ${error.message}`);
    }
  },

  // Obtener template CSV
  getCSVTemplate(): string {
    const headers = [
      'name',
      'number',
      'email',
      'companyName',
      'position',
      'address',
      'city',
      'state',
      'country',
      'birthday',
      'notes',
      'tags',
      'linkedin',
      'facebook',
      'instagram',
      'x'
    ];

    return headers.join(',') + '\n';
  },

  // Validar y deduplicar contactos
  async validateAndDeduplicateContacts(companyId: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      duplicates: [],
      invalid: [],
      fixed: 0
    };

    try {
      // Obtener todos los contactos
      const allContacts = await prisma.contact.findMany({
        where: { companyId },
        orderBy: { createdAt: 'asc' }
      });

      // Detectar duplicados por número
      const numberMap = new Map<string, any[]>();
      
      for (const contact of allContacts) {
        const key = contact.number;
        if (!numberMap.has(key)) {
          numberMap.set(key, []);
        }
        numberMap.get(key)!.push(contact);
      }

      // Procesar duplicados
      for (const [number, contacts] of numberMap) {
        if (contacts.length > 1) {
          // Mantener el más reciente, marcar otros como duplicados
          const [keep, ...duplicates] = contacts.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          result.duplicates.push({
            number,
            keep,
            duplicates
          });
        }
      }

      // Detectar contactos con datos inválidos
      for (const contact of allContacts) {
        const issues: string[] = [];
        
        // Validar email
        if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
          issues.push('Email inválido');
        }

        if (issues.length > 0) {
          result.invalid.push({
            contact,
            issues
          });
        }
      }

      return result;

    } catch (error: any) {
      throw new Error(`Error validando contactos: ${error.message}`);
    }
  },

  // Parsear fila CSV
  parseCSVRow(row: any): ImportContact {
    return {
      name: row.name || '',
      number: row.number || row.phone || '',
      email: row.email || '',
      companyName: row.companyname || row.company || '',
      position: row.position || row.job || '',
      address: row.address || '',
      city: row.city || '',
      state: row.state || '',
      country: row.country || '',
      birthday: row.birthday || '',
      notes: row.notes || '',
      tags: row.tags || '',
      socials: {
        linkedin: row.linkedin || '',
        facebook: row.facebook || '',
        instagram: row.instagram || '',
        x: row.x || row.twitter || ''
      }
    };
  },

  // Validar archivo antes de procesar
  validateFile(filePath: string, allowedTypes: string[]): boolean {
    const fileExtension = path.extname(filePath).toLowerCase();
    return allowedTypes.includes(fileExtension);
  }
}; 