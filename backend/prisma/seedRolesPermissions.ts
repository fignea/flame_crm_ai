import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Definir roles del sistema
const systemRoles = [
  {
    name: 'super_admin',
    displayName: 'Super Administrador',
    description: 'Acceso completo al sistema y todas las organizaciones',
    color: '#dc2626',
    isSystemRole: true,
  },
  {
    name: 'admin',
    displayName: 'Administrador',
    description: 'Acceso completo a la organización',
    color: '#ea580c',
    isSystemRole: true,
  },
  {
    name: 'manager',
    displayName: 'Gerente',
    description: 'Gestión de equipos y supervisión',
    color: '#d97706',
    isSystemRole: true,
  },
  {
    name: 'agent',
    displayName: 'Agente',
    description: 'Gestión de tickets y conversaciones',
    color: '#16a34a',
    isSystemRole: true,
  },
  {
    name: 'guest',
    displayName: 'Invitado',
    description: 'Acceso de solo lectura limitado',
    color: '#6b7280',
    isSystemRole: true,
  },
];

// Definir permisos del sistema
const systemPermissions = [
  // Permisos de usuarios
  { name: 'users.create', module: 'users', action: 'create', description: 'Crear usuarios' },
  { name: 'users.read', module: 'users', action: 'read', description: 'Ver usuarios' },
  { name: 'users.update', module: 'users', action: 'update', description: 'Actualizar usuarios' },
  { name: 'users.delete', module: 'users', action: 'delete', description: 'Eliminar usuarios' },
  { name: 'users.invite', module: 'users', action: 'invite', description: 'Invitar usuarios' },
  { name: 'users.manage_roles', module: 'users', action: 'manage_roles', description: 'Gestionar roles de usuarios' },
  { name: 'users.view_activity', module: 'users', action: 'view_activity', description: 'Ver actividad de usuarios' },
  
  // Permisos de contactos
  { name: 'contacts.create', module: 'contacts', action: 'create', description: 'Crear contactos' },
  { name: 'contacts.read', module: 'contacts', action: 'read', description: 'Ver contactos' },
  { name: 'contacts.update', module: 'contacts', action: 'update', description: 'Actualizar contactos' },
  { name: 'contacts.delete', module: 'contacts', action: 'delete', description: 'Eliminar contactos' },
  { name: 'contacts.export', module: 'contacts', action: 'export', description: 'Exportar contactos' },
  { name: 'contacts.import', module: 'contacts', action: 'import', description: 'Importar contactos' },
  
  // Permisos de conversaciones
  { name: 'conversations.read', module: 'conversations', action: 'read', description: 'Ver conversaciones' },
  { name: 'conversations.send', module: 'conversations', action: 'send', description: 'Enviar mensajes' },
  { name: 'conversations.assign', module: 'conversations', action: 'assign', description: 'Asignar conversaciones' },
  { name: 'conversations.close', module: 'conversations', action: 'close', description: 'Cerrar conversaciones' },
  
  // Permisos de tickets
  { name: 'tickets.create', module: 'tickets', action: 'create', description: 'Crear tickets' },
  { name: 'tickets.read', module: 'tickets', action: 'read', description: 'Ver tickets' },
  { name: 'tickets.update', module: 'tickets', action: 'update', description: 'Actualizar tickets' },
  { name: 'tickets.delete', module: 'tickets', action: 'delete', description: 'Eliminar tickets' },
  { name: 'tickets.assign', module: 'tickets', action: 'assign', description: 'Asignar tickets' },
  { name: 'tickets.close', module: 'tickets', action: 'close', description: 'Cerrar tickets' },
  
  // Permisos de campañas
  { name: 'campaigns.create', module: 'campaigns', action: 'create', description: 'Crear campañas' },
  { name: 'campaigns.read', module: 'campaigns', action: 'read', description: 'Ver campañas' },
  { name: 'campaigns.update', module: 'campaigns', action: 'update', description: 'Actualizar campañas' },
  { name: 'campaigns.delete', module: 'campaigns', action: 'delete', description: 'Eliminar campañas' },
  { name: 'campaigns.send', module: 'campaigns', action: 'send', description: 'Enviar campañas' },
  
  // Permisos de bot flows
  { name: 'bot_flows.create', module: 'bot_flows', action: 'create', description: 'Crear flujos de bot' },
  { name: 'bot_flows.read', module: 'bot_flows', action: 'read', description: 'Ver flujos de bot' },
  { name: 'bot_flows.update', module: 'bot_flows', action: 'update', description: 'Actualizar flujos de bot' },
  { name: 'bot_flows.delete', module: 'bot_flows', action: 'delete', description: 'Eliminar flujos de bot' },
  { name: 'bot_flows.activate', module: 'bot_flows', action: 'activate', description: 'Activar flujos de bot' },
  
  // Permisos de configuración
  { name: 'settings.read', module: 'settings', action: 'read', description: 'Ver configuración' },
  { name: 'settings.update', module: 'settings', action: 'update', description: 'Actualizar configuración' },
  { name: 'settings.integrations', module: 'settings', action: 'integrations', description: 'Gestionar integraciones' },
  
  // Permisos de reportes
  { name: 'reports.read', module: 'reports', action: 'read', description: 'Ver reportes' },
  { name: 'reports.export', module: 'reports', action: 'export', description: 'Exportar reportes' },
  { name: 'reports.advanced', module: 'reports', action: 'advanced', description: 'Reportes avanzados' },
  
  // Permisos de conexiones
  { name: 'connections.create', module: 'connections', action: 'create', description: 'Crear conexiones' },
  { name: 'connections.read', module: 'connections', action: 'read', description: 'Ver conexiones' },
  { name: 'connections.update', module: 'connections', action: 'update', description: 'Actualizar conexiones' },
  { name: 'connections.delete', module: 'connections', action: 'delete', description: 'Eliminar conexiones' },
  
  // Permisos de etiquetas
  { name: 'tags.create', module: 'tags', action: 'create', description: 'Crear etiquetas' },
  { name: 'tags.read', module: 'tags', action: 'read', description: 'Ver etiquetas' },
  { name: 'tags.update', module: 'tags', action: 'update', description: 'Actualizar etiquetas' },
  { name: 'tags.delete', module: 'tags', action: 'delete', description: 'Eliminar etiquetas' },
];

// Definir permisos por rol
const rolePermissions = {
  super_admin: [
    // Super admin tiene todos los permisos
    ...systemPermissions.map(p => p.name),
  ],
  admin: [
    // Admin tiene todos los permisos excepto gestión de super admin
    'users.create', 'users.read', 'users.update', 'users.delete', 'users.invite', 'users.manage_roles', 'users.view_activity',
    'contacts.create', 'contacts.read', 'contacts.update', 'contacts.delete', 'contacts.export', 'contacts.import',
    'conversations.read', 'conversations.send', 'conversations.assign', 'conversations.close',
    'tickets.create', 'tickets.read', 'tickets.update', 'tickets.delete', 'tickets.assign', 'tickets.close',
    'campaigns.create', 'campaigns.read', 'campaigns.update', 'campaigns.delete', 'campaigns.send',
    'bot_flows.create', 'bot_flows.read', 'bot_flows.update', 'bot_flows.delete', 'bot_flows.activate',
    'settings.read', 'settings.update', 'settings.integrations',
    'reports.read', 'reports.export', 'reports.advanced',
    'connections.create', 'connections.read', 'connections.update', 'connections.delete',
    'tags.create', 'tags.read', 'tags.update', 'tags.delete',
  ],
  manager: [
    // Manager puede gestionar su equipo y supervisar
    'users.read', 'users.invite', 'users.view_activity',
    'contacts.create', 'contacts.read', 'contacts.update', 'contacts.export',
    'conversations.read', 'conversations.send', 'conversations.assign', 'conversations.close',
    'tickets.create', 'tickets.read', 'tickets.update', 'tickets.assign', 'tickets.close',
    'campaigns.create', 'campaigns.read', 'campaigns.update', 'campaigns.send',
    'bot_flows.read', 'bot_flows.update', 'bot_flows.activate',
    'settings.read',
    'reports.read', 'reports.export',
    'connections.read',
    'tags.create', 'tags.read', 'tags.update',
  ],
  agent: [
    // Agent puede gestionar tickets y conversaciones
    'contacts.read', 'contacts.update',
    'conversations.read', 'conversations.send',
    'tickets.create', 'tickets.read', 'tickets.update',
    'campaigns.read',
    'bot_flows.read',
    'settings.read',
    'reports.read',
    'connections.read',
    'tags.read',
  ],
  guest: [
    // Guest tiene acceso de solo lectura muy limitado
    'contacts.read',
    'conversations.read',
    'tickets.read',
    'campaigns.read',
    'reports.read',
    'tags.read',
  ],
};

export async function seedRolesPermissions() {
  console.log('🔐 Iniciando seed de roles y permisos...');

  try {
    // Crear permisos
    console.log('📝 Creando permisos...');
    const createdPermissions = new Map();
    
    for (const permission of systemPermissions) {
      const created = await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      });
      createdPermissions.set(permission.name, created);
    }
    
    console.log(`✅ ${systemPermissions.length} permisos creados`);

    // Crear roles
    console.log('👥 Creando roles...');
    const createdRoles = new Map();
    
    for (const role of systemRoles) {
      const created = await prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role,
      });
      createdRoles.set(role.name, created);
    }
    
    console.log(`✅ ${systemRoles.length} roles creados`);

    // Asignar permisos a roles
    console.log('🔗 Asignando permisos a roles...');
    
    for (const [roleName, permissions] of Object.entries(rolePermissions)) {
      const role = createdRoles.get(roleName);
      if (!role) continue;
      
      for (const permissionName of permissions) {
        const permission = createdPermissions.get(permissionName);
        if (!permission) continue;
        
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
      
      console.log(`✅ ${permissions.length} permisos asignados a ${role.displayName}`);
    }

    console.log('🎉 Seed de roles y permisos completado exitosamente');
  } catch (error) {
    console.error('❌ Error en seed de roles y permisos:', error);
    throw error;
  }
}

// Ejecutar el seed si es llamado directamente
if (require.main === module) {
  seedRolesPermissions()
    .catch((e) => {
      console.error('❌ Error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 