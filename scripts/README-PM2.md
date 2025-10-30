# 🚀 PM2 - Guía de Actualización y Uso

## ✅ Actualizaciones Realizadas

### 1. **ecosystem.config.js** - Configuración Mejorada

Se actualizó con:
- ✨ Mejor gestión de memoria y recursos
- ⚡ Configuración de timeouts optimizada
- 🔄 Soporte para múltiples entornos (producción/desarrollo)
- 📝 Logs mejorados con timestamps
- 🔧 Configuración avanzada de reinicio automático
- 💻 Optimizaciones para Windows

### 2. **pm2-manager.bat** - Nuevo Gestor Interactivo

Script con menú interactivo que incluye:
- Iniciar backend (producción/desarrollo)
- Detener/Reiniciar backend
- Ver estado y logs
- Logs en tiempo real
- Limpiar logs
- Actualizar backend completo
- Información detallada del proceso

### 3. **PM2-COMANDOS.md** - Guía Completa

Documentación exhaustiva con:
- Todos los comandos PM2
- Ejemplos prácticos
- Solución de problemas
- Comandos avanzados
- Mejores prácticas

---

## 🎯 Cómo Usar el Sistema Actualizado

### Opción 1: Gestor Interactivo (Recomendado)

```bash
# Desde la carpeta raíz del proyecto
cd scripts
pm2-manager.bat
```

Se abrirá un menú con todas las opciones:

```
╔══════════════════════════════════════════╗
║     SISTEMA IT - Gestor PM2              ║
╚══════════════════════════════════════════╝

 [1] Iniciar Backend (Producción)
 [2] Iniciar Backend (Desarrollo)
 [3] Detener Backend
 [4] Reiniciar Backend
 [5] Ver Estado y Logs
 [6] Ver Logs en Tiempo Real
 [7] Limpiar Logs
 [8] Ver Información Detallada
 [9] Actualizar Backend (rebuild + restart)
 [0] Salir
```

### Opción 2: Comandos Directos

#### Iniciar Backend

```bash
# Modo Producción
pm2 start scripts/ecosystem.config.js --env production

# Modo Desarrollo
pm2 start scripts/ecosystem.config.js --env development
```

#### Ver Estado

```bash
pm2 list
pm2 logs sistema-it-backend
pm2 monit
```

#### Reiniciar

```bash
pm2 restart sistema-it-backend
```

#### Detener

```bash
pm2 stop sistema-it-backend
```

### Opción 3: Scripts Silenciosos (Background)

```bash
# Desde cualquier lugar, ejecutar sin ventanas
wscript.exe "C:\ruta\al\proyecto\scripts\start-sistema-hidden.vbs"
wscript.exe "C:\ruta\al\proyecto\scripts\stop-sistema-hidden.vbs"
wscript.exe "C:\ruta\al\proyecto\scripts\restart-sistema-hidden.vbs"
```

---

## 📊 Características Principales

### 🔥 Nuevas Mejoras en ecosystem.config.js

```javascript
// Gestión de Memoria
max_memory_restart: '1G'        // Reinicia si excede 1GB
min_uptime: '10s'               // Tiempo mínimo antes de considerar estable
max_restarts: 10                // Máximo de reinicios en caso de error

// Logs Mejorados
log_date_format: 'YYYY-MM-DD HH:mm:ss Z'  // Con zona horaria
log_file: './logs/backend-combined.log'    // Log combinado
time: true                                  // Timestamps en cada línea

// Reinicio Programado (Opcional)
// cron_restart: '0 3 * * *'    // Reiniciar diariamente a las 3 AM

// Backoff Exponencial
exp_backoff_restart_delay: 100  // Espera incremental entre reinicios
```

### 🎨 Modo Cluster (Opcional)

Para múltiples instancias, edita `ecosystem.config.js`:

```javascript
instances: 4,           // Número de instancias
exec_mode: 'cluster'    // Cambiar de 'fork' a 'cluster'
```

---

## 🛠️ Flujo de Trabajo Típico

### Desarrollo Diario

```bash
# 1. Iniciar en modo desarrollo
cd scripts
pm2-manager.bat
# Seleccionar opción [2]

# 2. Ver logs mientras trabajas
pm2 logs sistema-it-backend

# 3. Cuando hagas cambios, reiniciar
pm2 restart sistema-it-backend
```

### Despliegue a Producción

```bash
# 1. Compilar backend
cd backend
npm run build

# 2. Actualizar usando el gestor
cd ../scripts
pm2-manager.bat
# Seleccionar opción [9] - Actualizar Backend

# O manualmente:
pm2 reload scripts/ecosystem.config.js --env production
```

### Monitoreo

```bash
# Ver estado rápido
cd scripts
status-sistema.bat

# O con el gestor
pm2-manager.bat
# Seleccionar opción [5] - Ver Estado y Logs

# Dashboard en tiempo real
pm2 monit
```

---

## 🚨 Solución de Problemas

### Backend No Inicia

```bash
# 1. Ver logs de error
pm2 logs sistema-it-backend --err

# 2. Verificar compilación
cd backend
npm run build

# 3. Reiniciar PM2 completamente
pm2 kill
pm2 start scripts/ecosystem.config.js --env production
```

### Alto Uso de Memoria

```bash
# 1. Ver uso actual
pm2 monit

# 2. Reiniciar proceso
pm2 restart sistema-it-backend

# 3. Ajustar límite en ecosystem.config.js
max_memory_restart: '500M'  # Cambiar a un valor menor
```

### Logs Muy Grandes

```bash
# Limpiar logs antiguos
pm2 flush

# O usar el gestor
# Opción [7] - Limpiar Logs
```

---

## 📱 Inicio Automático con Windows

```bash
# Como administrador, ejecutar:
cd scripts
configurar-inicio-automatico.bat
```

Esto configurará el sistema para:
- ✅ Iniciar automáticamente al iniciar Windows
- ✅ Correr en segundo plano (sin ventanas)
- ✅ Restaurar después de reinicios

---

## 📈 Comandos Rápidos

```bash
# Ver todo
pm2 list

# Estado detallado
pm2 describe sistema-it-backend

# Logs últimas 50 líneas
pm2 logs --lines 50 --nostream

# Reiniciar todo
pm2 restart all

# Guardar configuración
pm2 save

# Restaurar procesos guardados
pm2 resurrect
```

---

## 🎓 Recursos Adicionales

### Archivos Importantes

- `scripts/ecosystem.config.js` - Configuración principal de PM2
- `scripts/pm2-manager.bat` - Gestor interactivo
- `scripts/PM2-COMANDOS.md` - Guía completa de comandos
- `scripts/status-sistema.bat` - Estado rápido
- `scripts/*.vbs` - Scripts silenciosos para background

### Documentación

- [PM2 - Guía Oficial](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Ecosystem File](https://pm2.keymetrics.io/docs/usage/application-declaration/)
- [PM2 en Windows](https://pm2.keymetrics.io/docs/usage/startup/)

---

## ⚡ Próximos Pasos Recomendados

1. **Probar el Gestor Interactivo**
   ```bash
   cd scripts
   pm2-manager.bat
   ```

2. **Configurar Inicio Automático**
   ```bash
   cd scripts
   configurar-inicio-automatico.bat
   ```

3. **Guardar Configuración**
   ```bash
   pm2 save
   ```

4. **Monitorear el Sistema**
   ```bash
   pm2 monit
   ```

---

**¡Todo listo!** 🎉

El sistema PM2 está completamente actualizado y optimizado.
Para cualquier duda, consulta `PM2-COMANDOS.md` o ejecuta `pm2-manager.bat`.

---

**Fecha de actualización:** 2025-10-14
**Versión:** 2.0
