# 🚀 ETAPA 2: Gestión Avanzada de Usuarios y Roles

## 📋 Objetivo
Implementar un sistema robusto de gestión de usuarios, roles y permisos para controlar el acceso a las distintas funcionalidades de la plataforma, tanto a nivel de organización como global.

## 🎯 Entregables
- [ ] CRUD completo de usuarios desde el panel de admin y de cada organización
- [ ] Gestión de roles: super admin, admin, manager, agente, invitado
- [ ] Asignación granular de permisos (por módulo y acción)
- [ ] Invitar usuarios por email y gestión de invitaciones
- [ ] Auditoría de acciones de usuarios (logs de actividad)
- [ ] Desactivación/reactivación de usuarios

## 🔧 Backend
- Definir estructura de roles y permisos en la base de datos y modelos.
- Crear endpoints REST para gestión de usuarios y roles (alta, baja, edición, asignación de roles, invitaciones, logs).
- Implementar lógica de autorización en middleware para cada endpoint según permisos.
- Registrar logs de actividad de usuarios (login, cambios, acciones críticas).
- Validar unicidad de email y restricciones de seguridad.

## 🎨 Frontend
- Crear sección de administración de usuarios en el panel de cada organización y en el panel global.
- Listado de usuarios con filtros por estado, rol y búsqueda.
- Formularios para alta, edición y asignación de roles.
- Modal para invitar usuarios por email y gestión de invitaciones pendientes.
- Visualización de logs de actividad por usuario.
- Acciones rápidas: desactivar, reactivar, resetear contraseña.

## 🧪 Testing
- Pruebas unitarias y de integración para endpoints de usuarios y roles.
- Pruebas de UI para formularios y flujos de invitación.
- Pruebas de seguridad: acceso restringido según permisos.

## 🚀 Criterios de Aceptación
1. ✅ El super admin puede gestionar todos los usuarios y roles globalmente.
2. ✅ Los admins de organización pueden gestionar usuarios de su empresa.
3. ✅ Los permisos se aplican correctamente en toda la plataforma.
4. ✅ El sistema de invitaciones funciona y es seguro.
5. ✅ Los logs de actividad son consultables y exportables.
6. ✅ Los tests pasan al 100%.

## ⏱️ Tiempo Estimado
- **Desarrollo:** 3 días
- **Testing:** 1 día
- **Total:** 4 días

## 🔗 Dependencias
- Etapa 1 completada (Configuración Base y Autenticación)
- Base de datos configurada y funcionando
- Sistema de autenticación implementado

## 🔄 Integración con Otras Etapas
- **Etapa 3 (Contactos/Organizaciones):** Los usuarios y roles controlarán el acceso a datos de contactos
- **Etapa 4 (Conversaciones):** Los permisos determinarán qué conversaciones puede ver cada usuario
- **Etapa 5 (Bot Flows):** Los roles definirán quién puede crear y gestionar flujos automatizados
- **Etapa 6 (Tickets):** Los permisos controlarán la asignación y gestión de tickets
- **Etapa 8 (Reportes):** Los roles determinarán qué reportes puede acceder cada usuario
- **Etapa 9 (Seguridad):** Se implementarán auditorías específicas por rol y usuario 