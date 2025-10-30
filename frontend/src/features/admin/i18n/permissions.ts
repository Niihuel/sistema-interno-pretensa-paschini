// Traducciones para el sistema de permisos

export const categoryTranslations: Record<string, string> = {
  'dashboard': 'Panel de Control',
  'users': 'Usuarios',
  'roles': 'Roles',
  'permissions': 'Permisos',
  'tickets': 'Tickets',
  'equipment': 'Equipos',
  'inventory': 'Inventario',
  'printers': 'Impresoras',
  'consumables': 'Consumibles',
  'employees': 'Empleados',
  'areas': 'Areas',
  'purchases': 'Compras',
  'backups': 'Respaldos',
  'technician': 'Técnico',
  'admin': 'Administración',
  'system': 'Sistema',
}

export const actionTranslations: Record<string, string> = {
  'view': 'Ver',
  'create': 'Crear',
  'update': 'Actualizar',
  'edit': 'Editar',
  'delete': 'Eliminar',
  'export': 'Exportar',
  'import': 'Importar',
  'assign': 'Asignar',
  'manage': 'Gestionar',
  'access': 'Acceder',
  'assignable': 'Asignable',
  'view-passwords': 'Ver Contraseñas',
}

export const scopeTranslations: Record<string, string> = {
  'all': 'Todos',
  'own': 'Propios',
  'team': 'Equipo',
  'department': 'Departamento',
}

export const resourceTranslations: Record<string, string> = {
  'users': 'usuarios',
  'roles': 'roles',
  'permissions': 'permisos',
  'dashboard': 'panel',
  'tickets': 'tickets',
  'equipment': 'equipos',
  'inventory': 'inventario',
  'printers': 'impresoras',
  'consumables': 'consumibles',
  'employees': 'empleados',
  'areas': 'áreas',
  'purchases': 'compras',
  'backups': 'respaldos',
  'technician': 'técnico',
  'admin': 'administración',
}

export function translateCategory(category: string): string {
  return categoryTranslations[category.toLowerCase()] || category
}

export function translateAction(action: string): string {
  return actionTranslations[action.toLowerCase()] || action
}

export function translateScope(scope: string): string {
  return scopeTranslations[scope.toLowerCase()] || scope
}

export function translateResource(resource: string): string {
  return resourceTranslations[resource.toLowerCase()] || resource
}
