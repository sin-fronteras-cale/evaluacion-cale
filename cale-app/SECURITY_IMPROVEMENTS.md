# CALE - Seguridad y Mejoras Implementadas

## 🔒 Mejoras de Seguridad Implementadas

### 1. **Sistema de Autenticación con JWT y Cookies HTTP-Only**

Se reemplazó el sistema de localStorage por cookies HTTP-only con tokens JWT firmados.

**Antes:** Las sesiones se guardaban en localStorage (vulnerable a XSS)
```typescript
localStorage.setItem('cale_current_user', JSON.stringify(user));
```

**Ahora:** Cookies HTTP-only con JWT
```typescript
response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 604800 // 7 días
});
```

**Archivos creados:**
- `src/lib/auth.ts` - Sistema completo de JWT y helpers de autenticación
- `src/app/api/auth/me/route.ts` - Endpoint para obtener usuario actual
- `src/app/api/auth/logout/route.ts` - Endpoint para cerrar sesión

### 2. **Autenticación y Autorización en Todas las Rutas**

Todas las rutas de API ahora requieren autenticación apropiada:

- **Users API**: Solo admin puede listar/modificar usuarios
- **Questions API**: Usuarios autenticados pueden ver, solo admin puede modificar
- **Results API**: Usuarios ven solo sus resultados, admin ve todos
- **Settings API**: Solo admin puede modificar configuraciones
- **Payments API**: Protegido según contexto

**Helpers de autenticación:**
```typescript
requireAuth(req)   // Requiere cualquier usuario autenticado
requireAdmin(req)  // Requiere usuario con rol admin
getCurrentUser(req) // Obtiene usuario actual (null si no autenticado)
```

### 3. **Validación Obligatoria de Webhooks de Wompi**

**Antes:** El webhook aceptaba requests sin validar si no había secret configurado
```typescript
if (EVENTS_SECRET) {
    // validar
}
```

**Ahora:** Validación obligatoria con error si falta configuración
```typescript
if (!EVENTS_SECRET) {
    throw new Error('WOMPI_EVENTS_SECRET debe estar configurado');
}
// Siempre valida la firma
```

### 4. **Logs de Prisma Solo en Desarrollo**

**Antes:** Logs de queries SQL en todos los ambientes
```typescript
new PrismaClient({ log: ['query'] })
```

**Ahora:** Logs condicionales según ambiente
```typescript
new PrismaClient({
    log: process.env.NODE_ENV === 'production' 
        ? ['error'] 
        : ['query', 'error', 'warn']
})
```

### 5. **Validaciones Mejoradas**

Creado `src/lib/validation.ts` con helpers de validación:

```typescript
validateEmail(email)        // Valida formato de email
validatePassword(password)  // Valida contraseña (min 6 caracteres)
validateCategory(category)  // Valida categorías A2/B1/C1
validateRole(role)          // Valida roles admin/user
parsePaginationParams()     // Parsea y valida paginación
```

### 6. **Tipos TypeScript Estrictos**

Se reemplazó el uso de `any` por tipos específicos:

```typescript
// Webhook con tipos estrictos
type WompiTransaction = {
    id: string;
    reference: string;
    status: string;
    amount_in_cents: number;
    currency: string;
    payment_method_type?: string;
    customer_email?: string;
};
```

## 📊 Mejoras de Rendimiento

### 7. **Paginación en Endpoints**

Todos los endpoints de listado ahora soportan paginación:

```typescript
GET /api/users?page=1&limit=50
GET /api/results?page=1&limit=50

// Response incluye metadata
{
    users: [...],
    total: 150,
    limit: 50,
    skip: 0
}
```

### 8. **Sanitización de Datos de Usuario**

Solo se envían campos necesarios al cliente:

```typescript
type SafeUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    // ... campos públicos
    // password nunca se incluye
};
```

## 🔧 Mejoras de Código

### 9. **Manejo de Errores Mejorado**

- Mensajes de error en español y descriptivos
- Códigos HTTP apropiados
- Logging de errores en servidor
- Manejo de errores de Prisma (P2002 = email duplicado, etc)

```typescript
catch (e: any) {
    console.error('Users POST error:', e);
    if (e.code === 'P2002') {
        return NextResponse.json(
            { error: 'El email ya está en uso' }, 
            { status: 400 }
        );
    }
    return NextResponse.json(
        { error: 'Error al actualizar usuario' }, 
        { status: 500 }
    );
}
```

### 10. **Validación de Inputs en Change Password**

Ahora usa autenticación del token (no se puede cambiar password de otros):

```typescript
// No se necesita enviar userId, se usa el del token
const currentUser = await requireAuth(req);
await prisma.user.update({
    where: { id: currentUser.id },
    data: { password: hashedPassword }
});
```

## 📝 Configuración

### Variables de Entorno Requeridas

Creado `.env.example` con todas las variables necesarias:

```env
# Database
DATABASE_URL="postgresql://..."

# JWT Secret (cambiar en producción)
JWT_SECRET="your-secure-secret"

# SMTP para emails
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email"
SMTP_PASS="your-password"
SMTP_FROM="noreply@cale.com"

# App URL
APP_URL="https://your-domain.com"

# Wompi (OBLIGATORIOS)
NEXT_PUBLIC_WOMPI_PUBLIC_KEY="pub_test_..."
WOMPI_INTEGRITY_SECRET="test_integrity_..."
WOMPI_EVENTS_SECRET="test_events_..."
WOMPI_BASE_URL="https://production.wompi.co/v1"
```

## 🚀 Migración del Frontend

### Cambios Necesarios en el Cliente

#### 1. Login actualizado
```typescript
// Ahora la cookie se establece automáticamente
const response = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include', // IMPORTANTE
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
});
```

#### 2. Obtener usuario actual
```typescript
// Reemplazar storage.getCurrentUser() con:
const user = await storage.getCurrentUser(); // Ahora es async
```

#### 3. Logout
```typescript
// Reemplazar storage.setCurrentUser(null) con:
await storage.logout();
```

#### 4. Todas las requests API
```typescript
// Agregar credentials: 'include' a todas las fetch
fetch('/api/...', {
    credentials: 'include',
    // ...
});
```

## 🔐 Recomendaciones Adicionales

### Pendientes de Implementar (Opcional)

1. **Rate Limiting con Redis/Vercel KV**
   - Actualmente usa memoria (funciona en single-instance)
   - Para múltiples instancias, usar Redis

2. **Monitoreo de Errores**
   - Integrar Sentry u otro servicio
   - Enviar alertas de errores críticos

3. **Tests**
   - Tests unitarios para helpers de validación
   - Tests de integración para endpoints
   - Tests E2E para flujos críticos

4. **CORS Explícito**
   - Configurar headers CORS si se necesita
   - Actualmente Next.js maneja esto por defecto

5. **Caché**
   - Cachear preguntas (cambian poco)
   - Cachear configuraciones de app
   - Usar ISR o Redis

## 📚 Estructura de Archivos Clave

```
src/
├── lib/
│   ├── auth.ts           # Sistema JWT y autenticación
│   ├── validation.ts     # Helpers de validación
│   ├── prisma.ts         # Cliente Prisma configurado
│   ├── rate-limit.ts     # Rate limiting (memoria)
│   ├── storage.ts        # Actualizad para usar cookies
│   └── email.ts          # Envío de emails
├── app/
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   ├── me/route.ts
│       │   ├── change-password/route.ts
│       │   ├── forgot-password/route.ts
│       │   └── reset-password/route.ts
│       ├── users/route.ts      # Protegido: admin
│       ├── questions/route.ts  # Protegido: auth (admin=edit)
│       ├── results/route.ts    # Protegido: auth
│       ├── settings/route.ts   # Protegido: admin
│       └── payments/
│           ├── webhook/route.ts
│           └── sign/route.ts
└── components/
    └── SessionManager.tsx  # Actualizado para cookies

.env.example               # Template de configuración
```

## ⚠️ Breaking Changes

### Para Usuarios Existentes

1. **Sesiones existentes se perderán** - Los usuarios deberán volver a iniciar sesión
2. **storage.getCurrentUser() ahora es async** - Actualizar todos los usos
3. **storage.setCurrentUser() ya no existe** - Usar login/logout endpoints
4. **Todas las requests API necesitan credentials: 'include'**

### Migración de Datos

No se requiere migración de base de datos. Las contraseñas hasheadas existentes siguen funcionando.

## 🎯 Checklist de Deployment

- [ ] Configurar todas las variables de entorno en producción
- [ ] Cambiar `JWT_SECRET` a valor aleatorio seguro
- [ ] Verificar `WOMPI_EVENTS_SECRET` configurado
- [ ] Verificar SMTP configurado para emails
- [ ] Actualizar código frontend para usar nuevo sistema
- [ ] Probar login/logout completo
- [ ] Probar que webhooks de Wompi funcionan
- [ ] Verificar rate limiting funciona
- [ ] Probar flujo de password reset

## 📞 Soporte

Para problemas o dudas sobre las mejoras implementadas, revisar:
- Logs del servidor para errores específicos
- Consola del navegador para errores de autenticación
- Variables de entorno configuradas correctamente
