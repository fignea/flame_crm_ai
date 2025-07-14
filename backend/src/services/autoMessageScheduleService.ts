import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const autoMessageScheduleService = {
  async getAll(connectionId?: string) {
    return prisma.autoMessageSchedule.findMany({
      where: connectionId ? { connectionId } : {},
      orderBy: { createdAt: 'desc' },
    });
  },
  async getById(id: string) {
    return prisma.autoMessageSchedule.findUnique({ where: { id } });
  },
  async create(data: Prisma.AutoMessageScheduleCreateInput) {
    // Validar solapamiento de horarios aquí si es necesario
    return prisma.autoMessageSchedule.create({ data });
  },
  async update(id: string, data: Prisma.AutoMessageScheduleUpdateInput) {
    // Validar solapamiento de horarios aquí si es necesario
    return prisma.autoMessageSchedule.update({ where: { id }, data });
  },
  async delete(id: string) {
    return prisma.autoMessageSchedule.delete({ where: { id } });
  },
  async setActive(id: string, isActive: boolean) {
    return prisma.autoMessageSchedule.update({ where: { id }, data: { isActive } });
  },
}; 