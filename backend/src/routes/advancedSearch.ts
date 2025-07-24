import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { AdvancedSearchService } from '../services/advancedSearchService';
import { logger } from '../utils/logger';

const router = Router();
router.use(authMiddleware);

// POST /api/advanced-search - Búsqueda avanzada principal
router.post('/', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    const filters = { ...req.body, companyId };
    
    const results = await AdvancedSearchService.search(filters);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Error in advanced search:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la búsqueda avanzada'
    });
  }
});

// GET /api/advanced-search/suggestions - Obtener sugerencias de búsqueda
router.get('/suggestions', async (req: any, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.json({
        success: true,
        data: {
          suggestions: [
            'mensajes desde:ayer',
            'tipo:imagen',
            'agente:disponible',
            'ubicación:presente',
            'archivos:documentos'
          ]
        }
      });
    }
    
    // Generar sugerencias dinámicas basadas en la consulta
    const suggestions = [
      `${query} desde:ayer`,
      `${query} tipo:imagen`,
      `${query} agente:cualquiera`,
      `${query} ubicación:presente`,
      `${query} archivos:documentos`
    ];
    
    return res.json({
      success: true,
      data: { suggestions }
    });
  } catch (error) {
    logger.error('Error generating search suggestions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generando sugerencias'
    });
  }
});

// POST /api/advanced-search/export - Exportar resultados de búsqueda
router.post('/export', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    const { filters, format = 'csv' } = req.body;
    
    const filtersWithCompany = { ...filters, companyId };
    const exportData = await AdvancedSearchService.exportResults(filtersWithCompany, format);
    
    // Configurar headers para descarga
    const filename = `search_results_${new Date().toISOString().split('T')[0]}.${format}`;
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(exportData);
  } catch (error) {
    logger.error('Error exporting search results:', error);
    res.status(500).json({
      success: false,
      message: 'Error exportando resultados'
    });
  }
});

// GET /api/advanced-search/filters - Obtener opciones de filtros disponibles
router.get('/filters', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    
    // Obtener opciones dinámicas de filtros
    const [agents, connections, tags] = await Promise.all([
      // Obtener agentes disponibles
      req.prisma.user.findMany({
        where: { companyId, isActive: true },
        select: { id: true, name: true }
      }),
      // Obtener conexiones disponibles
      req.prisma.connection.findMany({
        where: { companyId },
        select: { id: true, name: true }
      }),
      // Obtener tags más comunes
      req.prisma.tag.findMany({
        where: { contact: { companyId } },
        select: { attribute: true, value: true },
        distinct: ['attribute', 'value'],
        take: 50
      })
    ]);
    
    const filterOptions = {
      agents: agents.map((agent: any) => ({
        value: agent.id,
        label: agent.name
      })),
      connections: connections.map((conn: any) => ({
        value: conn.id,
        label: conn.name
      })),
      tags: tags.map((tag: any) => ({
        value: tag.value,
        label: `${tag.attribute}: ${tag.value}`
      })),
      contentTypes: [
        { value: 'all', label: 'Todo el contenido' },
        { value: 'text', label: 'Solo texto' },
        { value: 'media', label: 'Imágenes y videos' },
        { value: 'documents', label: 'Documentos' },
        { value: 'location', label: 'Ubicaciones' }
      ],
      timeRanges: [
        { value: 'today', label: 'Hoy' },
        { value: 'yesterday', label: 'Ayer' },
        { value: 'thisWeek', label: 'Esta semana' },
        { value: 'lastWeek', label: 'Semana pasada' },
        { value: 'thisMonth', label: 'Este mes' },
        { value: 'lastMonth', label: 'Mes pasado' },
        { value: 'custom', label: 'Personalizado' }
      ],
      sortOptions: [
        { value: 'relevance', label: 'Relevancia' },
        { value: 'date', label: 'Fecha' },
        { value: 'responseTime', label: 'Tiempo de respuesta' },
        { value: 'messageCount', label: 'Número de mensajes' }
      ]
    };
    
    res.json({
      success: true,
      data: filterOptions
    });
  } catch (error) {
    logger.error('Error getting filter options:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo opciones de filtros'
    });
  }
});

// GET /api/advanced-search/stats - Obtener estadísticas de búsqueda
router.get('/stats', async (req: any, res) => {
  try {
    const { companyId } = req.user;
    
    const stats = await Promise.all([
      // Total de conversaciones
      req.prisma.conversation.count({
        where: { connection: { companyId } }
      }),
      // Total de mensajes
      req.prisma.message.count({
        where: { conversation: { connection: { companyId } } }
      }),
      // Total de contactos
      req.prisma.contact.count({
        where: { companyId }
      }),
      // Mensajes con ubicación
      req.prisma.message.count({
        where: {
          conversation: { connection: { companyId } },
          locationLatitude: { not: null }
        }
      }),
      // Mensajes con archivos
      req.prisma.message.count({
        where: {
          conversation: { connection: { companyId } },
          mediaType: { in: ['image', 'video', 'audio', 'document'] }
        }
      }),
      // Mensajes con reacciones
      req.prisma.message.count({
        where: {
          conversation: { connection: { companyId } },
          reaction: { not: null }
        }
      })
    ]);
    
    const [
      totalConversations,
      totalMessages,
      totalContacts,
      messagesWithLocation,
      messagesWithFiles,
      messagesWithReactions
    ] = stats;
    
    res.json({
      success: true,
      data: {
        totalConversations,
        totalMessages,
        totalContacts,
        messagesWithLocation,
        messagesWithFiles,
        messagesWithReactions,
        searchableFields: [
          'content',
          'contact_name',
          'contact_number',
          'contact_email',
          'location_address',
          'file_name',
          'reactions'
        ]
      }
    });
  } catch (error) {
    logger.error('Error getting search stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas'
    });
  }
});

// POST /api/advanced-search/save-filter - Guardar filtro personalizado
router.post('/save-filter', async (req: any, res) => {
  try {
    const { id: userId } = req.user;
    const { name, filters, isPublic = false } = req.body;
    
    if (!name || !filters) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y filtros son requeridos'
      });
    }
    
    // Guardar filtro en base de datos (requiere crear tabla saved_filters)
    // Por ahora, simulamos la funcionalidad
    
    return res.json({
      success: true,
      message: 'Filtro guardado exitosamente',
      data: {
        id: `filter_${Date.now()}`,
        name,
        filters,
        isPublic,
        userId,
        createdAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error saving filter:', error);
    return res.status(500).json({
      success: false,
      message: 'Error guardando filtro'
    });
  }
});

// GET /api/advanced-search/saved-filters - Obtener filtros guardados
router.get('/saved-filters', async (req: any, res) => {
  try {
    const { id: userId } = req.user;
    
    // Obtener filtros guardados del usuario
    // Por ahora, retornamos filtros de ejemplo
    const savedFilters = [
      {
        id: 'filter_1',
        name: 'Mensajes de hoy',
        filters: { dateFrom: new Date().toISOString().split('T')[0] },
        isPublic: false,
        userId,
        createdAt: new Date()
      },
      {
        id: 'filter_2',
        name: 'Conversaciones sin asignar',
        filters: { assignedTo: 'unassigned' },
        isPublic: true,
        userId,
        createdAt: new Date()
      }
    ];
    
    res.json({
      success: true,
      data: savedFilters
    });
  } catch (error) {
    logger.error('Error getting saved filters:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo filtros guardados'
    });
  }
});

export default router; 