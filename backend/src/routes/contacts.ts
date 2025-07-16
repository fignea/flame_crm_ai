import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { permissions } from '../middleware/permissions';
import { contactService } from '../services/contactService';
import { contactImportExportService } from '../services/contactImportExportService';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

const router = Router();

// Configurar multer para manejo de archivos
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// GET /api/contacts - Obtener todos los contactos con paginación y filtros
router.get('/', async (req: any, res) => {
  try {
    const companyId = req.user?.companyId;
    const { page = 1, limit = 10, search, status, tag } = req.query;
    
    const result = await contactService.getAll(companyId, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string,
      status: status as string,
      tag: tag as string
    });
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error getting contacts:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo contactos'
    });
  }
});

// GET /api/contacts/:id - Obtener un contacto específico
router.get('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    
    const contact = await contactService.getById(id, companyId);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }
    
    return res.json({
      success: true,
      data: contact
    });
  } catch (error: any) {
    console.error('Error getting contact:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo contacto'
    });
  }
});

// POST /api/contacts - Crear nuevo contacto
router.post('/', async (req: any, res) => {
  try {
    const companyId = req.user?.companyId;
    const contactData = req.body;
    
    // Validar datos requeridos
    if (!contactData.name || !contactData.number) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y número son requeridos'
      });
    }
    
    const contact = await contactService.create({
      ...contactData,
      companyId
    });
    
    return res.status(201).json({
      success: true,
      data: contact,
      message: 'Contacto creado exitosamente'
    });
  } catch (error: any) {
    console.error('Error creating contact:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error creando contacto'
    });
  }
});

// PUT /api/contacts/:id - Actualizar contacto
router.put('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    const updateData = req.body;
    
    // Verificar que el contacto existe y pertenece a la empresa
    const existingContact = await contactService.getById(id, companyId);
    if (!existingContact) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }
    
    const contact = await contactService.update(id, companyId, updateData);
    
    return res.json({
      success: true,
      data: contact,
      message: 'Contacto actualizado exitosamente'
    });
  } catch (error: any) {
    console.error('Error updating contact:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error actualizando contacto'
    });
  }
});

// DELETE /api/contacts/:id - Eliminar contacto
router.delete('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    
    // Verificar que el contacto existe y pertenece a la empresa
    const existingContact = await contactService.getById(id, companyId);
    if (!existingContact) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }
    
    await contactService.delete(id, companyId);
    
    return res.json({
      success: true,
      message: 'Contacto eliminado exitosamente'
    });
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error eliminando contacto'
    });
  }
});

// GET /api/contacts/stats - Obtener estadísticas de contactos (TEMPORALMENTE DESACTIVADO)
router.get('/stats/overview', async (_req: any, res) => {
  try {
    // TEMPORALMENTE DESACTIVADO PARA EVITAR CRASH
    return res.json({
      success: true,
      data: {
        totalContacts: 0,
        activeContacts: 0,
        blockedContacts: 0,
        contactsThisMonth: 0,
        contactsWithTickets: 0,
        contactsWithoutTickets: 0,
        topTags: []
      }
    });
  } catch (error: any) {
    console.error('Error getting contact stats:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo estadísticas'
    });
  }
});

// POST /api/contacts/:id/tags - Agregar tags a un contacto
router.post('/:id/tags', async (req: any, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    const { tags } = req.body;
    
    if (!Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: 'Tags debe ser un array'
      });
    }
    
    const contact = await contactService.addTags(id, companyId, tags);
    
    return res.json({
      success: true,
      data: contact,
      message: 'Tags agregados exitosamente'
    });
  } catch (error: any) {
    console.error('Error adding tags:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error agregando tags'
    });
  }
});

// DELETE /api/contacts/:id/tags - Remover tags de un contacto
router.delete('/:id/tags', async (req: any, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    const { tags } = req.body;
    
    if (!Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: 'Tags debe ser un array'
      });
    }
    
    const contact = await contactService.removeTags(id, companyId, tags);
    
    return res.json({
      success: true,
      data: contact,
      message: 'Tags removidos exitosamente'
    });
  } catch (error: any) {
    console.error('Error removing tags:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error removiendo tags'
    });
  }
});

// POST /api/contacts/import/csv - Importar contactos desde CSV
router.post('/import/csv', permissions.contacts.create, upload.single('file'), async (req: any, res) => {
  try {
    const companyId = req.user?.companyId;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó archivo'
      });
    }

    // Validar formato de archivo
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      return res.status(400).json({
        success: false,
        message: 'Solo se permiten archivos CSV'
      });
    }

    const result = await contactImportExportService.importContactsFromCSV(companyId, file.path);
    
    // Limpiar archivo temporal
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error importing CSV:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error importando contactos'
    });
  }
});

// POST /api/contacts/import/json - Importar contactos desde JSON
router.post('/import/json', permissions.contacts.create, upload.single('file'), async (req: any, res) => {
  try {
    const companyId = req.user?.companyId;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó archivo'
      });
    }

    // Validar formato de archivo
    if (!file.originalname.toLowerCase().endsWith('.json')) {
      return res.status(400).json({
        success: false,
        message: 'Solo se permiten archivos JSON'
      });
    }

    const result = await contactImportExportService.importContactsFromJSON(companyId, file.path);
    
    // Limpiar archivo temporal
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error importing JSON:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error importando contactos'
    });
  }
});

// GET /api/contacts/export - Exportar contactos
router.get('/export', permissions.contacts.export, async (req: any, res) => {
  try {
    const companyId = req.user?.companyId;
    const { format = 'csv', fields, ...filters } = req.query;
    
    const exportOptions: any = {
      format: format as 'csv' | 'json',
      filters
    };
    
    if (fields) {
      exportOptions.fields = (fields as string).split(',');
    }

    const filePath = await contactImportExportService.exportContacts(companyId, exportOptions);
    
    const fileName = path.basename(filePath);
    
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    // Limpiar archivo después de enviarlo
    fileStream.on('end', () => {
      fs.unlinkSync(filePath);
    });
    
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      res.status(500).json({
        success: false,
        message: 'Error al enviar archivo'
      });
    });

  } catch (error: any) {
    console.error('Error exporting contacts:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error exportando contactos'
    });
  }
});

// GET /api/contacts/template/csv - Obtener template CSV
router.get('/template/csv', permissions.contacts.read, async (_req: any, res) => {
  try {
    const template = contactImportExportService.getCSVTemplate();
    
    res.setHeader('Content-Disposition', 'attachment; filename="contacts_template.csv"');
    res.setHeader('Content-Type', 'text/csv');
    
    res.send(template);
  } catch (error: any) {
    console.error('Error getting CSV template:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo template'
    });
  }
});

// POST /api/contacts/validate - Validar y deduplicar contactos
router.post('/validate', permissions.contacts.update, async (req: any, res) => {
  try {
    const companyId = req.user?.companyId;
    
    const result = await contactImportExportService.validateAndDeduplicateContacts(companyId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error validating contacts:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error validando contactos'
    });
  }
});

export default router;
