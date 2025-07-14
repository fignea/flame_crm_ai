import { Router } from 'express';
import { prisma } from '../prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Middleware de autenticación para todas las rutas de tickets
router.use(authMiddleware);

// GET /api/tickets - Obtener todos los tickets con filtros
router.get('/', async (req: any, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status, 
    priority, 
    search 
  } = req.query;
  
  const companyId = req.user.companyId;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {
    connection: {
      companyId: companyId
    }
  };

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (search) {
    where.OR = [
      { lastMessage: { contains: String(search), mode: 'insensitive' } },
      { contact: { name: { contains: String(search), mode: 'insensitive' } } },
      { tags: { some: { 
          OR: [
            { attribute: { contains: String(search), mode: 'insensitive' } },
            { value: { contains: String(search), mode: 'insensitive' } }
          ]
        } } }
    ];
  }

  try {
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        contact: { select: { id: true, name: true, avatar: true } },
        user: { select: { id: true, name: true } },
        tags: true, // La inclusión ahora es directa y trae el modelo Tag completo
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: Number(limit),
    });

    const total = await prisma.ticket.count({ where });
    
    return res.json({
      data: tickets, // No es necesario formatear los tickets
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(Number(total) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
