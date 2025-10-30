-- ============================================================================
-- VERIFICACIÓN DE PERMISOS DEL CALENDARIO Y CUENTAS DE SISTEMAS
-- ============================================================================

-- 1. Ver todos los permisos del calendario
SELECT
  id,
  name,
  displayName,
  resource,
  action,
  scope,
  riskLevel,
  description
FROM "Permission"
WHERE resource = 'calendar'
ORDER BY action, scope;

-- 2. Ver todos los permisos de cuentas de sistemas (Windows, QNAP, Calipso, Email)
SELECT
  id,
  name,
  displayName,
  resource,
  action,
  scope,
  riskLevel,
  description
FROM "Permission"
WHERE name LIKE 'employees:manage-%'
ORDER BY name;

-- 3. Ver permisos asignados al rol Manager
SELECT
  r.name AS role_name,
  r.level,
  p.name AS permission_name,
  p.displayName,
  p.category,
  p.riskLevel
FROM "Role" r
JOIN "RolePermission" rp ON r.id = rp."roleId"
JOIN "Permission" p ON rp."permissionId" = p.id
WHERE r.name = 'Manager'
  AND (p.resource = 'calendar' OR p.name LIKE 'employees:manage-%')
ORDER BY p.category, p.name;

-- 4. Ver permisos asignados al rol Technician
SELECT
  r.name AS role_name,
  r.level,
  p.name AS permission_name,
  p.displayName,
  p.category,
  p.riskLevel
FROM "Role" r
JOIN "RolePermission" rp ON r.id = rp."roleId"
JOIN "Permission" p ON rp."permissionId" = p.id
WHERE r.name = 'Technician'
  AND (p.resource = 'calendar' OR p.name LIKE 'employees:manage-%')
ORDER BY p.category, p.name;

-- 5. Ver permisos asignados al rol User
SELECT
  r.name AS role_name,
  r.level,
  p.name AS permission_name,
  p.displayName,
  p.category,
  p.riskLevel
FROM "Role" r
JOIN "RolePermission" rp ON r.id = rp."roleId"
JOIN "Permission" p ON rp."permissionId" = p.id
WHERE r.name = 'User'
  AND p.resource = 'calendar'
ORDER BY p.name;

-- 6. Ver todos los roles con sus permisos de calendario
SELECT
  r.name AS role_name,
  r.level,
  COUNT(DISTINCT p.id) AS calendar_permissions_count,
  STRING_AGG(DISTINCT p.name, ', ' ORDER BY p.name) AS permissions
FROM "Role" r
JOIN "RolePermission" rp ON r.id = rp."roleId"
JOIN "Permission" p ON rp."permissionId" = p.id
WHERE p.resource = 'calendar'
GROUP BY r.id, r.name, r.level
ORDER BY r.level DESC;

-- 7. Ver todos los roles con permisos de cuentas de sistemas
SELECT
  r.name AS role_name,
  r.level,
  COUNT(DISTINCT p.id) AS system_accounts_permissions_count,
  STRING_AGG(DISTINCT p.name, ', ' ORDER BY p.name) AS permissions
FROM "Role" r
JOIN "RolePermission" rp ON r.id = rp."roleId"
JOIN "Permission" p ON rp."permissionId" = p.id
WHERE p.name LIKE 'employees:manage-%'
GROUP BY r.id, r.name, r.level
ORDER BY r.level DESC;

-- 8. Verificar que no hay permisos duplicados
SELECT
  name,
  COUNT(*) as count
FROM "Permission"
GROUP BY name
HAVING COUNT(*) > 1;

-- 9. Ver estadísticas de permisos por riesgo
SELECT
  riskLevel,
  COUNT(*) as total_permissions
FROM "Permission"
WHERE resource = 'calendar' OR name LIKE 'employees:manage-%'
GROUP BY riskLevel
ORDER BY
  CASE riskLevel
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
    WHEN 'LOW' THEN 4
  END;

-- 10. Ver usuarios con sus roles y permisos de calendario
SELECT
  u.username,
  u.firstName,
  u.lastName,
  r.name AS role_name,
  r.level,
  COUNT(DISTINCT p.id) AS calendar_permissions_count
FROM "User" u
JOIN "UserRole" ur ON u.id = ur."userId"
JOIN "Role" r ON ur."roleId" = r.id
LEFT JOIN "RolePermission" rp ON r.id = rp."roleId"
LEFT JOIN "Permission" p ON rp."permissionId" = p.id AND p.resource = 'calendar'
WHERE u.isActive = true
GROUP BY u.id, u.username, u.firstName, u.lastName, r.name, r.level
ORDER BY r.level DESC, u.username;

-- ============================================================================
-- VERIFICACIÓN DE INTEGRIDAD
-- ============================================================================

-- 11. Verificar que todos los roles tienen al menos un permiso
SELECT
  r.name,
  COUNT(rp."permissionId") as permission_count
FROM "Role" r
LEFT JOIN "RolePermission" rp ON r.id = rp."roleId"
WHERE r.isActive = true
GROUP BY r.id, r.name
ORDER BY permission_count ASC;

-- 12. Verificar permisos activos vs inactivos
SELECT
  isActive,
  COUNT(*) as count
FROM "Permission"
WHERE resource = 'calendar' OR name LIKE 'employees:manage-%'
GROUP BY isActive;

-- 13. Ver tabla de comparación de permisos por rol
SELECT
  p.name AS permission_name,
  BOOL_OR(CASE WHEN r.name = 'SuperAdmin' THEN true ELSE false END) AS superadmin,
  BOOL_OR(CASE WHEN r.name = 'Admin' THEN true ELSE false END) AS admin,
  BOOL_OR(CASE WHEN r.name = 'Manager' THEN true ELSE false END) AS manager,
  BOOL_OR(CASE WHEN r.name = 'Technician' THEN true ELSE false END) AS technician,
  BOOL_OR(CASE WHEN r.name = 'User' THEN true ELSE false END) AS "user"
FROM "Permission" p
LEFT JOIN "RolePermission" rp ON p.id = rp."permissionId"
LEFT JOIN "Role" r ON rp."roleId" = r.id
WHERE p.resource = 'calendar' OR p.name LIKE 'employees:manage-%'
GROUP BY p.id, p.name
ORDER BY p.name;
