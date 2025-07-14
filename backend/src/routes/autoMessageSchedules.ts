import { Router } from 'express';
import { autoMessageScheduleController } from '../controllers/autoMessageScheduleController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

router.get('/', autoMessageScheduleController.list);
router.get('/:id', autoMessageScheduleController.get);
router.post('/', autoMessageScheduleController.create);
router.put('/:id', autoMessageScheduleController.update);
router.delete('/:id', autoMessageScheduleController.remove);
router.patch('/:id/activate', autoMessageScheduleController.setActive);

export default router; 