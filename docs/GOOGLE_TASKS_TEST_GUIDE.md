# 🧪 Guía de Prueba: Integración Google Tasks

## 🎯 **Flujo UX Completo - Prueba Paso a Paso**

### **Pre-requisitos**
- ✅ Servidor backend funcionando
- ✅ Frontend funcionando
- ✅ Usuario logueado con Google
- ✅ Dependencia `googleapis` instalada

---

## 🚀 **Paso 1: Acceder a la Configuración**

### **¿Cómo lo hace el usuario?**
1. Va a la página **"Tareas"** (`/tareas`)
2. Ve un **icono de Google** 🔵 en la barra superior derecha
3. Hace clic en el icono de Google

### **¿Qué debería ver?**
- Modal con título "Configuración de Google Tasks"
- Estado: **"Desconectado"** (primera vez)
- Botón azul: **"Conectar con Google Tasks"**

---

## 🔗 **Paso 2: Conectar con Google**

### **¿Cómo lo hace el usuario?**
1. Hace clic en **"Conectar con Google Tasks"**
2. Se abre una ventana emergente de Google OAuth
3. Selecciona su cuenta Google
4. Acepta los permisos para Google Tasks

### **¿Qué debería pasar?**
- ✅ Ventana emergente se cierra automáticamente
- ✅ Modal muestra: **"Conectado"** ✅
- ✅ Aparece información de última sincronización
- ✅ Se ejecuta primera sincronización automática

---

## 📝 **Paso 3: Crear/Editar Tareas**

### **¿Cómo lo hace el usuario?**
1. Hace clic en **"Nueva Tarea"**
2. Llena el formulario:
   - Título: "Prueba Google Tasks"
   - Descripción: "Tarea de prueba para sincronización"
   - Fecha vencimiento: Mañana
   - Subtareas: "Subtarea 1", "Subtarea 2"
3. Hace clic en **"Guardar"**

### **¿Qué debería pasar automáticamente?**
- ✅ Tarea se guarda en Attadia
- ✅ **Sincronización automática** en background (sin que el usuario espere)
- ✅ Tarea aparece en Google Tasks (revisar en Google Tasks app)
- ✅ Icono de Google ✅ aparece junto a la tarea en la lista

---

## 🔄 **Paso 4: Verificar Sincronización**

### **¿Cómo verificar que funciona?**

**En Attadia:**
- Tarea muestra ícono de Google ✅
- Al abrir la tarea para editar, botón de Google está verde

**En Google Tasks (app móvil o web):**
- Abrir Google Tasks
- Ver lista "Attadia Tasks" (creada automáticamente)
- Verificar que la tarea está ahí con:
  - ✅ Mismo título
  - ✅ Misma descripción
  - ✅ Fecha de vencimiento
  - ✅ Subtareas como tareas hijas

---

## 🎛️ **Paso 5: Configurar Sincronización**

### **¿Cómo personalizar la sincronización?**
1. Abrir configuración de Google Tasks
2. Cambiar **"Dirección de Sincronización"**:
   - **Bidireccional**: Sincroniza en ambas direcciones
   - **Solo hacia Google**: Solo de Attadia → Google Tasks  
   - **Solo desde Google**: Solo de Google Tasks → Attadia

### **¿Qué debería ver?**
- Información de sincronización automática:
  - "🤖 Sincronización Automática Activa"
  - "Al crear/editar tareas se sincronizan automáticamente"
  - "Sincronización cada 15 minutos para usuarios activos"

---

## 📊 **Paso 6: Ver Estadísticas**

### **¿Qué estadísticas debería ver?**
- **Sincronizadas**: Número de tareas sincronizadas exitosamente
- **Pendientes**: Tareas esperando sincronización
- **Con Errores**: Tareas que fallaron al sincronizar
- **Total**: Total de tareas con sync habilitado

---

## 🧪 **Pruebas Avanzadas**

### **Test 1: Sincronización Bidireccional**
1. Crear tarea en Google Tasks directamente
2. Esperar 15 minutos O hacer clic en "Sincronizar Ahora"
3. Verificar que aparece en Attadia

### **Test 2: Edición desde Google**
1. Marcar tarea como completada en Google Tasks
2. Esperar sincronización
3. Verificar que se marca como completada en Attadia

### **Test 3: Subtareas**
1. Crear tarea con subtareas en Attadia
2. Verificar en Google Tasks que aparecen como tareas hijas
3. Completar subtarea en Google Tasks
4. Verificar que se actualiza en Attadia

---

## ⚠️ **Posibles Problemas y Soluciones**

### **Problema: "Error al conectar con Google Tasks"**
**Solución:**
1. Verificar que las variables de entorno están configuradas:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALLBACK_URL`

### **Problema: "Tarea no se sincroniza"**
**Solución:**
1. Revisar logs del servidor
2. Verificar que el usuario tiene permisos de Google Tasks
3. Intentar sincronización manual

### **Problema: "Ventana emergente bloqueada"**
**Solución:**
1. Permitir ventanas emergentes en el navegador
2. Intentar de nuevo

---

## 🎯 **Criterios de Éxito**

### **✅ La integración funciona si:**
- Usuario puede conectar/desconectar Google Tasks fácilmente
- Tareas se sincronizan automáticamente al crear/editar
- Indicadores visuales muestran estado de sincronización
- Sincronización bidireccional funciona correctamente
- Estadísticas se actualizan en tiempo real
- No hay errores en consola del navegador

### **🎉 Experiencia de Usuario Ideal:**
1. **Setup una vez**: Conectar Google Tasks (30 segundos)
2. **Olvidarse**: Todo se sincroniza automáticamente
3. **Transparente**: No interfiere con el flujo normal
4. **Confiable**: Siempre está actualizado
5. **Control**: Puede forzar sync si necesita

---

## 🚀 **¿Listo para Producción?**

Si todas las pruebas pasan, la integración está lista para:
- ✅ Usuarios finales
- ✅ Escalamiento
- ✅ Uso empresarial

¡La sincronización automática hace que los usuarios ni siquiera piensen en ello! 🎯
