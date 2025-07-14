import { Request, Response } from 'express';
import { autoMessageScheduleService } from '../services/autoMessageScheduleService';

export const autoMessageScheduleController = {
  async list(req: Request, res: Response) {
    const { connectionId } = req.query;
    const schedules = await autoMessageScheduleService.getAll(connectionId as string | undefined);
    return res.json(schedules);
  },
  async get(req: Request, res: Response) {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID requerido' });
    const schedule = await autoMessageScheduleService.getById(id);
    if (!schedule) return res.status(404).json({ error: 'No encontrado' });
    return res.json(schedule);
  },
  async create(req: Request, res: Response) {
    const data = req.body;
    if (!data.connectionId || !data.message || !data.timeRanges || !data.daysOfWeek) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    // Validar solapamiento aquí si es necesario
    const schedule = await autoMessageScheduleService.create(data);
    return res.status(201).json(schedule);
  },
  async update(req: Request, res: Response) {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID requerido' });
    const data = req.body;
    const schedule = await autoMessageScheduleService.update(id, data);
    return res.json(schedule);
  },
  async remove(req: Request, res: Response) {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID requerido' });
    await autoMessageScheduleService.delete(id);
    return res.status(204).send();
  },
  async setActive(req: Request, res: Response) {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID requerido' });
    const { isActive } = req.body;
    const schedule = await autoMessageScheduleService.setActive(id, isActive);
    return res.json(schedule);
  },
}; 