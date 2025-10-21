import { storage } from './server/storage.js';

async function setMaintenanceMode(value: boolean) {
  try {
    await storage.setConfiguracao({
      chave: 'maintenanceMode',
      valor: String(value),
      descricao: 'Define se o site está em modo de manutenção',
    });
    console.log(`Maintenance mode set to ${value}`);
  } catch (error) {
    console.error('Failed to set maintenance mode:', error);
  }
  process.exit(0);
}

const args = process.argv.slice(2);
const value = args[0] === 'true';

setMaintenanceMode(value);
