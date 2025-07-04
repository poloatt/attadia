import React, { useState } from 'react';
import { Box, Typography, Paper, Divider, Button } from '@mui/material';
import InlineItemConfig from './InlineItemConfig';
import InlineItemConfigImproved from './InlineItemConfigImproved';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

const ConfigComparison = () => {
  const [config, setConfig] = useState({
    tipo: 'DIARIO',
    frecuencia: 1,
    activo: true,
    periodo: 'CADA_DIA'
  });

  const [config2, setConfig2] = useState({
    tipo: 'SEMANAL',
    frecuencia: 3,
    activo: true,
    periodo: 'CADA_SEMANA'
  });

  const [config3, setConfig3] = useState({
    tipo: 'PERSONALIZADO',
    frecuencia: 2,
    activo: true,
    periodo: 'CADA_SEMANA'
  });

  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
    console.log('Configuración actualizada:', newConfig);
  };

  const handleConfig2Change = (newConfig) => {
    setConfig2(newConfig);
    console.log('Configuración 2 actualizada:', newConfig);
  };

  const handleConfig3Change = (newConfig) => {
    setConfig3(newConfig);
    console.log('Configuración 3 actualizada:', newConfig);
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#0a0a0a', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ color: '#fff', mb: 3, textAlign: 'center' }}>
        Comparación de Componentes de Configuración
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 3, mb: 4, alignItems: 'center', justifyContent: 'center' }}>
        <CompareArrowsIcon sx={{ color: '#fff', fontSize: 32 }} />
        <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          Versión Anterior vs Versión Mejorada
        </Typography>
      </Box>

      {/* Ejemplo 1: Configuración Diaria */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
          📅 Ejemplo 1: Configuración Diaria
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#fff', mb: 2, opacity: 0.8 }}>
              🔴 Versión Anterior
            </Typography>
            <InlineItemConfig 
              config={config}
              onConfigChange={handleConfigChange}
            />
          </Box>
          
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#fff', mb: 2, opacity: 0.8 }}>
              🟢 Versión Mejorada
            </Typography>
            <InlineItemConfigImproved
              config={config}
              onConfigChange={handleConfigChange}
              itemId="bath"
              sectionId="bodyCare"
            />
          </Box>
        </Box>
      </Paper>

      {/* Ejemplo 2: Configuración Semanal */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
          📊 Ejemplo 2: Configuración Semanal
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#fff', mb: 2, opacity: 0.8 }}>
              🔴 Versión Anterior
            </Typography>
            <InlineItemConfig 
              config={config2}
              onConfigChange={handleConfig2Change}
            />
          </Box>
          
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#fff', mb: 2, opacity: 0.8 }}>
              🟢 Versión Mejorada
            </Typography>
            <InlineItemConfigImproved
              config={config2}
              onConfigChange={handleConfig2Change}
              itemId="exercise"
              sectionId="ejercicio"
            />
          </Box>
        </Box>
      </Paper>

      {/* Ejemplo 3: Configuración Personalizada */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
          ⚙️ Ejemplo 3: Configuración Personalizada
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#fff', mb: 2, opacity: 0.8 }}>
              🔴 Versión Anterior
            </Typography>
            <InlineItemConfig 
              config={config3}
              onConfigChange={handleConfig3Change}
            />
          </Box>
          
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#fff', mb: 2, opacity: 0.8 }}>
              🟢 Versión Mejorada
            </Typography>
            <InlineItemConfigImproved
              config={config3}
              onConfigChange={handleConfig3Change}
              itemId="cleaning"
              sectionId="cleaning"
            />
          </Box>
        </Box>
      </Paper>

      {/* Características Principales */}
      <Paper sx={{ p: 3, bgcolor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="h6" sx={{ color: '#fff', mb: 3 }}>
          🎯 Mejoras Principales
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#ff6b6b', mb: 2 }}>
              ❌ Versión Anterior
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                • Ocupa mucho espacio vertical (~200px)
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                • Botones grandes y llamativos
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                • Botón de guardar obligatorio
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                • Fondo gris oscuro pesado
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                • Siempre expandido
              </Typography>
            </Box>
          </Box>
          
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#4ecdc4', mb: 2 }}>
              ✅ Versión Mejorada
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                • Diseño compacto (~60px colapsado)
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                • Chips pequeños y elegantes
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                • Auto-save con debounce
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                • Gradientes sutiles
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                • Colapsible bajo demanda
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                • Micro-interacciones suaves
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                • Indicador visual de cambios
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Instrucciones de Implementación */}
      <Paper sx={{ p: 3, mt: 4, bgcolor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="h6" sx={{ color: '#fff', mb: 3 }}>
          🚀 Instrucciones de Implementación
        </Typography>
        
        <Box sx={{ bgcolor: '#0a0a0a', p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#4ecdc4', fontFamily: 'monospace' }}>
            {`// 1. Importar el nuevo componente
import InlineItemConfigImproved from './InlineItemConfigImproved';

// 2. Reemplazar en el componente
<InlineItemConfigImproved
  config={config}
  onConfigChange={handleConfigChange}
  itemId="itemId"
  sectionId="sectionId"
/>`}
          </Typography>
        </Box>
        
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
          <strong>Beneficios inmediatos:</strong>
        </Typography>
        
        <Box sx={{ pl: 2 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
            • 📱 Mejor experiencia móvil
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
            • ⚡ Rendimiento mejorado
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
            • 🎨 Diseño más elegante
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
            • 🔧 Auto-save automático
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
            • 🌟 Mejor feedback visual
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ConfigComparison; 