# 🚀 CALE - Configuración de Deployment

**Proyecto**: Sistema de Evaluación CALE  
**Fecha actualización**: 9 February 2026  
**Estado**: ✅ LIVE en Producción

---

## 📦 **Repositorio Git**

**URL**: https://github.com/sin-fronteras-cale/evaluacion-cale.git  
**Rama principal**: `main`  
**Último commit**: `c6371ac` - "🚀 Force Vercel deployment"

### Comandos Git para deploy:
```bash
cd "c:\Users\Gerente SF\Desktop\Cale Vercel\Cale\cale-app"
git add .
git commit -m "Descripción de cambios"
git push origin main
```

---

## 🌐 **Configuración Vercel**

**URL Principal**: https://evaluacion-cale.vercel.app  
**Dashboard**: https://vercel.com/sinfronteras-projects/evaluacion-cale  
**Proyecto ID**: `prj_rswDYRBnNJAaTKJfrGvpfQQxOJ6i`  
**Organización**: `team_a0BixSIvDLzIl18hty6PbP3m`  
**Scope**: SinFronteras' projects

### Deploy automático configurado:
- ✅ Git push → Vercel deploy automático
- ✅ Framework: Next.js 16.1.6 detectado automáticamente
- ✅ Build command: `npm run build`
- ✅ Output directory: `.next`

---

## 🔧 **Variables de Entorno (Vercel Dashboard)**

**Configurar en**: https://vercel.com/sinfronteras-projects/evaluacion-cale/settings/environment-variables

### Variables críticas:
```env
# Database
DATABASE_URL=postgresql://neondb_owner:npg_VUyXHT5Jx9vY@ep-little-sun-ai40kd1y-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Payments (Wompi)
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_prod_LYUYWH663AMg06z0v1bGGSiS2zhJu3EN
WOMPI_PRIVATE_KEY=prv_prod_RDe9psTXCRKrUKzQfDLzyO6BOEUYcUzf
WOMPI_EVENTS_SECRET=secret_key_for_webhooks_change_this_in_production
WOMPI_INTEGRITY_SECRET=prod_integrity_secret_PLACEHOLDER
WOMPI_BASE_URL=https://production.wompi.co/v1

# Authentication
JWT_SECRET=your_jwt_secret_change_this_in_production_make_it_long_and_secure

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=evaluacioncale@gmail.com
SMTP_PASS=csnj bqpw ismo pcng
SMTP_FROM=CALE <evaluacioncale@gmail.com>

# Email Service (Opcional)
RESEND_API_KEY=re_placeholder_replace_with_real_resend_key

# App Configuration
APP_URL=https://evaluacion-cale.vercel.app
```

---

## 🗄️ **Base de Datos (Neon PostgreSQL)**

**Provider**: Neon  
**Proyecto**: young-wave-24555336  
**Host**: ep-little-sun-ai40kd1y-pooler.c-4.us-east-1.aws.neon.tech  
**Database**: neondb  
**Usuario**: neondb_owner

### Estado actual:
- ✅ 11 usuarios registrados
- ✅ 300 preguntas categorizadas (A2, B1, C1)
- ✅ 5 resultados de exámenes
- ✅ Prisma ORM configurado

---

## 🔐 **Credenciales de Prueba**

### Admin:
- **Email**: carlospt@live.com
- **Password**: admin123
- **Rol**: Administrador completo

### Usuario regular:
- **Email**: test@test.com  
- **Password**: test123
- **Rol**: Usuario estándar

---

## ⚙️ **Comandos Útiles**

### Verificar estado Vercel:
```bash
cd "c:\Users\Gerente SF\Desktop\Cale Vercel\Cale\cale-app"
npx vercel ls
```

### Deploy manual (si necesario):
```bash
cd "c:\Users\Gerente SF\Desktop\Cale Vercel\Cale\cale-app"
npx vercel --prod
```

### Forzar redeploy:
```bash
cd "c:\Users\Gerente SF\Desktop\Cale Vercel\Cale\cale-app"
git commit --allow-empty -m "🚀 Force redeploy"
git push origin main
```

### Ver logs de build:
```bash
npx vercel inspect URL_DEL_DEPLOY --logs
```

---

## 📂 **Estructura del Proyecto**

```
cale-app/
├── .vercel/           # Configuración local de Vercel
├── prisma/           # Esquemas de base de datos
├── src/
│   ├── app/          # App Router (Next.js 16)
│   ├── components/   # Componentes reutilizables
│   └── lib/          # Utilidades y configuraciones
├── .env.local        # Variables de entorno locales
├── vercel.json       # Configuración de Vercel
└── package.json      # Dependencias
```

---

## 🔄 **Workflow de Deploy**

1. **Desarrollo local**: `npm run dev`
2. **Cambios**: Editar código
3. **Commit**: `git add . && git commit -m "mensaje"`
4. **Deploy**: `git push origin main`
5. **Verificar**: Vercel deploya automáticamente
6. **Probar**: https://evaluacion-cale.vercel.app

---

## 🆘 **Solución de Problemas**

### Si el deploy falla:
1. Verificar variables de entorno en Vercel dashboard
2. Revisar logs: `npx vercel inspect URL --logs`
3. Variables críticas: JWT_SECRET, WOMPI_EVENTS_SECRET, DATABASE_URL

### Si hay errores de build:
1. Probar local: `npm run build`
2. Verificar TypeScript: `npx tsc --noEmit`
3. Limpiar cache: `rm -rf .next && npm run build`

---

## 📱 **Enlaces Rápidos**

- **🌐 Aplicación**: https://evaluacion-cale.vercel.app
- **⚙️ Vercel Dashboard**: https://vercel.com/sinfronteras-projects/evaluacion-cale
- **🔧 Variables Env**: https://vercel.com/sinfronteras-projects/evaluacion-cale/settings/environment-variables
- **📦 GitHub**: https://github.com/sin-fronteras-cale/evaluacion-cale
- **📊 Deploys**: https://vercel.com/sinfronteras-projects/evaluacion-cale/deployments

---

**✅ Todo funcionando correctamente - Deploy automático configurado**