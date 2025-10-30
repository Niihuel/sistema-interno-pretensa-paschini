# Sistema IT - Gestión con PM2

## Scripts Disponibles

### Iniciar el Sistema (Oculto)
```
start-sistema-hidden.vbs
```
Doble clic para iniciar backend y frontend sin mostrar ventana CMD.

### Detener el Sistema (Oculto)
```
stop-sistema-hidden.vbs
```
Doble clic para detener todos los servicios sin mostrar ventana CMD.

### Reiniciar el Sistema (Oculto)
```
restart-sistema-hidden.vbs
```
Doble clic para reiniciar todos los servicios sin mostrar ventana CMD.

### Ver Estado y Logs
```
status-sistema.bat
```
Doble clic para ver el estado actual y logs recientes.

### Configurar Inicio Automático
```
configurar-inicio-automatico.bat
```
**IMPORTANTE**: Ejecutar como Administrador (clic derecho > Ejecutar como administrador)

Esto configurará el sistema para que inicie automáticamente cuando inicies sesión en Windows, sin mostrar ninguna ventana CMD.

## Servicios Incluidos

- **Backend**: Puerto 3500 (API REST)
- **Frontend**: Puerto 4350 (Interfaz web)

## Base de Datos

- **PostgreSQL Local**: Puerto 5434
- **Database**: sistema_it
- **Usuario**: postgres

## Logs

Los logs se guardan en la carpeta `logs/`:
- `logs/backend-error.log` - Errores del backend
- `logs/backend-out.log` - Output del backend
- `logs/frontend-error.log` - Errores del frontend
- `logs/frontend-out.log` - Output del frontend

## Comandos PM2 Manuales

Si necesitas usar PM2 directamente desde CMD:

```bash
# Ver estado
pm2 list

# Ver logs en tiempo real
pm2 logs

# Reiniciar un servicio específico
pm2 restart sistema-it-backend
pm2 restart sistema-it-frontend

# Detener todo
pm2 delete all

# Iniciar desde ecosystem
pm2 start ecosystem.config.js
```

## Acceso al Sistema

Una vez iniciado, puedes acceder a:

- **Frontend**: http://192.168.0.219:4350
- **Backend API**: http://192.168.0.219:3500/api

## Usuarios por Defecto

- **Usuario**: nihuel
- **Contraseña**: ChangeMe123!

---

**Nota**: Todos los scripts .vbs ejecutan los comandos de forma oculta (sin ventana CMD visible).
