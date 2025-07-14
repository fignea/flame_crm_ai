import { Router, Request } from 'express';
import { BotFlowService } from '../services/botFlowService';
import { authMiddleware } from '../middleware/auth';

// Extender el tipo Request para incluir el usuario
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    companyId: string;
  };
}

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// GET /api/bot-flows - Obtener todos los flujos del usuario
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { connectionId } = req.query;
    const companyId = req.user?.companyId;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Usuario no tiene companyId' });
    }

    let flows;
    if (connectionId && typeof connectionId === 'string') {
      // Si se especifica connectionId, obtener flujos de esa conexión
      flows = await BotFlowService.getFlowsByConnection(connectionId);
    } else {
      // Si no se especifica, obtener todos los flujos de la empresa
      flows = await BotFlowService.getFlowsByCompany(companyId);
    }
    
    return res.json(flows);
  } catch (error) {
    console.error('Error obteniendo flujos de bot:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/bot-flows/:id - Obtener un flujo específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const flow = await BotFlowService.getFlowById(id);
    
    if (!flow) {
      return res.status(404).json({ error: 'Flujo no encontrado' });
    }

    return res.json(flow);
  } catch (error) {
    console.error('Error obteniendo flujo de bot:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/bot-flows - Crear un nuevo flujo
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      description,
      connectionId,
      isActive = true,
      priority = 0,
      alwaysRespond = false,
      stopOnMatch = true,
    } = req.body;

    if (!name || !connectionId) {
      return res.status(400).json({ error: 'name y connectionId son requeridos' });
    }

    // Obtener el companyId del usuario autenticado
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(400).json({ error: 'Usuario no tiene companyId' });
    }

    const flow = await BotFlowService.createFlow({
      name,
      description,
      connectionId,
      companyId,
      isActive,
      priority,
      alwaysRespond,
      stopOnMatch,
    });

    return res.status(201).json(flow);
  } catch (error) {
    console.error('Error creando flujo de bot:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/bot-flows/:id - Actualizar un flujo
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const flow = await BotFlowService.updateFlow(id, updateData);
    return res.json(flow);
  } catch (error) {
    console.error('Error actualizando flujo de bot:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/bot-flows/:id - Eliminar un flujo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await BotFlowService.deleteFlow(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando flujo de bot:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/bot-flows/:id/conditions - Agregar una condición a un flujo
router.post('/:id/conditions', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      value,
      operator = 'equals',
      caseSensitive = false,
      regexFlags,
    } = req.body;

    if (!name || !type || !value) {
      return res.status(400).json({ error: 'name, type y value son requeridos' });
    }

    const condition = await BotFlowService.addCondition(id, {
      name,
      type,
      value,
      operator,
      caseSensitive,
      regexFlags,
    });

    return res.status(201).json(condition);
  } catch (error) {
    console.error('Error agregando condición:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/bot-flows/conditions/:conditionId/responses - Agregar una respuesta a una condición
router.post('/conditions/:conditionId/responses', async (req, res) => {
  try {
    const { conditionId } = req.params;
    const {
      message,
      responseType = 'text',
      mediaUrl,
      mediaCaption,
      delay = 0,
      order = 0,
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message es requerido' });
    }

    const response = await BotFlowService.addResponse(conditionId, {
      message,
      responseType,
      mediaUrl,
      mediaCaption,
      delay,
      order,
    });

    return res.status(201).json(response);
  } catch (error) {
    console.error('Error agregando respuesta:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router; 