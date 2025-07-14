cd atta# Sistema de Gestión de Rutinas

## 📋 Descripción
Sistema modular para la gestión y seguimiento de rutinas diarias, con soporte para diferentes tipos de hábitos y configuraciones personalizadas.

## 🏗️ Arquitectura

### Contextos
- **RutinasContext**: Estado global de rutinas
- **rutinasHistoricalContext**: Historial y seguimiento
- **RutinasStatisticsContext**: Métricas y estadísticas

### Hooks Personalizados
- **useDebounce**: Control de frecuencia de actualizaciones
- **useLocalPreservationState**: Persistencia de estado local
- **useOptimisticUpdate**: Actualizaciones UI optimistas

### Servicios
- **rutinasService**: Operaciones CRUD y gestión de caché

## 🧩 Componentes Principales

### RutinaTable
Componente principal que muestra y gestiona la rutina actual.
- Navegación entre rutinas
- Vista de secciones
- Integración con configuraciones

### ChecklistSection
Gestiona secciones individuales de la rutina:
- Cuidado Personal
- Nutrición
- Ejercicio
- Limpieza

### ItemCadenciaConfig
Configuración de frecuencia para items:
- Diario
- Semanal
- Mensual
- Personalizado

### UserHabitsPreferences
Gestión de preferencias de usuario:
- Configuración global
- Preferencias por sección
- Sincronización con rutinas

## 🔄 Flujo de Datos

1. **Inicialización**
   - Carga de preferencias de usuario
   - Inicialización de contextos
   - Configuración de estado inicial

2. **Operaciones**
   - Actualización optimista de UI
   - Sincronización con backend
   - Preservación de cambios locales

3. **Persistencia**
   - Caché local
   - Sincronización con servidor
   - Manejo de conflictos

## 🛠️ Características Principales

- ✅ Actualización optimista de UI
- 🔄 Sincronización bidireccional
- 💾 Caché local
- 📊 Estadísticas y métricas
- 🎯 Seguimiento de progreso
- ⚙️ Configuración personalizada
- 📱 Diseño responsivo

## 🔧 Configuración

### Requisitos
- React 17+
- Material-UI 5+
- Axios para peticiones HTTP

### Instalación
```bash
npm install
npm run dev
```

### Estructura de Archivos
```
src/
  components/
    rutinas/
      context/         # Contextos globales
      hooks/          # Hooks personalizados
      services/       # Servicios y API
      utils/          # Utilidades
      *.jsx          # Componentes
```

## 📈 Métricas y Seguimiento

- Seguimiento de completación
- Estadísticas históricas
- Análisis de tendencias
- Reportes de progreso

## 🔐 Seguridad

- Validación de datos
- Control de acceso
- Manejo de errores
- Protección contra pérdida de datos

## 🎯 Mejores Prácticas

1. **Actualizaciones UI**
   - Usar actualizaciones optimistas
   - Implementar debounce
   - Manejar estados de carga

2. **Gestión de Estado**
   - Usar contextos apropiadamente
   - Implementar caché local
   - Manejar sincronización

3. **Rendimiento**
   - Implementar memorización
   - Optimizar renderizados
   - Gestionar recursos

## 🐛 Depuración

- Herramientas de desarrollo incluidas
- Sistema de logging detallado
- Utilidades de depuración

## 📚 Documentación Adicional

Para más detalles sobre componentes específicos, consultar:
- [Documentación de Contextos](./docs/contexts.md)
- [Guía de Hooks](./docs/hooks.md)
- [API de Servicios](./docs/services.md)

## 🤝 Contribución

1. Fork del repositorio
2. Crear rama feature
3. Commit cambios
4. Push a la rama
5. Crear Pull Request

## 📄 Licencia

MIT License - ver [LICENSE.md](LICENSE.md) para detalles

## 🔍 Troubleshooting

### Errores Comunes

1. **Error de Fecha Inválida**
   ```javascript
   TypeError: fechaInicio.getTime is not a function
   ```
   **Solución**: Asegurar que las fechas se inicialicen como objetos Date:
   ```javascript
   const fecha = new Date(fechaString);
   if (isNaN(fecha.getTime())) {
     // Manejar fecha inválida
   }
   ```

2. **Parámetros Inválidos en Servicios**
   ```javascript
   [RutinasService] ❌ Parámetros inválidos
   ```
   **Solución**: Validar parámetros antes de llamar al servicio:
   ```javascript
   if (!section || !itemId) {
     console.warn('Parámetros incompletos');
     return null;
   }
   ```

3. **Datos Históricos Simulados**
   ```javascript
   No se obtuvieron datos históricos reales
   ```
   **Solución**: 
   - Verificar conexión con el backend
   - Validar que el servicio de históricos esté funcionando
   - Comprobar permisos de usuario

4. **Corrección de Año Futuro**
   ```javascript
   Corrigiendo año futuro 2025 a 2024
   ```
   **Solución**: Implementar validación de fechas:
   ```javascript
   const normalizeYear = (date) => {
     const maxYear = 2024;
     if (date.getFullYear() > maxYear) {
       date.setFullYear(maxYear);
     }
     return date;
   };
   ```

### Prevención de Errores

1. **Validación de Fechas**
   - Siempre normalizar fechas antes de usarlas
   - Validar rangos de fechas válidos
   - Manejar zonas horarias correctamente

2. **Manejo de Estado**
   - Inicializar estados con valores por defecto
   - Validar datos antes de actualizaciones
   - Usar referencias para datos persistentes

3. **Carga de Datos**
   - Implementar retry logic para fallos de red
   - Usar datos simulados como fallback
   - Mantener cache local actualizado

4. **Optimización de Rendimiento**
   - Evitar re-renders innecesarios
   - Implementar memorización de cálculos
   - Usar lazy loading cuando sea posible

### Logs y Depuración

1. **Niveles de Log**
   ```javascript
   // Error crítico
   console.error('[RutinasService] Error al cargar historial:', error);
   
   // Advertencia
   console.warn('[RutinasService] Usando datos simulados');
   
   // Información
   console.log('[RutinasService] Historial cargado:', data);
   ```

2. **Herramientas de Desarrollo**
   - Chrome DevTools
   - React Developer Tools
   - Network Monitor

3. **Monitoreo de Estado**
   - Redux DevTools (si se usa Redux)
   - Context Inspector
   - Performance Profiler

### Mejores Prácticas

1. **Gestión de Errores**
   - Usar try-catch en operaciones asíncronas
   - Implementar error boundaries
   - Mostrar mensajes de error amigables

2. **Manejo de Datos**
   - Validar datos de entrada
   - Normalizar datos antes de procesarlos
   - Mantener consistencia en el formato

3. **Optimización**
   - Usar lazy loading
   - Implementar virtualización
   - Optimizar re-renders
