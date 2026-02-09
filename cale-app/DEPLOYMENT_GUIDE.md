# 🚀 Guía Rápida de Deployment

## Pre-requisitos

- Node.js 18+ instalado
- PostgreSQL database disponible
- Cuenta Wompi configurada
- Servidor SMTP para emails

---

## 📋 Paso 1: Variables de Entorno

### Copiar archivo de ejemplo

```bash
cp .env.example .env
```

### Configurar variables OBLIGATORIAS

Edita `.env` y configura:

```env
# Database (REQUERIDO)
DATABASE_URL="postgresql://usuario:password@host:5432/nombre_db?schema=public"

# JWT Secret (REQUERIDO - Generar uno nuevo)
JWT_SECRET="$(openssl rand -hex 32)"

# SMTP (REQUERIDO para password reset)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-app-password"
SMTP_FROM="noreply@tudominio.com"

# App URL (REQUERIDO)
APP_URL="https://tu-dominio-en-vercel.app"

# Wompi (REQUERIDO)
NEXT_PUBLIC_WOMPI_PUBLIC_KEY="pub_prod_tu_llave_publica"
WOMPI_INTEGRITY_SECRET="prod_integrity_secret"
WOMPI_EVENTS_SECRET="prod_events_secret"
WOMPI_BASE_URL="https://production.wompi.co/v1"
```

### Generar JWT_SECRET seguro

**Linux/Mac:**
```bash
openssl rand -hex 32
```

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 📦 Paso 2: Instalar Dependencias

```bash
npm install
```

---

## 🗃️ Paso 3: Base de Datos

### Ejecutar migraciones

```bash
npx prisma migrate deploy
```

### (Opcional) Seed data inicial

```bash
npx prisma db seed
```

### Verificar conexión

```bash
npx prisma studio
```

---

## 🏗️ Paso 4: Build Local

```bash
npm run build
```

### Si hay errores:

1. Verificar que todas las variables de entorno estén configuradas
2. Revisar logs de error
3. Verificar que JWT_SECRET esté configurado
4. Verificar que WOMPI_EVENTS_SECRET esté configurado

---

## 🧪 Paso 5: Testing Local

### Iniciar servidor de desarrollo

```bash
npm run dev
```

### Probar funcionalidades críticas:

#### 1. Autenticación
- [ ] Abrir http://localhost:3000
- [ ] Registrar nuevo usuario
- [ ] Cerrar sesión
- [ ] Iniciar sesión
- [ ] Refresh mantiene sesión
- [ ] Verificar cookie `auth_token` en DevTools

#### 2. Autorización
- [ ] Como usuario normal, intentar acceder /admin (debe redirigir)
- [ ] Como admin, acceder /admin
- [ ] Ver solo resultados propios como usuario
- [ ] Ver todos los resultados como admin

#### 3. Funcionalidades
- [ ] Cambiar contraseña
- [ ] Olvidé contraseña (verificar email)
- [ ] Tomar examen
- [ ] Ver resultados

#### 4. Webhook Wompi (Opcional)
```powershell
# Test webhook localmente
.\scripts\test-wompi-webhook.ps1
```

---

## ☁️ Paso 6: Deploy a Vercel

### Opción A: Desde la línea de comandos

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Opción B: Desde GitHub

1. Push código a GitHub
2. Ir a https://vercel.com
3. Import repository
4. Configurar variables de entorno en Vercel Dashboard
5. Deploy

### Configurar Variables en Vercel

En el Dashboard de Vercel → Settings → Environment Variables, agregar:

```
DATABASE_URL=postgresql://...
JWT_SECRET=tu-secret-generado
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email
SMTP_PASS=tu-password
SMTP_FROM=noreply@tudominio.com
APP_URL=https://tu-app.vercel.app
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_prod_...
WOMPI_INTEGRITY_SECRET=prod_...
WOMPI_EVENTS_SECRET=prod_...
WOMPI_BASE_URL=https://production.wompi.co/v1
```

---

## 🔧 Paso 7: Post-Deploy

### Configurar Webhook en Wompi

1. Ir al dashboard de Wompi
2. Configurar webhook URL: `https://tu-dominio.vercel.app/api/payments/webhook`
3. Guardar el Events Secret en tus variables de entorno

### Verificar funcionamiento

1. **Autenticación**
   ```bash
   curl -X POST https://tu-app.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

2. **Webhook**
   - Hacer un pago de prueba en Wompi
   - Verificar que el webhook se reciba correctamente
   - Verificar que el estado PRO se actualice

---

## 🐛 Troubleshooting

### Error: "WOMPI_EVENTS_SECRET debe estar configurado"

**Solución**: Agregar `WOMPI_EVENTS_SECRET` a variables de entorno

### Error: "JWT_SECRET debe estar configurado"

**Solución**: Generar y agregar `JWT_SECRET` a variables de entorno

### Error: "Database connection failed"

**Solución**: 
1. Verificar `DATABASE_URL` esté correcto
2. Verificar que la base de datos esté accesible
3. Correr `npx prisma migrate deploy`

### Error: 401 en todas las requests

**Solución**:
1. Verificar que frontend envíe `credentials: 'include'`
2. Verificar que cookies estén habilitadas en el navegador
3. Verificar `sameSite` config en cookies

### Error: Webhook signature mismatch

**Solución**:
1. Verificar que `WOMPI_EVENTS_SECRET` coincida con el configurado en Wompi
2. Verificar que el endpoint sea accesible públicamente

---

## 📊 Monitoreo Post-Deploy

### Logs en Vercel

```bash
vercel logs
```

### Verificar errores comunes

1. Revisar logs de errores 500
2. Verificar que webhooks lleguen correctamente
3. Monitorear tiempos de respuesta
4. Verificar que emails se envíen

---

## 🔐 Seguridad Post-Deploy

### Checklist de Seguridad

- [ ] JWT_SECRET es único y seguro (32+ caracteres)
- [ ] WOMPI_EVENTS_SECRET configurado correctamente
- [ ] SMTP password es app-specific (no password principal)
- [ ] DATABASE_URL no está expuesta públicamente
- [ ] Variables de entorno solo en servidor (no en código)
- [ ] HTTPS habilitado (Vercel lo hace automáticamente)
- [ ] Cookies configuradas como `secure: true` en producción

---

## 📈 Métricas a Monitorear

1. **Autenticación**
   - Tasa de éxito de login
   - Intentos de login fallidos
   - Rate limiting activaciones

2. **Pagos**
   - Webhooks recibidos
   - Pagos procesados vs fallidos
   - Tiempo de activación de PRO

3. **Performance**
   - Tiempo de respuesta de endpoints
   - Queries lentas de base de datos
   - Errores 500

---

## 🆘 Contacto de Soporte

Si encuentras problemas:

1. Revisar logs: `vercel logs`
2. Verificar variables de entorno
3. Consultar documentación:
   - `SECURITY_IMPROVEMENTS.md`
   - `FRONTEND_MIGRATION.md`
   - `IMPLEMENTATION_SUMMARY.md`

---

## ✅ Checklist Final

- [ ] Variables de entorno configuradas
- [ ] JWT_SECRET generado y configurado
- [ ] Base de datos migraciones ejecutadas
- [ ] Build local exitoso
- [ ] Testing local completado
- [ ] Deploy a Vercel exitoso
- [ ] Variables en Vercel configuradas
- [ ] Webhook Wompi configurado
- [ ] Testing en producción completado
- [ ] Monitoreo configurado

---

**¡Listo para producción!** 🚀

Tu aplicación ahora está desplegada con las mejores prácticas de seguridad implementadas.
