# Guía de Migración del Frontend

## Cambios Requeridos en Archivos del Cliente

Los siguientes archivos necesitan ser actualizados para usar el nuevo sistema de autenticación basado en cookies:

### 1. **src/app/dashboard/page.tsx**

#### Cambios necesarios:

```typescript
// ANTES:
import { storage } from '@/lib/storage';

const current = storage.getCurrentUser();
storage.setCurrentUser(updated);
storage.setCurrentUser(null);

// DESPUÉS:
import { authClient } from '@/lib/auth-client';
import { storage } from '@/lib/storage';

const current = await authClient.getCurrentUser();
// Para actualizar perfil, solo guardar en DB (cookie se mantiene):
await storage.saveUser(updated);
// Para logout:
await authClient.logout();
```

#### Líneas específicas a cambiar:

- **Línea ~79**: `const current = storage.getCurrentUser();` 
  → `const current = await authClient.getCurrentUser();`
  
- **Línea ~88**: `storage.setCurrentUser(current);` 
  → Eliminar (no es necesario)
  
- **Línea ~120**: `storage.setCurrentUser(null);` 
  → `await authClient.logout();`
  
- **Línea ~154**: `storage.setCurrentUser(updated);` 
  → Eliminar (el usuario ya está autenticado)

- **Línea ~177**: Cambiar body de change-password:
  ```typescript
  // ANTES:
  body: JSON.stringify({
      userId: user.id,
      currentPassword: passwordData.current,
      newPassword: passwordData.new
  })
  
  // DESPUÉS:
  body: JSON.stringify({
      currentPassword: passwordData.current,
      newPassword: passwordData.new
  }),
  credentials: 'include'  // AGREGAR ESTO
  ```

### 2. **src/app/exam/page.tsx**

#### Cambios necesarios:

```typescript
// ANTES:
const user = storage.getCurrentUser();

// DESPUÉS:
const user = await authClient.getCurrentUser();
```

#### Líneas específicas:

- **Línea ~49**: `const user = storage.getCurrentUser();`
  → `const user = await authClient.getCurrentUser();`
  
- **Línea ~117**: `const user = storage.getCurrentUser();`
  → `const user = await authClient.getCurrentUser();`

**IMPORTANTE**: Como estas llamadas están dentro de useEffect y otras funciones, hay que hacer las funciones `async`:

```typescript
// Línea ~48
useEffect(() => {
    const loadQuestions = async () => {
        const user = await authClient.getCurrentUser(); // CAMBIAR
        // resto del código...
    };
    loadQuestions();
    // ...
}, [category]);

// Línea ~115
const finishExam = async () => {
    const user = await authClient.getCurrentUser(); // CAMBIAR
    // resto del código...
};
```

### 3. **src/app/dashboard/payment-confirm/page.tsx**

#### Cambios necesarios:

- **Línea ~28**: `const currentUser = storage.getCurrentUser();`
  → `const currentUser = await authClient.getCurrentUser();`
  
- **Línea ~31**: `storage.setCurrentUser(currentUser);`
  → Eliminar (no es necesario)

```typescript
// ANTES:
const currentUser = storage.getCurrentUser();
if (currentUser) {
    currentUser.isPro = true;
    storage.setCurrentUser(currentUser);
}

// DESPUÉS:
const currentUser = await authClient.getCurrentUser();
if (currentUser) {
    currentUser.isPro = true;
    // La cookie ya está establecida, solo actualizar estado local si es necesario
}
```

### 4. **Todas las llamadas fetch a /api/***

Agregar `credentials: 'include'` a TODAS las llamadas fetch:

```typescript
// ANTES:
fetch('/api/results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
})

// DESPUÉS:
fetch('/api/results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // AGREGAR ESTO
    body: JSON.stringify(data)
})
```

## Patrón de Actualización Rápida

### Búsqueda y Reemplazo Global

1. **Buscar**: `storage.getCurrentUser()`
   **Reemplazar con**: `await authClient.getCurrentUser()`
   **Notas**: Asegurarse de que la función contenedora sea `async`

2. **Buscar**: `storage.setCurrentUser(null)`
   **Reemplazar con**: `await authClient.logout()`

3. **Buscar**: `storage.setCurrentUser(`
   **Acción**: Revisar caso por caso y probablemente eliminar

4. **Buscar**: `fetch('/api/`
   **Acción**: Agregar `credentials: 'include'` a cada llamada

### Importaciones Necesarias

En archivos que usan autenticación:

```typescript
import { authClient } from '@/lib/auth-client';
import { storage } from '@/lib/storage'; // Solo si necesitas otros métodos
```

## Funciones a Convertir en Async

Cualquier función que llame a `authClient.getCurrentUser()` debe ser async:

```typescript
// ANTES:
useEffect(() => {
    const user = storage.getCurrentUser();
    // ...
}, []);

// DESPUÉS:
useEffect(() => {
    const checkAuth = async () => {
        const user = await authClient.getCurrentUser();
        // ...
    };
    checkAuth();
}, []);
```

## Testing Checklist

Después de hacer los cambios, probar:

- [ ] Login funciona correctamente
- [ ] Logout limpia sesión y redirige
- [ ] Refresh de página mantiene sesión
- [ ] Exam page carga usuario correcto
- [ ] Dashboard muestra datos del usuario
- [ ] Cambio de contraseña funciona
- [ ] Actualizar perfil funciona
- [ ] Guardar resultados funciona
- [ ] Verificar que no aparecen errores de autenticación en consola
- [ ] Inactividad cierra sesión correctamente

## Errores Comunes

### Error: "Cannot read property 'id' of null"
**Causa**: Intentar acceder a user.id cuando getCurrentUser() no ha resuelto
**Solución**: Usar await y verificar null

### Error: "401 Unauthorized" en API calls
**Causa**: Falta `credentials: 'include'` en fetch
**Solución**: Agregar credentials a todas las llamadas

### Error: Usuario se desautentica al refrescar
**Causa**: Cookie no se está enviando
**Solución**: Verificar que todas las fetch tengan `credentials: 'include'`

## Notas Adicionales

- Las cookies HTTP-only no son accesibles desde JavaScript (esto es intencional por seguridad)
- No intentes leer directamente la cookie `auth_token` desde el navegador
- Usa siempre `authClient.getCurrentUser()` para obtener el usuario actual
- El sistema automáticamente maneja la renovación de sesión durante 7 días
