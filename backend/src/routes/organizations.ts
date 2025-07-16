import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { permissions } from '../middleware/permissions';
import { organizationService } from '../services/organizationService';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// GET /api/organizations - Obtener todas las organizaciones con filtros y paginación
router.get('/', permissions.contacts.read, async (req: any, res) => {
  try {
    const companyId = req.user?.companyId;
    const { page = 1, limit = 10, search, industry, companySize, city, state, country, status } = req.query;
    
    const result = await organizationService.getAll(companyId, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string,
      industry: industry as string,
      companySize: companySize as string,
      city: city as string,
      state: state as string,
      country: country as string,
      status: status as string
    });
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error getting organizations:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo organizaciones'
    });
  }
});

// GET /api/organizations/:id - Obtener una organización específica
router.get('/:id', permissions.contacts.read, async (req: any, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    
    const organization = await organizationService.getById(id, companyId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organización no encontrada'
      });
    }
    
    return res.json({
      success: true,
      data: organization
    });
  } catch (error: any) {
    console.error('Error getting organization:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo organización'
    });
  }
});

// POST /api/organizations - Crear nueva organización
router.post('/', permissions.contacts.create, async (req: any, res) => {
  try {
    const companyId = req.user?.companyId;
    const organizationData = req.body;
    
    // Validar datos requeridos
    if (!organizationData.name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la organización es requerido'
      });
    }
    
    const organization = await organizationService.create(organizationData, companyId);
    
    return res.status(201).json({
      success: true,
      data: organization,
      message: 'Organización creada exitosamente'
    });
  } catch (error: any) {
    console.error('Error creating organization:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error creando organización'
    });
  }
});

// PUT /api/organizations/:id - Actualizar organización
router.put('/:id', permissions.contacts.update, async (req: any, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    const updateData = req.body;
    
    const organization = await organizationService.update(id, companyId, updateData);
    
    return res.json({
      success: true,
      data: organization,
      message: 'Organización actualizada exitosamente'
    });
  } catch (error: any) {
    console.error('Error updating organization:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error actualizando organización'
    });
  }
});

// DELETE /api/organizations/:id - Eliminar organización (soft delete)
router.delete('/:id', permissions.contacts.delete, async (req: any, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    
    await organizationService.delete(id, companyId);
    
    return res.json({
      success: true,
      message: 'Organización eliminada exitosamente'
    });
  } catch (error: any) {
    console.error('Error deleting organization:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error eliminando organización'
    });
  }
});

// GET /api/organizations/:id/stats - Obtener estadísticas de una organización
router.get('/:id/stats', permissions.contacts.read, async (req: any, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    
    const stats = await organizationService.getStats(id, companyId);
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error getting organization stats:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo estadísticas'
    });
  }
});

// GET /api/organizations/filters/industries - Obtener industrias únicas
router.get('/filters/industries', permissions.contacts.read, async (req: any, res) => {
  try {
    const companyId = req.user?.companyId;
    const industries = await organizationService.getIndustries(companyId);
    
    return res.json({
      success: true,
      data: industries
    });
  } catch (error: any) {
    console.error('Error getting industries:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo industrias'
    });
  }
});

// GET /api/organizations/filters/sizes - Obtener tamaños de empresa únicos
router.get('/filters/sizes', permissions.contacts.read, async (req: any, res) => {
  try {
    const companyId = req.user?.companyId;
    const sizes = await organizationService.getCompanySizes(companyId);
    
    return res.json({
      success: true,
      data: sizes
    });
  } catch (error: any) {
    console.error('Error getting company sizes:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo tamaños de empresa'
    });
  }
});

export default router; 