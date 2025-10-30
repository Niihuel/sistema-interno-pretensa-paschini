import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {

  // ============================================================================
  // 1. CREATE PERMISSIONS
  // ============================================================================

  const permissions = [
    // User Management
    { name: 'users:view:all', displayName: 'Ver Usuarios', category: 'users', resource: 'users', action: 'view', scope: 'all', riskLevel: 'LOW', description: 'Permite visualizar la lista de usuarios del sistema y sus datos básicos' },
    { name: 'users:create:all', displayName: 'Crear Usuarios', category: 'users', resource: 'users', action: 'create', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite crear nuevas cuentas de usuario y asignarles roles' },
    { name: 'users:update:all', displayName: 'Editar Usuarios', category: 'users', resource: 'users', action: 'update', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite modificar información de usuarios existentes, incluyendo roles y permisos' },
    { name: 'users:delete:all', displayName: 'Eliminar Usuarios', category: 'users', resource: 'users', action: 'delete', scope: 'all', riskLevel: 'HIGH', description: 'Permite eliminar permanentemente cuentas de usuario del sistema' },

    // Role Management
    { name: 'roles:view:all', displayName: 'Ver Roles', category: 'roles', resource: 'roles', action: 'view', scope: 'all', riskLevel: 'LOW', description: 'Permite visualizar la jerarquía de roles y sus permisos asignados' },
    { name: 'roles:create:all', displayName: 'Crear Roles', category: 'roles', resource: 'roles', action: 'create', scope: 'all', riskLevel: 'HIGH', description: 'Permite crear nuevos roles personalizados con permisos específicos' },
    { name: 'roles:update:all', displayName: 'Editar Roles', category: 'roles', resource: 'roles', action: 'update', scope: 'all', riskLevel: 'HIGH', description: 'Permite modificar roles existentes, cambiar sus permisos y configuración' },
    { name: 'roles:delete:all', displayName: 'Eliminar Roles', category: 'roles', resource: 'roles', action: 'delete', scope: 'all', riskLevel: 'CRITICAL', description: 'Permite eliminar permanentemente roles del sistema (excepto roles del sistema)' },
    { name: 'roles:assign:all', displayName: 'Asignar Roles', category: 'roles', resource: 'roles', action: 'assign', scope: 'all', riskLevel: 'HIGH', description: 'Permite asignar o remover roles a usuarios del sistema' },

    // Permission Management
    { name: 'permissions:view:all', displayName: 'Ver Permisos', category: 'permissions', resource: 'permissions', action: 'view', scope: 'all', riskLevel: 'LOW', description: 'Permite visualizar todos los permisos disponibles en el sistema' },
    { name: 'permissions:create:all', displayName: 'Crear Permisos', category: 'permissions', resource: 'permissions', action: 'create', scope: 'all', riskLevel: 'CRITICAL', description: 'Permite crear nuevos permisos personalizados en el sistema' },

    // Dashboard
    { name: 'dashboard:view:all', displayName: 'Ver Dashboard', category: 'dashboard', resource: 'dashboard', action: 'view', scope: 'all', riskLevel: 'LOW', description: 'Permite acceder al panel principal del sistema con estadísticas y métricas' },

    // Employees Management
    { name: 'employees:view:all', displayName: 'Ver Empleados', category: 'employees', resource: 'employees', action: 'view', scope: 'all', riskLevel: 'LOW', description: 'Permite visualizar la lista de empleados y su información de contacto' },
    { name: 'employees:create:all', displayName: 'Crear Empleados', category: 'employees', resource: 'employees', action: 'create', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite registrar nuevos empleados con sus datos personales y credenciales' },
    { name: 'employees:update:all', displayName: 'Editar Empleados', category: 'employees', resource: 'employees', action: 'update', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite modificar información de empleados, incluyendo contraseñas de sistemas' },
    { name: 'employees:delete:all', displayName: 'Eliminar Empleados', category: 'employees', resource: 'employees', action: 'delete', scope: 'all', riskLevel: 'HIGH', description: 'Permite eliminar registros de empleados del sistema' },
    { name: 'employees:view-passwords:all', displayName: 'Ver Contraseñas de Empleados', category: 'employees', resource: 'employees', action: 'view-passwords', scope: 'all', riskLevel: 'HIGH', description: 'Permite visualizar las contraseñas de QNAP, Calipso y Windows de los empleados' },

    // System Accounts Management (Windows, QNAP, Calipso, Email)
    { name: 'employees:manage-windows-accounts:all', displayName: 'Gestionar Cuentas Windows', category: 'employees', resource: 'employees', action: 'manage-windows-accounts', scope: 'all', riskLevel: 'HIGH', description: 'Permite crear, editar y eliminar cuentas de Windows de empleados' },
    { name: 'employees:manage-qnap-accounts:all', displayName: 'Gestionar Cuentas QNAP', category: 'employees', resource: 'employees', action: 'manage-qnap-accounts', scope: 'all', riskLevel: 'HIGH', description: 'Permite crear, editar y eliminar cuentas de QNAP de empleados' },
    { name: 'employees:manage-calipso-accounts:all', displayName: 'Gestionar Cuentas Calipso', category: 'employees', resource: 'employees', action: 'manage-calipso-accounts', scope: 'all', riskLevel: 'HIGH', description: 'Permite crear, editar y eliminar cuentas de Calipso de empleados' },
    { name: 'employees:manage-email-accounts:all', displayName: 'Gestionar Cuentas Email', category: 'employees', resource: 'employees', action: 'manage-email-accounts', scope: 'all', riskLevel: 'HIGH', description: 'Permite crear, editar y eliminar cuentas de correo electrónico de empleados' },

    // Equipment Management
    { name: 'equipment:view:all', displayName: 'Ver Equipos', category: 'equipment', resource: 'equipment', action: 'view', scope: 'all', riskLevel: 'LOW', description: 'Permite visualizar el inventario de equipos informáticos y su estado' },
    { name: 'equipment:create:all', displayName: 'Crear Equipos', category: 'equipment', resource: 'equipment', action: 'create', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite registrar nuevos equipos informáticos en el inventario' },
    { name: 'equipment:update:all', displayName: 'Editar Equipos', category: 'equipment', resource: 'equipment', action: 'update', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite actualizar información de equipos, asignaciones y estado' },
    { name: 'equipment:delete:all', displayName: 'Eliminar Equipos', category: 'equipment', resource: 'equipment', action: 'delete', scope: 'all', riskLevel: 'HIGH', description: 'Permite dar de baja equipos del inventario de forma permanente' },

    // Inventory Management
    { name: 'inventory:view:all', displayName: 'Ver Inventario', category: 'inventory', resource: 'inventory', action: 'view', scope: 'all', riskLevel: 'LOW', description: 'Permite visualizar el inventario de artículos y suministros' },
    { name: 'inventory:create:all', displayName: 'Crear Artículos de Inventario', category: 'inventory', resource: 'inventory', action: 'create', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite registrar nuevos artículos en el inventario' },
    { name: 'inventory:update:all', displayName: 'Editar Artículos de Inventario', category: 'inventory', resource: 'inventory', action: 'update', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite actualizar cantidades y datos de artículos en inventario' },
    { name: 'inventory:delete:all', displayName: 'Eliminar Artículos de Inventario', category: 'inventory', resource: 'inventory', action: 'delete', scope: 'all', riskLevel: 'HIGH', description: 'Permite eliminar artículos del inventario de forma permanente' },

    // Printers Management
    { name: 'printers:view:all', displayName: 'Ver Impresoras', category: 'printers', resource: 'printers', action: 'view', scope: 'all', riskLevel: 'LOW', description: 'Permite visualizar el registro de impresoras y su estado' },
    { name: 'printers:create:all', displayName: 'Crear Impresoras', category: 'printers', resource: 'printers', action: 'create', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite registrar nuevas impresoras en el sistema' },
    { name: 'printers:update:all', displayName: 'Editar Impresoras', category: 'printers', resource: 'printers', action: 'update', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite actualizar configuración y estado de impresoras' },
    { name: 'printers:delete:all', displayName: 'Eliminar Impresoras', category: 'printers', resource: 'printers', action: 'delete', scope: 'all', riskLevel: 'HIGH', description: 'Permite dar de baja impresoras del registro' },

    // Ticket Management
    { name: 'tickets:view:all', displayName: 'Ver Todos los Tickets', category: 'tickets', resource: 'tickets', action: 'view', scope: 'all', riskLevel: 'LOW', description: 'Permite visualizar todos los tickets de soporte del sistema' },
    { name: 'tickets:view:own', displayName: 'Ver Tickets Propios', category: 'tickets', resource: 'tickets', action: 'view', scope: 'own', riskLevel: 'LOW', description: 'Permite visualizar únicamente los tickets creados por el usuario' },
    { name: 'tickets:create:all', displayName: 'Crear Tickets', category: 'tickets', resource: 'tickets', action: 'create', scope: 'all', riskLevel: 'LOW', description: 'Permite crear nuevos tickets de soporte técnico' },
    { name: 'tickets:update:all', displayName: 'Editar Todos los Tickets', category: 'tickets', resource: 'tickets', action: 'update', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite modificar cualquier ticket, incluyendo estado y asignación' },
    { name: 'tickets:delete:all', displayName: 'Eliminar Tickets', category: 'tickets', resource: 'tickets', action: 'delete', scope: 'all', riskLevel: 'HIGH', description: 'Permite eliminar cualquier ticket del sistema' },
    { name: 'tickets:assign:all', displayName: 'Asignar Tickets', category: 'tickets', resource: 'tickets', action: 'assign', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite asignar tickets a técnicos o cambiar la asignación' },
    { name: 'tickets:delete:own', displayName: 'Eliminar Tickets Propios', category: 'tickets', resource: 'tickets', action: 'delete', scope: 'own', riskLevel: 'MEDIUM', description: 'Permite eliminar únicamente los tickets creados por el usuario' },

    // Technician Management
    { name: 'technician:assignable:all', displayName: 'Disponible como Técnico Asignable', category: 'technician', resource: 'technician', action: 'assignable', scope: 'all', riskLevel: 'LOW', description: 'Marca al usuario como técnico disponible para asignación de tickets' },

    // Purchase Requests / Purchases
    { name: 'purchases:view:all', displayName: 'Ver Compras', category: 'purchases', resource: 'purchases', action: 'view', scope: 'all', riskLevel: 'LOW', description: 'Permite visualizar el registro de compras realizadas' },
    { name: 'purchases:create:all', displayName: 'Crear Compras', category: 'purchases', resource: 'purchases', action: 'create', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite registrar nuevas órdenes de compra' },
    { name: 'purchases:update:all', displayName: 'Editar Compras', category: 'purchases', resource: 'purchases', action: 'update', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite modificar órdenes de compra existentes' },
    { name: 'purchases:delete:all', displayName: 'Eliminar Compras', category: 'purchases', resource: 'purchases', action: 'delete', scope: 'all', riskLevel: 'HIGH', description: 'Permite eliminar registros de compras' },

    // Backups Management (Sistema)
    { name: 'backups:view:all', displayName: 'Ver Respaldos', category: 'backups', resource: 'backups', action: 'view', scope: 'all', riskLevel: 'LOW', description: 'Permite visualizar el historial de respaldos de la base de datos' },
    { name: 'backups:create:all', displayName: 'Crear Respaldos', category: 'backups', resource: 'backups', action: 'create', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite generar nuevos respaldos de la base de datos' },
    { name: 'backups:update:all', displayName: 'Editar Respaldos', category: 'backups', resource: 'backups', action: 'update', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite modificar configuración de respaldos' },
    { name: 'backups:delete:all', displayName: 'Eliminar Respaldos', category: 'backups', resource: 'backups', action: 'delete', scope: 'all', riskLevel: 'HIGH', description: 'Permite eliminar archivos de respaldo almacenados' },
    { name: 'backups:download:all', displayName: 'Descargar Respaldos', category: 'backups', resource: 'backups', action: 'download', scope: 'all', riskLevel: 'HIGH', description: 'Permite descargar archivos de respaldo al equipo local' },
    { name: 'backups:restore:all', displayName: 'Restaurar Base de Datos', category: 'backups', resource: 'backups', action: 'restore', scope: 'all', riskLevel: 'CRITICAL', description: 'Permite restaurar la base de datos desde un respaldo (operación crítica)' },

    // Daily Backups Management (Registro de Backups Diarios en Discos)
    { name: 'daily_backups:view:all', displayName: 'Ver Backups Diarios', category: 'daily_backups', resource: 'daily_backups', action: 'view', scope: 'all', riskLevel: 'LOW', description: 'Permite visualizar el registro de backups diarios en discos físicos' },
    { name: 'daily_backups:view:own', displayName: 'Ver Backups Diarios Propios', category: 'daily_backups', resource: 'daily_backups', action: 'view', scope: 'own', riskLevel: 'LOW', description: 'Permite visualizar backups diarios registrados por el usuario' },
    { name: 'daily_backups:manage:all', displayName: 'Gestionar Backups Diarios', category: 'daily_backups', resource: 'daily_backups', action: 'manage', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite marcar discos como completados y gestionar el registro diario de backups' },
    { name: 'daily_backups:delete:all', displayName: 'Eliminar Configuración de Backups', category: 'daily_backups', resource: 'daily_backups', action: 'delete', scope: 'all', riskLevel: 'HIGH', description: 'Permite eliminar discos y estados de la configuración de backups diarios' },

    // Consumables - Inventory
    { name: 'consumables:view:all', displayName: 'Ver Consumibles', category: 'consumables', resource: 'consumables', action: 'view', scope: 'all', riskLevel: 'LOW', description: 'Permite visualizar el inventario de consumibles (toners, cartuchos, etc.)' },
    { name: 'consumables:create:all', displayName: 'Crear Consumibles', category: 'consumables', resource: 'consumables', action: 'create', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite registrar nuevos consumibles en el inventario' },
    { name: 'consumables:update:all', displayName: 'Editar Consumibles', category: 'consumables', resource: 'consumables', action: 'update', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite actualizar cantidades y datos de consumibles' },
    { name: 'consumables:delete:all', displayName: 'Eliminar Consumibles', category: 'consumables', resource: 'consumables', action: 'delete', scope: 'all', riskLevel: 'HIGH', description: 'Permite eliminar consumibles del registro' },

    // Consumables - Types
    { name: 'consumables:view-types:all', displayName: 'Ver Tipos de Consumibles', category: 'consumables', resource: 'consumables', action: 'view-types', scope: 'all', riskLevel: 'LOW', description: 'Permite visualizar el catálogo de tipos de consumibles' },
    { name: 'consumables:create-types:all', displayName: 'Crear Tipos de Consumibles', category: 'consumables', resource: 'consumables', action: 'create-types', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite crear nuevos tipos de consumibles en el catálogo' },
    { name: 'consumables:update-types:all', displayName: 'Editar Tipos de Consumibles', category: 'consumables', resource: 'consumables', action: 'update-types', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite editar tipos de consumibles del catálogo' },
    { name: 'consumables:delete-types:all', displayName: 'Eliminar Tipos de Consumibles', category: 'consumables', resource: 'consumables', action: 'delete-types', scope: 'all', riskLevel: 'HIGH', description: 'Permite eliminar tipos de consumibles del catálogo' },

    // Consumables - Stock Movements
    { name: 'consumables:manage-stock:all', displayName: 'Gestionar Movimientos de Stock', category: 'consumables', resource: 'consumables', action: 'manage-stock', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite registrar entradas, salidas y ajustes de stock de consumibles' },

    // Consumables - Compatibility
    { name: 'consumables:manage-compatibility:all', displayName: 'Gestionar Compatibilidad', category: 'consumables', resource: 'consumables', action: 'manage-compatibility', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite gestionar qué consumibles son compatibles con qué impresoras' },

    // Replacements
    { name: 'replacements:view:all', displayName: 'Ver Reemplazos', category: 'replacements', resource: 'replacements', action: 'view', scope: 'all', riskLevel: 'LOW', description: 'Permite visualizar el historial de reemplazos de equipos' },
    { name: 'replacements:create:all', displayName: 'Crear Reemplazos', category: 'replacements', resource: 'replacements', action: 'create', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite registrar nuevos reemplazos de equipos' },
    { name: 'replacements:update:all', displayName: 'Editar Reemplazos', category: 'replacements', resource: 'replacements', action: 'update', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite modificar registros de reemplazos' },
    { name: 'replacements:delete:all', displayName: 'Eliminar Reemplazos', category: 'replacements', resource: 'replacements', action: 'delete', scope: 'all', riskLevel: 'HIGH', description: 'Permite eliminar registros de reemplazos' },

    // Areas
    { name: 'areas:view:all', displayName: 'Ver Áreas', category: 'areas', resource: 'areas', action: 'view', scope: 'all', riskLevel: 'LOW', description: 'Permite visualizar la lista de áreas o departamentos' },
    { name: 'areas:create:all', displayName: 'Crear Áreas', category: 'areas', resource: 'areas', action: 'create', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite crear nuevas áreas o departamentos' },
    { name: 'areas:update:all', displayName: 'Editar Áreas', category: 'areas', resource: 'areas', action: 'update', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite modificar información de áreas existentes' },
    { name: 'areas:delete:all', displayName: 'Eliminar Áreas', category: 'areas', resource: 'areas', action: 'delete', scope: 'all', riskLevel: 'HIGH', description: 'Permite eliminar áreas o departamentos' },

    // Zones
    { name: 'zones:view:all', displayName: 'Ver Zonas', category: 'zones', resource: 'zones', action: 'view', scope: 'all', riskLevel: 'LOW', description: 'Permite visualizar la lista de zonas dentro de las áreas' },
    { name: 'zones:create:all', displayName: 'Crear Zonas', category: 'zones', resource: 'zones', action: 'create', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite crear nuevas zonas dentro de áreas' },
    { name: 'zones:update:all', displayName: 'Editar Zonas', category: 'zones', resource: 'zones', action: 'update', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite modificar información de zonas existentes' },
    { name: 'zones:delete:all', displayName: 'Eliminar Zonas', category: 'zones', resource: 'zones', action: 'delete', scope: 'all', riskLevel: 'HIGH', description: 'Permite eliminar zonas de las áreas' },

    // Calendar & Events
    { name: 'calendar:view:all', displayName: 'Ver Calendario', category: 'calendar', resource: 'calendar', action: 'view', scope: 'all', riskLevel: 'LOW', description: 'Permite visualizar todos los eventos y actividades programadas' },
    { name: 'calendar:view:own', displayName: 'Ver Calendario Personal', category: 'calendar', resource: 'calendar', action: 'view', scope: 'own', riskLevel: 'LOW', description: 'Permite visualizar eventos donde el usuario es organizador o participante' },
    { name: 'calendar:create:all', displayName: 'Crear Eventos', category: 'calendar', resource: 'calendar', action: 'create', scope: 'all', riskLevel: 'LOW', description: 'Permite crear nuevos eventos en el calendario corporativo' },
    { name: 'calendar:update:all', displayName: 'Editar Eventos', category: 'calendar', resource: 'calendar', action: 'update', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite modificar cualquier evento del calendario' },
    { name: 'calendar:update:own', displayName: 'Editar Eventos Propios', category: 'calendar', resource: 'calendar', action: 'update', scope: 'own', riskLevel: 'LOW', description: 'Permite modificar eventos creados por el usuario' },
    { name: 'calendar:delete:all', displayName: 'Eliminar Eventos', category: 'calendar', resource: 'calendar', action: 'delete', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite eliminar cualquier evento del calendario' },
    { name: 'calendar:delete:own', displayName: 'Eliminar Eventos Propios', category: 'calendar', resource: 'calendar', action: 'delete', scope: 'own', riskLevel: 'LOW', description: 'Permite eliminar eventos creados por el usuario' },

    // Admin/SuperAdmin Access
    { name: 'admin:access:all', displayName: 'Acceso de Administrador', category: 'admin', resource: 'admin', action: 'access', scope: 'all', riskLevel: 'HIGH', description: 'Permite acceder al panel de administración del sistema' },
    { name: 'admin:view:all', displayName: 'Ver Panel de Administración', category: 'admin', resource: 'admin', action: 'view', scope: 'all', riskLevel: 'HIGH', description: 'Permite visualizar todas las secciones del panel de administración' },
    { name: 'admin:dashboard:view:all', displayName: 'Ver Dashboard Admin', category: 'admin', resource: 'admin', action: 'dashboard:view', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite acceder y visualizar el dashboard administrativo con métricas y estadísticas del sistema' },
    { name: 'superadmin:access:all', displayName: 'Acceso de Super Administrador', category: 'admin', resource: 'superadmin', action: 'access', scope: 'all', riskLevel: 'CRITICAL', description: 'Acceso total al sistema con permisos máximos (nivel crítico)' },

    // Purchase Requests (with hyphen for consistency)
    { name: 'purchase-requests:view:all', displayName: 'Ver Solicitudes de Compra', category: 'purchases', resource: 'purchase-requests', action: 'view', scope: 'all', riskLevel: 'LOW', description: 'Permite visualizar solicitudes de compra pendientes y procesadas' },
    { name: 'purchase-requests:create:all', displayName: 'Crear Solicitudes de Compra', category: 'purchases', resource: 'purchase-requests', action: 'create', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite crear nuevas solicitudes de compra' },
    { name: 'purchase-requests:update:all', displayName: 'Editar Solicitudes de Compra', category: 'purchases', resource: 'purchase-requests', action: 'update', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite modificar o aprobar solicitudes de compra' },
    { name: 'purchase-requests:delete:all', displayName: 'Eliminar Solicitudes de Compra', category: 'purchases', resource: 'purchase-requests', action: 'delete', scope: 'all', riskLevel: 'HIGH', description: 'Permite eliminar solicitudes de compra' },

    // Technician Access
    { name: 'technician:access:all', displayName: 'Acceso de Técnico', category: 'access', resource: 'technician', action: 'access', scope: 'all', riskLevel: 'LOW', description: 'Permite acceder a las funciones del módulo de técnicos' },

    // Manager Access
    { name: 'manager:access:all', displayName: 'Acceso de Gerente', category: 'access', resource: 'manager', action: 'access', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite acceder a las funciones del módulo de gerencia' },

    // Reports
    { name: 'reports:view:all', displayName: 'Ver Reportes', category: 'reports', resource: 'reports', action: 'view', scope: 'all', riskLevel: 'LOW', description: 'Permite visualizar reportes y estadísticas del sistema' },
    { name: 'reports:export:all', displayName: 'Exportar Reportes', category: 'reports', resource: 'reports', action: 'export', scope: 'all', riskLevel: 'MEDIUM', description: 'Permite exportar reportes a formatos Excel y PDF' },

    // System
    { name: 'system:view:all', displayName: 'Ver Estado del Sistema', category: 'system', resource: 'system', action: 'view', scope: 'all', riskLevel: 'LOW', description: 'Permite consultar el estado del servidor y base de datos' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: {
        name: perm.name,
      },
      update: {},
      create: {
        name: perm.name,
        displayName: perm.displayName,
        description: (perm as any).description || `Permission to ${perm.action} ${perm.resource}`,
        category: perm.category,
        resource: perm.resource,
        action: perm.action,
        scope: perm.scope,
        riskLevel: perm.riskLevel,
        requiresMFA: perm.riskLevel === 'CRITICAL',
        auditRequired: ['HIGH', 'CRITICAL'].includes(perm.riskLevel),
        isActive: true,
        isSystem: true,
      },
    });
  }


  // ============================================================================
  // 2. CREATE ROLES
  // ============================================================================

  // SuperAdmin Role (Level 100)
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SuperAdmin' },
    update: {},
    create: {
      name: 'SuperAdmin',
      displayName: 'Super Administrador',
      description: 'Acceso total al sistema. Puede gestionar todo.',
      color: '#E74C3C',
      icon: '',
      level: 100,
      priority: 100,
      isSystem: true,
      isActive: true,
    },
  });

  // Assign ALL permissions to SuperAdmin
  const allPermissions = await prisma.permission.findMany({
    where: { isActive: true },
  });

  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: perm.id,
        isActive: true,
      },
    });
  }

  // Admin Role (Level 80)
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      displayName: 'Administrador',
      description: 'Administrador del sistema. Puede gestionar usuarios, equipos y tickets.',
      color: '#3498DB',
      icon: '',
      level: 80,
      priority: 80,
      isSystem: true,
      isActive: true,
    },
  });

  // Assign permissions to Admin (exclude critical role/permission management)
  const adminPermissions = await prisma.permission.findMany({
    where: {
      isActive: true,
      riskLevel: { not: 'CRITICAL' },
    },
  });

  for (const perm of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
        isActive: true,
      },
    });
  }

  // Manager Role (Level 50)
  const managerRole = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {},
    create: {
      name: 'Manager',
      displayName: 'Gerente',
      description: 'Puede gestionar equipos y tickets de su equipo.',
      color: '#F39C12',
      icon: '',
      level: 50,
      priority: 50,
      isSystem: true,
      isActive: true,
    },
  });

  // Assign limited permissions to Manager
  const managerPermissionNames = [
    'dashboard:view:all',
    'employees:view:all',
    'employees:update:all',
    'employees:view-passwords:all',
    'employees:manage-windows-accounts:all',
    'employees:manage-qnap-accounts:all',
    'employees:manage-calipso-accounts:all',
    'employees:manage-email-accounts:all',
    'equipment:view:all',
    'equipment:update:all',
    'tickets:view:all',
    'tickets:create:all',
    'tickets:update:all',
    'tickets:assign:all',
    'reports:view:all',
    'reports:export:all',
    'calendar:view:all',
    'calendar:create:all',
    'calendar:update:all',
    'calendar:delete:all',
    'areas:view:all',
    'areas:create:all',
    'areas:update:all',
    'zones:view:all',
    'zones:create:all',
    'zones:update:all',
    'printers:view:all',
    'printers:update:all',
    'consumables:view:all',
    'consumables:view-types:all',
    'consumables:manage-stock:all',
    'daily_backups:view:all',
    'daily_backups:manage:all',
    'daily_backups:delete:all',
  ];

  const managerPermissions = await prisma.permission.findMany({
    where: { name: { in: managerPermissionNames } },
  });

  for (const perm of managerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: managerRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: managerRole.id,
        permissionId: perm.id,
        isActive: true,
      },
    });
  }

  // Technician Role (Level 30)
  const technicianRole = await prisma.role.upsert({
    where: { name: 'Technician' },
    update: {},
    create: {
      name: 'Technician',
      displayName: 'Técnico',
      description: 'Técnico de soporte. Puede gestionar tickets y equipos.',
      color: '#2ECC71',
      icon: '',
      level: 30,
      priority: 30,
      isSystem: true,
      isActive: true,
    },
  });

  // Assign permissions to Technician
  const technicianPermissionNames = [
    'dashboard:view:all',
    'employees:view:all',
    'employees:update:all',
    'employees:manage-windows-accounts:all',
    'employees:manage-qnap-accounts:all',
    'employees:manage-calipso-accounts:all',
    'employees:manage-email-accounts:all',
    'equipment:view:all',
    'equipment:update:all',
    'equipment:create:all',
    'tickets:view:all',
    'tickets:update:all',
    'tickets:create:all',
    'tickets:delete:own',
    'inventory:view:all',
    'inventory:update:all',
    'areas:view:all',
    'zones:view:all',
    'printers:view:all',
    'printers:create:all',
    'printers:update:all',
    'consumables:view:all',
    'consumables:create:all',
    'consumables:update:all',
    'consumables:view-types:all',
    'consumables:create-types:all',
    'consumables:update-types:all',
    'consumables:manage-stock:all',
    'consumables:manage-compatibility:all',
    'technician:assignable:all',
    'calendar:view:all',
    'calendar:create:all',
    'calendar:update:all',
    'calendar:delete:own',
    'daily_backups:view:all',
    'daily_backups:manage:all',
  ];

  const technicianPermissions = await prisma.permission.findMany({
    where: { name: { in: technicianPermissionNames } },
  });

  for (const perm of technicianPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: technicianRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: technicianRole.id,
        permissionId: perm.id,
        isActive: true,
      },
    });
  }

  // User Role (Level 10)
  const userRole = await prisma.role.upsert({
    where: { name: 'User' },
    update: {},
    create: {
      name: 'User',
      displayName: 'Usuario',
      description: 'Usuario básico. Puede ver sus propios tickets.',
      color: '#95A5A6',
      icon: '',
      level: 10,
      priority: 10,
      isSystem: true,
      isActive: true,
    },
  });

  // Assign basic permissions to User
  const userPermissionNames = [
    'dashboard:view:all',
    'tickets:view:own',
    'tickets:create:all',
    'calendar:view:own',
    'calendar:create:all',
    'calendar:update:own',
    'calendar:delete:own',
    'daily_backups:view:own',
  ];

  const userPermissions = await prisma.permission.findMany({
    where: { name: { in: userPermissionNames } },
  });

  for (const perm of userPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: userRole.id,
        permissionId: perm.id,
        isActive: true,
      },
    });
  }


  // ============================================================================
  // 3. CREATE USERS
  // ============================================================================

  // IMPORTANTE: Las contraseñas por defecto deben cambiarse después del primer login
  // Se recomienda configurar estas credenciales mediante variables de entorno en producción

  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'ChangeMe123!';
  const nihuelPasswordHash = await bcrypt.hash(defaultPassword, 10);

  const nihuelUser = await prisma.user.upsert({
    where: { username: 'nihuel' },
    update: {},
    create: {
      username: 'nihuel',
      email: 'nihuel@sistema.local',
      passwordHash: nihuelPasswordHash,
      firstName: 'Nihuel',
      lastName: 'Usuario',
      isActive: true,
      isEmailVerified: true,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: nihuelUser.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: nihuelUser.id,
      roleId: superAdminRole.id,
      isPrimary: true,
      isActive: true,
    },
  });

  const javierPasswordHash = await bcrypt.hash(defaultPassword, 10);

  const javierUser = await prisma.user.upsert({
    where: { username: 'javier' },
    update: {},
    create: {
      username: 'javier',
      email: 'javier@sistema.local',
      passwordHash: javierPasswordHash,
      firstName: 'Javier',
      lastName: 'Usuario',
      isActive: true,
      isEmailVerified: true,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: javierUser.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: javierUser.id,
      roleId: superAdminRole.id,
      isPrimary: true,
      isActive: true,
    },
  });

  // Log para informar sobre las credenciales de inicio (solo en desarrollo)
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n[SEED] Usuarios creados con contraseña por defecto:', defaultPassword);
    console.log('[SEED] IMPORTANTE: Cambia estas contraseñas después del primer login\n');
  }


  // ============================================================================
  // ============================================================================
  // 4. CONFIGURE DAILY BACKUP DISKS, STATUSES AND NOTIFICATIONS
  // ============================================================================

  console.log('[SEED] Configuring daily backup disks, statuses and notifications...');

  const diskDefinitions = [
    { sequence: 1, name: 'Disco 1', color: '#60a5fa' },
    { sequence: 2, name: 'Disco 2', color: '#34d399' },
    { sequence: 3, name: 'Disco 3', color: '#facc15' },
    { sequence: 4, name: 'Disco 4', color: '#f87171' },
  ];

  for (const disk of diskDefinitions) {
    await prisma.backupDisk.upsert({
      where: { sequence: disk.sequence },
      update: {
        name: disk.name,
        color: disk.color,
        isActive: true,
      },
      create: {
        name: disk.name,
        sequence: disk.sequence,
        color: disk.color,
        isActive: true,
      },
    });
  }

  const statusDefinitions = [
    {
      code: 'PENDING',
      label: 'Pendiente',
      description: 'Backup pendiente de iniciar',
      sortOrder: 1,
      color: '#9ca3af',
      isFinal: false,
    },
    {
      code: 'IN_PROGRESS',
      label: 'En proceso',
      description: 'Backup en progreso',
      sortOrder: 2,
      color: '#fbbf24',
      isFinal: false,
    },
    {
      code: 'COMPLETED',
      label: 'Completado',
      description: 'Backup completado exitosamente',
      sortOrder: 3,
      color: '#34d399',
      isFinal: true,
    },
  ];

  for (const status of statusDefinitions) {
    await prisma.backupStatus.upsert({
      where: { code: status.code },
      update: {
        label: status.label,
        description: status.description,
        color: status.color,
        sortOrder: status.sortOrder,
        isFinal: status.isFinal,
        isActive: true,
      },
      create: {
        code: status.code,
        label: status.label,
        description: status.description,
        color: status.color,
        sortOrder: status.sortOrder,
        isFinal: status.isFinal,
        isActive: true,
      },
    });
  }

  const notificationDefinitions = [
    {
      code: 'MORNING_REMINDER',
      title: 'Recordatorio: Backup Diario',
      message: 'Es hora de realizar el backup diario en {{disk}}.',
      priority: 'NORMAL',
    },
    {
      code: 'AFTERNOON_ALERT',
      title: 'URGENTE: Backup Diario Pendiente',
      message: 'El backup diario sigue pendiente en {{disk}}. Faltan: {{missing}}.',
      priority: 'HIGH',
    },
    {
      code: 'COMPLETED_NOTIFICATION',
      title: 'Backup Diario Completado',
      message: 'El backup diario fue completado por {{user}} en {{disk}}.',
      priority: 'NORMAL',
    },
  ];

  for (const notification of notificationDefinitions) {
    await prisma.backupNotificationSetting.upsert({
      where: { code: notification.code },
      update: {
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        isEnabled: true,
      },
      create: {
        code: notification.code,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        isEnabled: true,
      },
    });
  }
  // ============================================================================
  // 5. CREATE CATALOG AREAS AND ZONES
  // ============================================================================

  console.log('[SEED] Creating catalog areas...');

  // Limpiar áreas existentes para evitar conflictos de código
  // console.log('[SEED] Cleaning existing areas...');
  // await prisma.catalogZone.deleteMany({});
  // await prisma.catalogArea.deleteMany({});

  const areasData = [
    'RRHH',
    'sistemas',
    'compras',
    'calidad',
    'finanzas',
    'directorio',
    'tecnica pretensa',
    'tecnica paschini',
    'ventas',
    'produccion',
    'logistica',
    'laboratorio',
    'taller pretensa',
    'taller paschini',
    'pañol',
    'mantenimiento',
    'proveedores',
    'recepcion',
    'guardia',
    'planta hormigonera',
    'comedor',
  ];

  const createdAreas: any[] = [];

  for (const areaName of areasData) {
    const area = await prisma.catalogArea.upsert({
      where: { name: areaName },
      update: {},
      create: {
        name: areaName,
      },
    });
    createdAreas.push(area);
    console.log(`[SEED] Created/Updated area: ${area.name}`);
  }

  // NOTE: CatalogZone model was removed from schema
  // console.log('[SEED] Creating catalog zones...');

  console.log('[SEED] Areas created successfully');


}

main()
  .then(() => {
    console.log('[SEED] Seed completed successfully');
  })
  .catch((e) => {
    console.error('[SEED] Seed failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



