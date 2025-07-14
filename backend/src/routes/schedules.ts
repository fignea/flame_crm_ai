import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ message: 'schedules endpoint' });
});

export default router;
