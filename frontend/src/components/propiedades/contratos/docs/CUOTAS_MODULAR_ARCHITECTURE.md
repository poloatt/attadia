# Arquitectura Modular de Cuotas

## Resumen

Este documento describe la nueva arquitectura modular implementada para resolver los conflictos de sincronización y persistencia entre los componentes de cuotas en el sistema de contratos.

## Problemas Resueltos

### 1. Duplicación de Estilos
- **Problema**: `ContratoCuotasSection` tenía estilos definidos internamente, mientras que otros componentes usaban estilos compartidos.
- **Solución**: Se centralizaron todos los estilos en `ContratoFormStyles.jsx` con componentes específicos para cuotas.

### 2. Inconsistencia en Estilos Geométricos
- **Problema**: Algunos componentes no seguían completamente el estilo geométrico (sin bordes redondeados).
- **Solución**: Se aplicó consistentemente `borderRadius: 0` en todos los componentes de cuotas.

### 3. Falta de Sincronización
- **Problema**: Los componentes no compartían un estado común para las cuotas.
- **Solución**: Se implementó un contexto (`CuotasContext`) y un hook personalizado (`useCuotasState`).

### 4. Duplicación de Lógica
- **Problema**: Funciones similares estaban duplicadas en diferentes componentes.
- **Solución**: Se centralizó la lógica en el hook `useCuotasState` y el contexto.

## Arquitectura

### Componentes de Estilo Compartidos

```javascript
// ContratoFormStyles.jsx
export const StyledTableContainer = styled(TableContainer)({...});
export const StyledCuotasTextField = styled(TextField)({...});
export const StyledCuotasChip = styled(Chip)({...});
export const StyledCuotasIconButton = styled(IconButton)({...});
export const StyledCuotasCheckbox = styled(Box)({...});
```

### Hook Personalizado

```javascript
// hooks/useCuotasState.js
export const useCuotasState = (formData, onCuotasChange, useContext = true) => {
  // Lógica centralizada para manejo de cuotas
};
```

### Contexto de Sincronización

```javascript
// context/CuotasContext.jsx
export const CuotasProvider = ({ children, contratoId }) => {
  // Estado global compartido entre componentes
};
```

## Componentes Actualizados

### 1. ContratoCuotasSection
- **Antes**: Estilos internos, lógica duplicada
- **Después**: Usa estilos compartidos y hook personalizado
- **Beneficios**: Consistencia visual, código más limpio

### 2. EstadoFinanzasContrato
- **Antes**: Estilos inconsistentes, lógica independiente
- **Después**: Usa estilos compartidos, integración con contexto
- **Beneficios**: Sincronización automática, estilo consistente

### 3. PropiedadCard
- **Antes**: Lógica de cuotas duplicada
- **Después**: Usa el contexto para sincronización
- **Beneficios**: Estado compartido, actualizaciones automáticas

## Uso

### En ContratoForm
```javascript
import { CuotasProvider } from './context/CuotasContext';

<CuotasProvider contratoId={contratoId}>
  <ContratoCuotasSection 
    formData={formData}
    onCuotasChange={handleCuotasChange}
  />
</CuotasProvider>
```

### En PropiedadCard
```javascript
import { useCuotasContext } from './context/CuotasContext';

const { cuotas, updateCuotaEstado } = useCuotasContext();
```

### En EstadoFinanzasContrato
```javascript
import { useCuotasState } from './hooks/useCuotasState';

const { cuotas, updateCuotaMonto } = useCuotasState(formData, onCuotasChange);
```

## Beneficios

1. **Consistencia Visual**: Todos los componentes siguen el mismo estilo geométrico
2. **Sincronización Automática**: Cambios en un componente se reflejan en otros
3. **Código Reutilizable**: Lógica centralizada reduce duplicación
4. **Mantenibilidad**: Cambios en un lugar afectan a todos los componentes
5. **Escalabilidad**: Fácil agregar nuevos componentes de cuotas

## Reglas de Estilo

### Estilo Geométrico
- Todos los componentes deben usar `borderRadius: 0`
- Evitar formas redondeadas
- Usar bordes rectos y ángulos definidos

### Colores Consistentes
- Estados de cuotas: PAGADO (#4caf50), VENCIDA (#f44336), PENDIENTE (#ff9800)
- Usar `theme.palette` para colores del sistema

### Espaciado
- Usar `theme.spacing()` para consistencia
- Mantener espaciado uniforme entre elementos

## Migración

Para migrar componentes existentes:

1. Importar estilos compartidos de `ContratoFormStyles.jsx`
2. Reemplazar estilos internos con componentes compartidos
3. Usar `useCuotasState` para lógica de cuotas
4. Envolver en `CuotasProvider` si se necesita sincronización
5. Aplicar `borderRadius: 0` en todos los elementos

## Próximos Pasos

1. Migrar otros componentes de cuotas a la nueva arquitectura
2. Implementar tests para el hook y contexto
3. Documentar casos de uso específicos
4. Optimizar rendimiento con React.memo donde sea necesario 