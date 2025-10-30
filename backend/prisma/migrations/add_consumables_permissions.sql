-- Script para crear/actualizar permisos RBAC para el módulo de Consumables  
-- Fecha: 2025-10-21

-- 1. Asegurar que existe el recurso 'consumables'
INSERT INTO "Resource" (name, "displayName", description, "isActive")
VALUES ('consumables', 'Consumables', 'Gestión de consumibles y stock', true)
ON CONFLICT (name) DO UPDATE SET
  "displayName" = EXCLUDED."displayName",
  description = EXCLUDED.description,
  "isActive" = true;

-- 2. Crear las acciones para consumables (view, create, update, delete)
DO $$
DECLARE
  v_resource_id INT;
BEGIN
  -- Obtener el ID del recurso
  SELECT id INTO v_resource_id FROM "Resource" WHERE name = 'consumables';

  -- Acción: VIEW
  INSERT INTO "Action" (name, "displayName", description, "resourceId", "isActive")
  VALUES ('view', 'Ver', 'Visualizar información de consumibles', v_resource_id, true)
  ON CONFLICT (name, "resourceId") DO UPDATE SET
    "displayName" = EXCLUDED."displayName",
    description = EXCLUDED.description,
    "isActive" = true;

  -- Acción: CREATE
  INSERT INTO "Action" (name, "displayName", description, "resourceId", "isActive")
  VALUES ('create', 'Crear', 'Crear nuevos consumibles', v_resource_id, true)
  ON CONFLICT (name, "resourceId") DO UPDATE SET
    "displayName" = EXCLUDED."displayName",
    description = EXCLUDED.description,
    "isActive" = true;

  -- Acción: UPDATE
  INSERT INTO "Action" (name, "displayName", description, "resourceId", "isActive")
  VALUES ('update', 'Actualizar', 'Modificar información de consumibles', v_resource_id, true)
  ON CONFLICT (name, "resourceId") DO UPDATE SET
    "displayName" = EXCLUDED."displayName",
    description = EXCLUDED.description,
    "isActive" = true;

  -- Acción: DELETE
  INSERT INTO "Action" (name, "displayName", description, "resourceId", "isActive")
  VALUES ('delete', 'Eliminar', 'Eliminar consumibles del sistema', v_resource_id, true)
  ON CONFLICT (name, "resourceId") DO UPDATE SET
    "displayName" = EXCLUDED."displayName",
    description = EXCLUDED.description,
    "isActive" = true;

END $$;

-- 3. Crear permisos para cada combinación de acción y scope
DO $$
DECLARE
  v_resource_id INT;
  v_action_view_id INT;
  v_action_create_id INT;
  v_action_update_id INT;
  v_action_delete_id INT;
  v_scope_all_id INT;
  v_scope_own_id INT;
BEGIN
  -- Obtener IDs
  SELECT id INTO v_resource_id FROM "Resource" WHERE name = 'consumables';
  SELECT id INTO v_action_view_id FROM "Action" WHERE name = 'view' AND "resourceId" = v_resource_id;
  SELECT id INTO v_action_create_id FROM "Action" WHERE name = 'create' AND "resourceId" = v_resource_id;
  SELECT id INTO v_action_update_id FROM "Action" WHERE name = 'update' AND "resourceId" = v_resource_id;
  SELECT id INTO v_action_delete_id FROM "Action" WHERE name = 'delete' AND "resourceId" = v_resource_id;
  SELECT id INTO v_scope_all_id FROM "Scope" WHERE name = 'all';
  SELECT id INTO v_scope_own_id FROM "Scope" WHERE name = 'own';

  -- Permisos de VIEW
  INSERT INTO "Permission" ("resourceId", "actionId", "scopeId", code, description, "isActive")
  VALUES 
    (v_resource_id, v_action_view_id, v_scope_all_id, 'consumables:view:all', 'Ver todos los consumibles', true),
    (v_resource_id, v_action_view_id, v_scope_own_id, 'consumables:view:own', 'Ver solo consumibles asignados', true)
  ON CONFLICT (code) DO UPDATE SET
    description = EXCLUDED.description,
    "isActive" = true;

  -- Permisos de CREATE
  INSERT INTO "Permission" ("resourceId", "actionId", "scopeId", code, description, "isActive")
  VALUES 
    (v_resource_id, v_action_create_id, v_scope_all_id, 'consumables:create:all', 'Crear consumibles', true)
  ON CONFLICT (code) DO UPDATE SET
    description = EXCLUDED.description,
    "isActive" = true;

  -- Permisos de UPDATE
  INSERT INTO "Permission" ("resourceId", "actionId", "scopeId", code, description, "isActive")
  VALUES 
    (v_resource_id, v_action_update_id, v_scope_all_id, 'consumables:update:all', 'Actualizar cualquier consumible', true),
    (v_resource_id, v_action_update_id, v_scope_own_id, 'consumables:update:own', 'Actualizar solo consumibles asignados', true)
  ON CONFLICT (code) DO UPDATE SET
    description = EXCLUDED.description,
    "isActive" = true;

  -- Permisos de DELETE
  INSERT INTO "Permission" ("resourceId", "actionId", "scopeId", code, description, "isActive")
  VALUES 
    (v_resource_id, v_action_delete_id, v_scope_all_id, 'consumables:delete:all', 'Eliminar cualquier consumible', true)
  ON CONFLICT (code) DO UPDATE SET
    description = EXCLUDED.description,
    "isActive" = true;

END $$;

-- 4. Asignar permisos al rol ADMIN (id = 1)
DO $$
DECLARE
  v_admin_role_id INT := 1;
  v_permission_id INT;
BEGIN
  -- Asignar todos los permisos de consumables al ADMIN
  FOR v_permission_id IN
    SELECT p.id
    FROM "Permission" p
    JOIN "Resource" r ON p."resourceId" = r.id
    WHERE r.name = 'consumables'
  LOOP
    INSERT INTO "RolePermission" ("roleId", "permissionId")
    VALUES (v_admin_role_id, v_permission_id)
    ON CONFLICT ("roleId", "permissionId") DO NOTHING;
  END LOOP;
END $$;
