# GUIA DE DESPLIEGUE A PRODUCCION - SISTEMA IT

## CONFIGURACION DE PUERTOS

```
┌─────────────────────────────────────────────────────────┐
│                   RED LAN: 192.168.0.219                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Frontend (React + Vite)                                │
│  Puerto: 4350                                           │
│  URL: http://192.168.0.219:4350                         │
│                                                         │
│  Backend API (NestJS)                                   │
│  Puerto: 3500                                           │
│  URL: http://192.168.0.219:3500                         │
│                                                         │
│  PostgreSQL Database                                    │
│  Puerto: 5432                                           │
│  Host: 192.168.0.219:5432                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## PASO 1: PREPARAR LA BASE DE DATOS

### Opcion A: PostgreSQL Local

```bash
# Instalar PostgreSQL
# Crear usuario y base de datos
psql -U postgres
CREATE USER sistema_user WITH PASSWORD 'sistema_password_2024';
CREATE DATABASE sistema_it OWNER sistema_user;
GRANT ALL PRIVILEGES ON DATABASE sistema_it TO sistema_user;
\q
```

### Opcion B: Docker (Recomendado)

```bash
# Copiar variables de entorno para Docker
cp .env.docker.example .env

# Editar .env con credenciales seguras
# Iniciar PostgreSQL
docker-compose up -d postgres

# Verificar que está corriendo
docker-compose ps
```

## PASO 2: CONFIGURAR BACKEND

```bash
cd backend

# El archivo .env ya está creado con:
# - Secrets de producción generados automáticamente
# - IP configurada: 192.168.0.219
# - Puerto: 3500
# - CORS configurado para frontend en puerto 4350

# IMPORTANTE: Actualizar solo estas variables si es necesario:
# DATABASE_URL si la base de datos está en otro host
# SEED_DEFAULT_PASSWORD (cambiar después del primer login)

# Instalar dependencias
npm install

# Generar cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate:deploy

# Poblar base de datos (seed)
npm run prisma:seed

# Compilar para producción
npm run build

# Iniciar servidor
npm run start:prod
```

El backend estará corriendo en: **http://192.168.0.219:3500**

## PASO 3: CONFIGURAR FRONTEND

```bash
cd frontend

# El archivo .env ya está creado con:
# VITE_API_URL=http://192.168.0.219:3500
# VITE_ENV=production
# VITE_ENABLE_DEVTOOLS=false

# Instalar dependencias
npm install

# IMPORTANTE: Cerrar cualquier proceso que esté usando la carpeta dist/
# Cerrar VS Code, editores, terminals con npm run dev

# Compilar para producción
npm run build

# Iniciar servidor de producción
npm run start
```

El frontend estará corriendo en: **http://192.168.0.219:4350**

## PASO 4: VERIFICAR DESPLIEGUE

### Verificar Backend

```bash
# Health check
curl http://192.168.0.219:3500/api/system/status

# Debe responder con autenticación requerida (401) - esto es correcto
```

### Verificar Frontend

```bash
# Abrir navegador
http://192.168.0.219:4350

# Login con usuarios seed:
Usuario: nihuel
Contraseña: ChangeMe123!

Usuario: javier
Contraseña: ChangeMe123!
```

## PASO 5: TAREAS POST-DESPLIEGUE

### Cambiar Contraseñas

1. Login como nihuel
2. Ir a perfil de usuario
3. Cambiar contraseña de ChangeMe123! a una segura
4. Repetir para usuario javier

### Configurar Backups Automáticos

Los backups se almacenan en: `backend/backups/`

Para backups automáticos, configurar cron job:

```bash
# Editar crontab
crontab -e

# Agregar backup diario a las 2 AM
0 2 * * * cd /ruta/al/proyecto/backend && npm run backup
```

## PASO 6: MONITOREO

### Logs del Backend

```bash
# Ver logs en tiempo real
tail -f backend/logs/app.log

# Logs por día se rotan automáticamente
```

### Logs del Frontend

```bash
# Ver logs del servidor
# Los logs aparecen en la consola donde ejecutaste npm run start
```

## TROUBLESHOOTING

### Backend no inicia

```bash
# Verificar puerto 3000 no esté ocupado
netstat -ano | grep 3000

# Verificar conexión a base de datos
cd backend
npx prisma studio
```

### Frontend no compila

```bash
# Limpiar cache y node_modules
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

### CORS Error

Verificar en `backend/.env`:
```
CORS_ORIGIN="http://192.168.0.219:4350"
FRONTEND_URL="http://192.168.0.219:4350"
```

### WebSocket no conecta

Verificar que el frontend esté usando:
```
VITE_API_URL="http://192.168.0.219:3500"
```

## SEGURIDAD

### Checklist de Seguridad

- [x] Secrets generados con openssl
- [x] Contraseñas no hardcodeadas
- [x] CORS configurado con IP específica
- [x] Endpoints protegidos con autenticación
- [x] Variables de entorno en .gitignore
- [x] Console.log eliminados
- [x] Rate limiting habilitado
- [x] Helmet headers configurados

### Cambiar Secrets Manualmente (opcional)

Si necesitas regenerar secrets:

```bash
# JWT Secret
openssl rand -base64 64

# JWT Refresh Secret
openssl rand -base64 64

# Session Secret
openssl rand -base64 64

# Backup Encryption Key
openssl rand -base64 32
```

Reemplazar en `backend/.env`

## COMANDOS RAPIDOS

```bash
# Iniciar todo (desde raiz del proyecto)
cd backend && npm run start:prod &
cd frontend && npm run start &

# Detener todo
pkill -f "node.*backend"
pkill -f "serve.*frontend"

# Reiniciar backend
cd backend && npm run start:prod

# Reiniciar frontend
cd frontend && npm run start

# Ver status
ps aux | grep node
```

## USUARIOS INICIALES

Después del seed, existen estos usuarios:

| Usuario | Contraseña | Rol | Email |
|---------|------------|-----|-------|
| nihuel | ChangeMe123! | SuperAdmin | nihuel@sistema.local |
| javier | ChangeMe123! | SuperAdmin | javier@sistema.local |

**IMPORTANTE: Cambiar estas contraseñas después del primer login**

## SOPORTE

Para problemas o dudas:
- Revisar logs en `backend/logs/app.log`
- Verificar que todos los servicios estén corriendo
- Revisar permisos de archivos y carpetas
- Verificar conectividad de red entre servicios
