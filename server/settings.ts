import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getMaintenanceMode(): Promise<boolean> {
  const setting = await prisma.configuracaoSite.findUnique({
    where: { chave: 'maintenanceMode' },
  });
  return setting?.valor === 'true';
}

export async function setMaintenanceMode(mode: boolean): Promise<void> {
  await prisma.configuracaoSite.upsert({
    where: { chave: 'maintenanceMode' },
    update: { valor: mode.toString() },
    create: { chave: 'maintenanceMode', valor: mode.toString(), descricao: 'Modo de manutenção do site' },
  });
}
