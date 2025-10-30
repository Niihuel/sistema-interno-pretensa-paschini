# Guia rapida para PWA en iOS

Esta guia resume buenas practicas probadas para eliminar bordes negros/blancos y mejorar la experiencia full screen al instalar la PWA en iPhone/iPad (iOS/iPadOS 15+). Se basa en la documentacion oficial de Apple Safari Web Apps (2023), la guia de Google para Safari 16+ y la experiencia con vite-plugin-pwa.

## Metadatos y manifiesto
- `viewport-fit=cover` en la meta viewport y `apple-mobile-web-app-capable=yes` son obligatorios para ocupar la pantalla completa.
- Define `apple-mobile-web-app-status-bar-style=black-translucent` o `default` segun el contraste requerido por el fondo.
- Anade `apple-touch-icon` (152/180 px) y `maskable` icons en el manifiesto (`purpose: "maskable"`).
- Expone `application-name`, `apple-touch-fullscreen=yes` y `format-detection=telephone=no,email=no` para evitar zooms automaticos.
- Usa `display: "standalone"` + `display_override: ["standalone", "minimal-ui"]` y `orientation: "portrait-primary"` para forzar el modo correcto en iOS 17+.
- Manten `background_color` y `theme_color` iguales (o complementarios) para evitar flashes blancos durante el splash de iOS.

## Safe areas y alturas dinamicas
- Declara variables CSS con `env(safe-area-inset-*)` y `constant(safe-area-inset-*)` (fallback iOS 13/14).
- Emplea unidades de viewport modernas (`dvh`, `svh`) con fallback a `var(--app-height)` calculado con `window.innerHeight` para iOS < 16.4.
- Envuelve los contenedores globales (`body`, `#root`, layout principal) con padding/margin que tome `max(env(...), 0px)` para evitar que el contenido quede oculto por la barra de estado o el indicador de gestos.

## Splash screens y assets
- Genera splash screens multiples desde `@vite-pwa/assets-generator` o `pwa-assets.config.ts` para cada resolucion de iPhone/iPad, usando fondo y logotipo consistente.
- Manten las imagenes en `/public` con nombres estables (`apple-splash-2048x2732.png`, etc.) y enlazalas mediante `<link rel="apple-touch-startup-image" media="(device-width: ...)" ...>` si se desea un splash "nativo".

## Service Worker y workbox
- Activa `registerType: 'autoUpdate'` y un fallback offline para rutas de navegacion (`navigateFallback`) para Safari que recarga apps tras varias horas en background.
- Cachea recursos criticos (CSS, fuentes, iconos) en `runtimeCaching` y define `skipWaiting/clientsClaim` para evitar versiones intermedias con estilos antiguos.

## QA y pruebas recomendadas
1. Instalar la PWA en un iPhone real (Safari compartir -> "Anadir a pantalla de inicio").
2. Probar en modo landscape y portrait comprobando que `body` no deja franjas.
3. Verificar en Ajustes > Safari > Avanzado > Datos de sitios web para limpiar cache entre builds.
4. Usar `xcrun simctl io booted screenshot` dentro de un simulador iOS (si se trabaja en macOS) para validar splash/seguridad.

> Nota: iOS 17.4+ soporta `push` y `getInstalledRelatedApps`. Revisar las notas de Safari Technology Preview para cambios futuros.

