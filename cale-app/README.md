# 🚗 CALE - Plataforma de Evaluación de Conducción

Sistema completo de evaluación para exámenes de conducción en Colombia. Categorías A2, B1 y C1 con evaluaciones interactivas, sistema de pagos y análisis de resultados.

**🌐 LIVE**: https://evaluacion-cale.vercel.app | **Status**: ✅ Producción Active

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-success)](https://www.prisma.io/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.0-cyan)](https://tailwindcss.com/)

---

## ✨ Características Principales

### Seguridad 🔒
- ✅ Autenticación JWT con cookies HTTP-only
- ✅ Autorización por roles (admin/usuario)
- ✅ Rate limiting en endpoints críticos
- ✅ Validación completa de inputs
- ✅ Protección contra XSS y CSRF
- ✅ Passwords hasheados con bcrypt
- ✅ Tokens de reset de contraseña seguros

### Funcionalidades 🎯
- 📝 Exámenes interactivos (A2, B1, C1)
- ⏱️ Temporizador por examen
- 📊 Análisis detallado de resultados
- 👥 Panel de administración completo
- 💳 Integración con Wompi (pagos)
- 📧 Sistema de recuperación de contraseña
- 🔄 Sincronización en tiempo real

### Tecnología 💻
- Next.js 16 (App Router)
- TypeScript estricto
- Prisma ORM (PostgreSQL)
- Tailwind CSS 4
- Framer Motion (animaciones)
- Chart.js (gráficos)

---

## 📚 Documentación

### Para Desarrolladores

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Guía completa de deployment paso a paso
- **[SECURITY_IMPROVEMENTS.md](./SECURITY_IMPROVEMENTS.md)** - Detalles de mejoras de seguridad implementadas
- **[FRONTEND_MIGRATION.md](./FRONTEND_MIGRATION.md)** - Guía para migrar componentes al nuevo sistema
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Resumen ejecutivo de correcciones

### Inicio Rápido

1. **Ver [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** para instrucciones completas
2. **Configurar variables de entorno** desde `.env.example`
3. **Ejecutar migraciones** con `npx prisma migrate deploy`
4. **Iniciar servidor** con `npm run dev`

---

## 🚀 Quick Start (Desarrollo)

### Requisitos Previos

- Node.js 18+
- PostgreSQL database
- Cuenta Wompi (para pagos)
- SMTP server (para emails)

### Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd cale-app

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Generar JWT secret
openssl rand -hex 32  # Copiar resultado a JWT_SECRET en .env

# Ejecutar migraciones
npx prisma migrate deploy

# (Opcional) Seed data inicial
npx prisma db seed

# Iniciar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## 📁 Estructura del Proyecto

```
cale-app/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/             # API Routes
│   │   │   ├── auth/        # Autenticación
│   │   │   ├── payments/    # Pagos y webhooks
│   │   │   ├── questions/   # Preguntas
│   │   │   ├── results/     # Resultados
│   │   │   └── users/       # Usuarios
│   │   ├── admin/           # Panel de administración
│   │   ├── dashboard/       # Dashboard de usuario
│   │   ├── exam/            # Página de examen
│   │   └── page.tsx         # Landing page
│   ├── components/          # Componentes React
│   │   ├── AdminSidebar.tsx
│   │   ├── Modal.tsx
│   │   ├── SessionManager.tsx
│   │   └── WompiWidget.tsx
│   └── lib/                 # Utilidades
│       ├── auth.ts          # Sistema de autenticación JWT
│       ├── auth-client.ts   # Cliente de autenticación
│       ├── validation.ts    # Validadores
│       ├── prisma.ts        # Cliente Prisma
│       ├── storage.ts       # Storage helpers
│       ├── rate-limit.ts    # Rate limiting
│       ├── email.ts         # Envío de emails
│       └── data.ts          # Tipos TypeScript
├── prisma/
│   ├── schema.prisma        # Schema de base de datos
│   ├── seed.ts             # Seed data
│   └── migrations/         # Migraciones
├── public/                  # Assets estáticos
├── .env.example            # Template de variables de entorno
└── [Documentación]         # 4 guías completas

```

---

## 🔐 Seguridad

Este proyecto implementa las mejores prácticas de seguridad:

- **Autenticación**: JWT con cookies HTTP-only (no vulnerable a XSS)
- **Autorización**: Middleware de protección en todas las rutas sensibles
- **Validación**: Validación estricta de todos los inputs
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **SQL Injection**: Protegido por Prisma ORM
- **CSRF**: Mitigado con SameSite cookies
- **Secrets**: Validación obligatoria de secrets al inicio

Ver [SECURITY_IMPROVEMENTS.md](./SECURITY_IMPROVEMENTS.md) para detalles completos.

---

## 🎨 Stack Tecnológico

### Backend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Database**: PostgreSQL
- **ORM**: Prisma 5.22
- **Auth**: JWT (implementación custom)
- **Validation**: Custom validators
- **Email**: Nodemailer

### Frontend
- **Framework**: React 19
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion 12
- **Charts**: Chart.js 4 + react-chartjs-2
- **Icons**: Lucide React
- **State**: React useState/useEffect

### Payments
- **Gateway**: Wompi (Colombia)
- **Integration**: Webhooks + Widget

### DevOps
- **Hosting**: Vercel
- **Database**: PostgreSQL (Vercel Postgres / Supabase / otro)
- **CI/CD**: Vercel GitHub integration

---

## 👥 Roles de Usuario

### Usuario Regular
- Tomar exámenesde categorías A2, B1, C1
- Ver historial de resultados propios
- Actualizar perfil
- Cambiar contraseña
- Comprar acceso PRO
- **Limitación Free**: 1 examen por día, 15 preguntas, 15 minutos

### Usuario PRO
- Exámenes ilimitados
- 40 preguntas por examen
- 50 minutos por examen
- Sin restricciones diarias
- Acceso por 120 días después de pago

### Administrador
- Gestionar usuarios
- Gestionar preguntas
- Ver todos los resultados
- Ver analytics
- Gestionar configuraciones
- Ver pagos

---

## 💳 Sistema de Pagos

### Wompi Integration

El sistema usa Wompi para procesar pagos:

1. Usuario hace clic en "Obtener PRO"
2. Widget de Wompi se carga con firma de integridad
3. Usuario completa pago
4. Webhook recibe notificación
5. Sistema valida firma del webhook
6. Usuario se actualiza a PRO por 120 días

#### Configuración de Wompi

Ver `.env.example` para variables necesarias:
- `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` - Llave pública
- `WOMPI_INTEGRITY_SECRET` - Secret para firma
- `WOMPI_EVENTS_SECRET` - Secret para webhooks

---

## 📧 Sistema de Email

### Configuración SMTP

Para recuperación de contraseña, configurar en `.env`:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-app-password"
SMTP_FROM="noreply@tudominio.com"
```

**Nota**: Para Gmail, usar [App Passwords](https://support.google.com/accounts/answer/185833)

---

## 🗃️ Base de Datos

### Schema Principal

- **User** - Usuarios del sistema
- **Question** - Banco de preguntas
- **Result** - Resultados de exámenes
- **Payment** - Registro de pagos
- **AppSetting** - Configuraciones de app
- **PasswordResetToken** - Tokens de reset

### Migraciones

```bash
# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones en producción
npx prisma migrate deploy

# Abrir Prisma Studio
npx prisma studio
```

---

## 🧪 Testing

### Test Manual

```bash
# Iniciar servidor de desarrollo
npm run dev

# En otra terminal, test de webhook
cd scripts
.\test-wompi-webhook.ps1
```

### Checklist de Testing

Ver [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) para checklist completo.

---

## 📊 Analytics y Métricas

### Panel de Admin

El panel de admin incluye:
- Gráfico de resultados por categoría
- Top preguntas falladas
- Usuarios activos
- Conversión a PRO
- Métricas de exámenes

---

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo

# Producción
npm run build        # Build de producción
npm start            # Iniciar servidor de producción

# Linting
npm run lint         # Ejecutar ESLint

# Base de datos
npx prisma studio    # Abrir Prisma Studio
npx prisma migrate   # Gestionar migraciones
npx prisma generate  # Generar cliente de Prisma
```

---

## 🐛 Troubleshooting

Ver [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) sección de Troubleshooting para soluciones a problemas comunes.

### Problemas Frecuentes

1. **Error de autenticación**: Verificar `JWT_SECRET` configurado
2. **Webhook falla**: Verificar `WOMPI_EVENTS_SECRET` correcto
3. **Email no se envía**: Verificar configuración SMTP
4. **401 Unauthorized**: Verificar `credentials: 'include'` en fetch

---

## 📝 Changelog

### v2.0.0 - Refactorización de Seguridad (2026-02-09)

- ✅ Sistema de autenticación JWT con cookies HTTP-only
- ✅ Protección completa de APIs
- ✅ Validación estricta de inputs
- ✅ Paginación en endpoints
- ✅ Tipos TypeScript estrictos
- ✅ Documentación completa

Ver [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) para detalles.

---

## 📄 Licencia

Proyecto propietario - Todos los derechos reservados

---

## 🤝 Contribución

Proyecto privado. Para cambios:

1. Crear branch de feature
2. Hacer cambios
3. Ejecutar `npm run lint`
4. Crear pull request
5. Esperar revisión

---

## 📞 Soporte

Para preguntas o problemas:

1. Revisar documentación en este README
2. Consultar guías en la carpeta raíz
3. Revisar logs de Vercel
4. Contactar al equipo de desarrollo

---

## 🎉 Créditos

Desarrollado para CALE - Centro de Aprendizaje de Licencias de Conducción

**Stack**: Next.js + TypeScript + Prisma + PostgreSQL + Tailwind CSS
**Deployment**: Vercel
**Payments**: Wompi

---

**¡Listo para ayudar a miles de conductores a obtener su licencia!** 🚗💨
