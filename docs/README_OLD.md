# Sistema IT - Pretensa & Paschini

Sistema interno de gestión para Pretensa & Paschini.

## Acceso Rápido

**URL del Sistema:** http://192.168.0.219:4350

**Credenciales:**
- Usuario: `nihuel` / Contraseña: `ChangeMe123!`
- Usuario: `javier` / Contraseña: `ChangeMe123!`

## Estructura del Proyecto

```
sistema-nuevo/
├── .env                      # Variables de entorno (único para todo el proyecto)
├── backend/                  # API NestJS (Puerto 3500)
├── frontend/                 # React + Vite (Puerto 4350)
├── docker-compose.yml        # PostgreSQL container
├── README.md                 # Este archivo
├── SISTEMA-EN-PRODUCCION.md  # Guía de operación diaria
└── DESPLIEGUE-PRODUCCION.md  # Guía de despliegue
```

## Inicio Rápido

### Servicios ya están corriendo

Si los servicios ya están iniciados, solo abre:
```
http://192.168.0.219:4350
```

### Iniciar servicios manualmente

```bash
# 1. Backend
cd backend
npm run start:prod &

# 2. Frontend
cd frontend
npm run start &
```

## Puertos

- **Frontend:** 4350 (http://192.168.0.219:4350)
- **Backend API:** 3500 (http://192.168.0.219:3500)
- **PostgreSQL:** 5433 (localhost:5433)

## Configuración

Todo el sistema se configura desde un único archivo `.env` en la raíz del proyecto.

## Documentación

- **SISTEMA-EN-PRODUCCION.md** - Guía completa de operación, monitoreo y troubleshooting
- **DESPLIEGUE-PRODUCCION.md** - Instrucciones detalladas de despliegue y configuración

## Tecnologías

**Backend:**
- NestJS
- PostgreSQL + Prisma
- JWT Authentication
- WebSockets (Socket.io)

**Frontend:**
- React 19
- Vite
- TanStack Query
- Tailwind CSS
- Framer Motion

## Soporte

Para problemas técnicos, consulta `SISTEMA-EN-PRODUCCION.md` en la sección de troubleshooting.
