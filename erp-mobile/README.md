# ERP móvil (Susequid) — Expo + React Native

Cliente Android que usa la misma API que el front web (`/api`).

## Requisitos

- Node.js LTS
- [Expo Go](https://expo.dev/go) en el celular (para pruebas rápidas), o emulador Android con Android Studio

## Arrancar el backend

En otra terminal, el Spring Boot debe estar corriendo en el puerto **8080** (como en desarrollo habitual).

## Probar en emulador Android

Por defecto la app usa `http://10.0.2.2:8080/api` (eso apunta al `localhost` de tu PC desde el emulador).

```bash
cd erp-mobile
npm install
npm run android
```

## Probar en celular físico (misma red WiFi)

La app intenta **detectar sola** la IP de tu PC usando Expo (`debuggerHost`). Si igual falla:

1. En la PC, mirá tu IP (`ipconfig` → IPv4, ej. `192.168.1.40`).
2. Creá `erp-mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.40:8080/api
```

3. Reiniciá Metro (`Ctrl+C` y `npm start` de nuevo) y recargá la app en Expo Go.

**Firewall de Windows:** si ves *Network request failed*, permití conexiones entrantes al **puerto 8080** en redes privadas (o desactivá temporalmente el firewall para probar).

## Login

Mismo endpoint que la web: `POST /api/auth/login` con `correo` y `clave`. El token se guarda en el dispositivo para la próxima apertura.

## Próximos pasos en código

- Agregar pantallas (navegación con `@react-navigation/native`).
- Llamadas autenticadas con `apiFetch('/ruta', { ... })` desde `src/api/client.ts`.
