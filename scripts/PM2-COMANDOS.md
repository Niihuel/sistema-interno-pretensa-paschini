# 📘 Guía de Comandos PM2 - Sistema IT

## 🚀 Inicio Rápido

### Usando el Gestor Interactivo (Recomendado)
```bash
cd scripts
pm2-manager.bat
```

## 📋 Comandos Principales

### Iniciar la Aplicación

#### Modo Producción
```bash
pm2 start scripts/ecosystem.config.js --env production
```

#### Modo Desarrollo
```bash
pm2 start scripts/ecosystem.config.js --env development
```

### Gestión Básica

```bash
# Ver estado de todos los procesos
pm2 list
pm2 ls

# Ver información detallada
pm2 describe sistema-it-backend

# Detener la aplicación
pm2 stop sistema-it-backend

# Reiniciar la aplicación
pm2 restart sistema-it-backend

# Eliminar el proceso de PM2
pm2 delete sistema-it-backend

# Detener todos los procesos
pm2 stop all

# Reiniciar todos los procesos
pm2 restart all

# Eliminar todos los procesos
pm2 delete all
```

## 📊 Monitoreo

### Ver Logs

```bash
# Logs en tiempo real
pm2 logs sistema-it-backend

# Últimas 100 líneas
pm2 logs sistema-it-backend --lines 100

# Solo errores
pm2 logs sistema-it-backend --err

# Solo salida estándar
pm2 logs sistema-it-backend --out

# Ver logs y salir
pm2 logs --nostream --lines 50
```

### Limpiar Logs
```bash
# Limpiar todos los logs
pm2 flush

# Limpiar logs de una aplicación específica
pm2 flush sistema-it-backend
```

### Monitoreo en Tiempo Real
```bash
# Dashboard de recursos
pm2 monit

# Monitoreo web (requiere PM2 Plus)
pm2 plus
```

## 🔧 Actualización y Mantenimiento

### Actualizar la Aplicación sin Downtime

```bash
# 1. Compilar nueva versión
cd backend
npm run build

# 2. Recargar la aplicación
pm2 reload sistema-it-backend

# O hacer ambos con el script
cd scripts
# Opción 9 en pm2-manager.bat
```

### Reinicio con Cambios de Configuración

```bash
# Reiniciar leyendo el archivo de configuración
pm2 restart scripts/ecosystem.config.js

# Reiniciar y actualizar variables de entorno
pm2 restart sistema-it-backend --update-env
```

## 💾 Persistencia y Startup

### Guardar Configuración Actual

```bash
# Guardar lista de procesos
pm2 save

# Configurar inicio automático
pm2 startup

# En Windows, ejecutar:
scripts/configurar-inicio-automatico.bat
```

### Restaurar Procesos Guardados

```bash
# Restaurar procesos desde la última configuración guardada
pm2 resurrect
```

## 🔍 Información y Diagnóstico

### Ver Información del Sistema

```bash
# Información completa del proceso
pm2 show sistema-it-backend

# Ver variables de entorno
pm2 env 0

# Información de PM2
pm2 info
```

### Diagnóstico de Problemas

```bash
# Ver procesos con problemas
pm2 list

# Ver logs de errores
pm2 logs sistema-it-backend --err --lines 100

# Reiniciar proceso problemático
pm2 restart sistema-it-backend

# Eliminar y volver a crear
pm2 delete sistema-it-backend
pm2 start scripts/ecosystem.config.js --env production
```

## ⚡ Comandos Avanzados

### Escalado de Instancias

```bash
# Escalar a 4 instancias
pm2 scale sistema-it-backend 4

# Aumentar 2 instancias
pm2 scale sistema-it-backend +2

# Reducir 1 instancia
pm2 scale sistema-it-backend -1
```

### Gestión de Memoria

```bash
# Reiniciar si excede 500MB
pm2 start scripts/ecosystem.config.js --max-memory-restart 500M

# Ver uso de memoria
pm2 monit
```

### Modo Cluster

Para habilitar modo cluster, edita `scripts/ecosystem.config.js`:

```javascript
{
  instances: 4,        // Número de instancias
  exec_mode: 'cluster' // Cambiar de 'fork' a 'cluster'
}
```

Luego reinicia:
```bash
pm2 reload scripts/ecosystem.config.js --env production
```

## 🔐 Variables de Entorno

### Ver Variables Actuales

```bash
pm2 env 0
```

### Cambiar Variables

Edita `scripts/ecosystem.config.js`:

```javascript
env_production: {
  NODE_ENV: 'production',
  PORT: 3500,
  // Agregar más variables aquí
},
```

Luego:
```bash
pm2 restart sistema-it-backend --update-env
```

## 📈 Reinicio Programado

### Configurar Reinicio Automático

En `scripts/ecosystem.config.js`, descomenta:

```javascript
cron_restart: '0 3 * * *', // Reiniciar diariamente a las 3 AM
```

### Formatos de Cron

- `0 3 * * *` - Diariamente a las 3:00 AM
- `0 */4 * * *` - Cada 4 horas
- `0 0 * * 0` - Cada domingo a medianoche
- `*/30 * * * *` - Cada 30 minutos

## 🧹 Limpieza y Reset

```bash
# Detener todos los procesos
pm2 stop all

# Eliminar todos los procesos
pm2 delete all

# Limpiar logs
pm2 flush

# Matar el daemon de PM2
pm2 kill

# Limpiar completamente PM2
pm2 kill
pm2 flush
rm -rf ~/.pm2
```

## 📱 Notificaciones y Alertas

### PM2 Plus (Opcional)

```bash
# Conectar a PM2 Plus para monitoreo avanzado
pm2 plus
```

Funcionalidades de PM2 Plus:
- Dashboard web en tiempo real
- Alertas por email/Slack
- Métricas históricas
- Logs centralizados
- Despliegues remotos

## 🆘 Solución de Problemas Comunes

### La Aplicación No Inicia

```bash
# Ver logs de error
pm2 logs sistema-it-backend --err --lines 50

# Verificar que el archivo compilado existe
dir backend\dist\main.js

# Recompilar
cd backend
npm run build

# Intentar iniciar nuevamente
pm2 start scripts/ecosystem.config.js --env production
```

### Alto Uso de Memoria

```bash
# Ver uso actual
pm2 monit

# Reiniciar proceso
pm2 restart sistema-it-backend

# Configurar límite de memoria (en ecosystem.config.js)
max_memory_restart: '500M'
```

### Proceso Se Reinicia Constantemente

```bash
# Ver información detallada
pm2 describe sistema-it-backend

# Ver logs
pm2 logs sistema-it-backend --lines 100

# Aumentar min_uptime en ecosystem.config.js
min_uptime: '30s'
max_restarts: 5
```

### PM2 No Guarda la Configuración

```bash
# Asegurarse de guardar después de cambios
pm2 save

# Si persiste el problema, resetear
pm2 kill
pm2 start scripts/ecosystem.config.js --env production
pm2 save
```

## 📚 Referencias

- [Documentación oficial PM2](https://pm2.keymetrics.io/)
- [Ecosystem File](https://pm2.keymetrics.io/docs/usage/application-declaration/)
- [PM2 Plus](https://pm2.io/)

## 🎯 Scripts del Proyecto

### Windows

- `pm2-manager.bat` - Gestor interactivo completo
- `status-sistema.bat` - Ver estado rápido
- `start-sistema-hidden.vbs` - Iniciar en background
- `stop-sistema-hidden.vbs` - Detener en background
- `restart-sistema-hidden.vbs` - Reiniciar en background
- `configurar-inicio-automatico.bat` - Configurar inicio automático con Windows

### Uso de VBS (Sin ventanas)

Los archivos `.vbs` ejecutan comandos PM2 sin mostrar ventanas de terminal:

```vbscript
' Ejecutar desde cualquier lugar
wscript.exe "C:\ruta\al\proyecto\scripts\start-sistema-hidden.vbs"
```

---

**Última actualización:** 2025-10-14
