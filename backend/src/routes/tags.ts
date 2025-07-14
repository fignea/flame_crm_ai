import { Router } from 'express';
import { prisma } from '../prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/tags - Obtener todas las etiquetas de la empresa
router.get('/', async (req: any, res) => {
  try {
    const companyId = req.user.companyId;
    const tags = await prisma.tag.findMany({
      where: { companyId },
      orderBy: [{ attribute: 'asc' }, { value: 'asc' }],
    });
    return res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tags/attributes - Obtener todos los atributos únicos
router.get('/attributes', async (req: any, res) => {
    try {
        const companyId = req.user.companyId;
        const tags = await prisma.tag.findMany({
            where: { companyId },
            distinct: ['attribute'],
            select: {
                attribute: true,
            }
        });
        return res.json(tags.map((t: any) => t.attribute));
    } catch (error) {
        console.error('Error fetching tag attributes:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/tags - Crear una nueva etiqueta
router.post('/', async (req: any, res) => {
  try {
    const { attribute, value, color } = req.body;
    const companyId = req.user.companyId;

    if (!attribute || !value) {
      return res.status(400).json({ error: 'Attribute and value are required' });
    }

    const newTag = await prisma.tag.create({
      data: {
        attribute: attribute.trim(),
        value: value.trim(),
        color,
        companyId,
      },
    });
    return res.status(201).json(newTag);
  } catch (error: any) {
    console.error('Error creating tag:', error);
    if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Esta combinación de atributo y valor ya existe.' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tags/:id - Eliminar una etiqueta
router.delete('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    // 1. Verificar si la etiqueta existe y pertenece a la empresa
    const tag = await prisma.tag.findFirst({
        where: { id, companyId },
        include: {
            _count: {
                select: { tickets: true, contacts: true }
            }
        }
    });

    if (!tag) {
        return res.status(404).json({ error: 'Etiqueta no encontrada.' });
    }

    // 2. Verificar si la etiqueta está en uso
    if (tag._count.tickets > 0 || tag._count.contacts > 0) {
        return res.status(400).json({ error: 'No se puede eliminar una etiqueta que está en uso.' });
    }
    
    // 3. Eliminar la etiqueta
    await prisma.tag.delete({
      where: { id },
    });
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting tag:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
