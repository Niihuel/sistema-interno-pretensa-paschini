# SISTEMA IT - EN PRODUCCION

## SERVICIOS ACTIVOS

```
┌──────────────────────────────────────────────────────────────┐
│                 SISTEMA EN PRODUCCION                        │
│              Red LAN: 192.168.0.219                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ✅ FRONTEND                                                 │
│     URL: http://192.168.0.219:4350                           │
│     Puerto: 4350                                             │
│     PID: 19776                                               │
│     Estado: CORRIENDO                                        │
│                                                              │
│  ✅ BACKEND API                                              │
│     URL: http://192.168.0.219:3500                           │
│     Puerto: 3500                                             │
│     PID: 18436                                               │
│     Estado: CORRIENDO                                        │
│                                                              │
│  ✅ POSTGRESQL DATABASE                                      │
│     Host: localhost:5433                                     │
│     Docker: sistema-it-db                                    │
│     Estado: CORRIENDO (healthy)                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## ACCESO AL SISTEMA

### URL Principal
**http://192.168.0.219:4350**

### Usuarios Disponibles

| Usuario | Contraseña | Rol | Acciones |
|---------|------------|-----|----------|
| nihuel | ChangeMe123! | SuperAdmin | Acceso completo al sistema |
| javier | ChangeMe123! | SuperAdmin | Acceso completo al sistema |

**IMPORTANTE: Cambiar estas contraseñas después del primer login**

## CONFIGURACION ACTUAL

### Backend (.env)
```bash
NODE_ENV=production
PORT=3500
HOST=0.0.0.0
DATABASE_URL=postgresql://sistema_user:sistema_password_2024@localhost:5433/sistema_it
FRONTEND_URL=http://192.168.0.219:4350
CORS_ORIGIN=http://192.168.0.219:4350

# Secrets generados automáticamente con openssl
JWT_SECRET=uVFOo6SfKhUs9Kgczs+CcpMGDksdzwV6jgkmCm7wOaDGjtiyMYCzyYjrPtD/oXSVYoHWk3vnQ8dVSu8Wt2pDRw==
JWT_REFRESH_SECRET=L6RB/lJw7LzRVzYbMUtAAYkHmJiCZQz6XTOFamkg3DsmSA0LpnUfcZ15gBZ4ertf8NhgGLKF4mYAKo8IhDnl9Q==
SESSION_SECRET=6J7LPDONe5XjPx0Uj+wUYt8SxOFHi0nXzgewjIvb9rK56yLMeHIdUnjOMBF39wfpwY4hVHYjaJ3lBLl57kUJEw==
BACKUP_ENCRYPTION_KEY=p1dlg1+NrL6NtwTaAwSXmIs3KuHosiLj8wZniuJaJjM=
```

### Frontend (.env)
```bash
VITE_API_URL=http://192.168.0.219:3500
VITE_APP_NAME=Sistema IT
VITE_ENV=production
VITE_ENABLE_DEVTOOLS=false
```

## COMANDOS DE GESTION

### Ver Estado de Servicios

```bash
# Backend
netstat -ano | grep ":3500"

# Frontend
netstat -ano | grep ":4350"

# Base de datos
docker ps | grep sistema-it-db
```

### Reiniciar Servicios

```bash
# Detener todo
taskkill /F /PID 18436   # Backend
taskkill /F /PID 19776   # Frontend

# Reiniciar Backend
cd backend
npm run start:prod &

# Reiniciar Frontend
cd frontend
npm run start &
```

### Ver Logs

```bash
# Logs del Backend
tail -f backend/logs/app.log

# Logs del Frontend
# Los logs aparecen en la consola donde se ejecutó npm run start
```

## SEGURIDAD IMPLEMENTADA

✅ **Autenticación JWT**
- Tokens de acceso: 7 días
- Tokens de refresh: 30 días
- Secrets generados con openssl (64 bytes)

✅ **CORS Configurado**
- Solo acepta requests desde: http://192.168.0.219:4350
- Bloquea requests sin Origin header en producción

✅ **Rate Limiting**
- General: 100 requests por minuto
- Auth endpoints: 10 requests por minuto
- Protección contra fuerza bruta: 5 intentos, bloqueo de 5 minutos

✅ **Helmet Security Headers**
- Content Security Policy
- HSTS habilitado
- X-Frame-Options: DENY
- XSS Protection

✅ **Validación de Datos**
- ValidationPipe global
- Whitelist de propiedades
- Mensajes de error deshabilitados en producción

✅ **Sistema de Permisos RBAC**
- Todos los endpoints protegidos
- /api/backups/restore-status: Requiere autenticación
- /api/system/status: Requiere autenticación

## TAREAS POST-DESPLIEGUE

### 1. Cambiar Contraseñas (URGENTE)

1. Acceder al sistema: http://192.168.0.219:4350
2. Login como "nihuel" con contraseña "ChangeMe123!"
3. Ir a perfil de usuario
4. Cambiar contraseña a una segura
5. Repetir para usuario "javier"

### 2. Configurar Backups Automáticos

Los backups se almacenan en `backend/backups/` cifrados con AES-256.

Para backups automáticos diarios:

```bash
# Crear script de backup
nano /home/backup-sistema.sh

#!/bin/bash
cd /ruta/al/proyecto/backend
npm run backup
find backups/ -name "*.enc" -mtime +30 -delete

# Hacer ejecutable
chmod +x /home/backup-sistema.sh

# Agregar a crontab (backup diario a las 2 AM)
crontab -e
0 2 * * * /home/backup-sistema.sh >> /var/log/backup-sistema.log 2>&1
```

### 3. Monitoreo Recomendado

```bash
# Crear script de monitoreo
nano /home/check-sistema.sh

#!/bin/bash
echo "=== MONITOREO SISTEMA IT ==="
echo "Fecha: $(date)"
echo ""
echo "Backend (Puerto 3500):"
netstat -ano | grep ":3500.*LISTENING" && echo "✅ OK" || echo "❌ CAIDO"
echo ""
echo "Frontend (Puerto 4350):"
netstat -ano | grep ":4350.*LISTENING" && echo "✅ OK" || echo "❌ CAIDO"
echo ""
echo "PostgreSQL:"
docker ps | grep sistema-it-db | grep "Up" && echo "✅ OK" || echo "❌ CAIDO"
echo ""
```

## TROUBLESHOOTING

### Frontend no carga

```bash
# Verificar que está corriendo
netstat -ano | grep ":4350"

# Si no está, reiniciar
cd frontend
npm run start &
```

### Backend no responde

```bash
# Ver logs
tail -f backend/logs/app.log

# Verificar conexión a base de datos
docker exec -it sistema-it-db psql -U sistema_user -d sistema_it -c "SELECT 1;"

# Reiniciar backend
cd backend
npm run start:prod &
```

### Base de datos no conecta

```bash
# Verificar Docker
docker ps | grep sistema-it-db

# Si no está corriendo
docker-compose up -d postgres

# Ver logs
docker logs sistema-it-db
```

### Error de CORS

Verificar que `backend/.env` tenga:
```
CORS_ORIGIN=http://192.168.0.219:4350
FRONTEND_URL=http://192.168.0.219:4350
```

Y reiniciar el backend.

## ACTUALIZACIONES FUTURAS

### Para actualizar el Frontend

```bash
cd frontend

# Detener el servicio actual
# Encontrar PID: netstat -ano | grep ":4350"
taskkill /F /PID [PID_NUMERO]

# Hacer cambios en el código
# ...

# Compilar
npm run build

# Iniciar
npm run start &
```

### Para actualizar el Backend

```bash
cd backend

# Detener el servicio actual
# Encontrar PID: netstat -ano | grep ":3500"
taskkill /F /PID [PID_NUMERO]

# Hacer cambios en el código
# ...

# Si hay cambios en la base de datos
npm run prisma:migrate:deploy

# Compilar
npm run build

# Iniciar
npm run start:prod &
```

## RESPALDO DE CONFIGURACION

Los archivos críticos de configuración están en:
- `backend/.env` - Variables de entorno del backend
- `frontend/.env` - Variables de entorno del frontend
- `docker-compose.yml` - Configuración de Docker
- `backend/prisma/schema.prisma` - Esquema de base de datos

**IMPORTANTE: Hacer backup de estos archivos regularmente**

## CONTACTO Y SOPORTE

Para problemas técnicos:
1. Revisar logs en `backend/logs/app.log`
2. Verificar que todos los servicios estén corriendo
3. Revisar este documento para troubleshooting
4. Consultar `DESPLIEGUE-PRODUCCION.md` para detalles adicionales

---

**Sistema desplegado exitosamente el: 2025-10-09**
**Versión: 1.0.0 - Producción**
