import React from 'react';
import { Box, Typography, IconButton, Tooltip, Collapse } from '@mui/material';
import { Link } from 'react-router-dom';
import { PeopleOutlined as PeopleIcon, BedOutlined as BedIcon, Description as ContractIcon, Inventory2Outlined as InventoryIcon, MonetizationOnOutlined as MoneyIcon, OpenInNew as OpenInNewIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { pluralizar, getEstadoContrato, getInquilinoStatusColor, agruparHabitaciones } from './propiedadUtils';
import { getInquilinosByPropiedad } from './inquilinos';
import { icons } from '../../navigation/menuIcons';

// Sección: Inquilinos
export const SeccionInquilinos = ({ propiedad, inquilinos = [], inquilinosActivos = [], inquilinosFinalizados = [] }) => {
  // Si se pasa la propiedad, obtener los inquilinos desde el helper
  const inqs = propiedad ? getInquilinosByPropiedad(propiedad) : inquilinos;
  // Separar activos y finalizados si es necesario
  const activos = inqs.filter(i => i.estado === 'ACTIVO' || i.estado === 'RESERVADO');
  const finalizados = inqs.filter(i => i.estado !== 'ACTIVO' && i.estado !== 'RESERVADO');
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontSize: '0.95rem', fontWeight: 600 }}><PeopleIcon sx={{ fontSize: '1.1rem', mr: 1 }} />Inquilinos</Typography>
      {activos.length === 0 && <Typography variant="body2" color="text.secondary">Ninguno</Typography>}
      {activos.map(i => (
        <Typography key={i._id} variant="body2" sx={{ fontSize: '0.85rem' }}>{i.nombre} {i.apellido}</Typography>
      ))}
      <Typography variant="subtitle2" sx={{ mt: 1, fontSize: '0.85rem', fontWeight: 500 }}>
        {finalizados.length} {pluralizar(finalizados.length, 'inquilino finalizado', 'inquilinos finalizados')}
      </Typography>
      {finalizados.length === 0 && <Typography variant="body2" color="text.secondary">Ninguno</Typography>}
      {finalizados.map(i => (
        <Typography key={i._id} variant="body2" sx={{ fontSize: '0.85rem' }}>{i.nombre} {i.apellido} ({i.estado})</Typography>
      ))}
    </Box>
  );
};

// Sección: Habitaciones
export const SeccionHabitaciones = ({ habitaciones = [] }) => {
  if (!habitaciones.length) return null;
  const agrupadas = agruparHabitaciones(habitaciones);
  return (
    <Box sx={{ mb: 2 }}>
      {Object.entries(agrupadas).map(([tipo, habs]) => (
        <Typography key={tipo} variant="body2" color="text.secondary">
          {habs.length} {tipo.replace('_', ' ')}{habs.length > 1 ? 's' : ''}
        </Typography>
      ))}
    </Box>
  );
};

// Sección: Inventario
export const SeccionInventario = ({ inventario = [] }) => {
  if (!inventario.length) return null;
  const agrupado = inventario.reduce((acc, item) => {
    const categoria = item.categoria || 'Sin categoría';
    if (!acc[categoria]) acc[categoria] = [];
    acc[categoria].push(item);
    return acc;
  }, {});
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}><InventoryIcon sx={{ fontSize: '1.1rem', mr: 1 }} />Inventario</Typography>
      {Object.entries(agrupado).map(([categoria, items]) => (
        <Box key={categoria}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{categoria} ({items.length})</Typography>
          {items.map(item => (
            <Typography key={item._id} variant="body2" color="text.secondary" sx={{ pl: 1 }}>
              {item.nombre} - Cantidad: {item.cantidad || 1}
            </Typography>
          ))}
        </Box>
      ))}
    </Box>
  );
};

// Sección: Documentos
export const SeccionDocumentos = ({ documentos = [], onInventarioClick }) => {
  if (!documentos.length) return null;
  const categorias = ['CONTRATO', 'PAGO', 'COBRO', 'MANTENIMIENTO', 'GASTO_FIJO', 'GASTO_VARIABLE', 'ALQUILER'];
  const docsPorCategoria = categorias.reduce((acc, cat) => {
    acc[cat] = documentos.filter(doc => doc.categoria === cat);
    return acc;
  }, {});
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}><MoneyIcon sx={{ fontSize: '1.1rem', mr: 1 }} />Documentos</Typography>
      {categorias.map(cat => {
        const docs = docsPorCategoria[cat];
        if (!docs || !docs.length) return null;
        return (
          <Box key={cat} sx={{ mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{cat.replace('_', ' ')}</Typography>
            {docs.map((doc, idx) => (
              <Box key={doc._id || `${cat}-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.nombre}</Typography>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>Abrir</a>
                {/* Botón de inventario solo para contratos que tengan inventario */}
                {cat === 'CONTRATO' && (
                  doc.inventario ? (
                    <IconButton size="small" sx={{ p: 0.2, color: 'text.secondary' }} onClick={() => onInventarioClick && onInventarioClick(doc)}>
                      {React.createElement(icons.inventario, { sx: { fontSize: '1rem' } })}
                    </IconButton>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 0.2, color: 'text.disabled' }}>
                      {React.createElement(icons.inventario, { sx: { fontSize: '1rem' } })}
                    </Box>
                  )
                )}
              </Box>
            ))}
          </Box>
        );
      })}
    </Box>
  );
};

// Subcomponente para mostrar una categoría de documentos
export const DocumentosCategoria = ({ alias, icono, documentos }) => {
  const [expandido, setExpandido] = React.useState(false);
  const mostrarDocs = expandido ? documentos : documentos.slice(0, 2);
  return (
    <Box sx={{ mb: 0.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 0.25 }}>
        {alias} {documentos.length > 2 && (
          <span style={{ color: '#aaa', fontWeight: 400, fontSize: '0.7rem', cursor: 'pointer' }} onClick={() => setExpandido(e => !e)}>
            {expandido ? 'ver menos...' : 'ver más...'}
          </span>
        )}
      </Typography>
      {mostrarDocs.map((doc, idx) => (
        <Box key={`doc-${doc._id || idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: 1, py: 0.25 }}>
          {icono}
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {doc.nombre}
          </Typography>
          {doc.esLink ? (
            <IconButton size="small" component={Link} to={doc.url} sx={{ p: 0.25 }}>
              <OpenInNewIcon sx={{ fontSize: '0.7rem' }} />
            </IconButton>
          ) : (
            <IconButton size="small" href={doc.url} target="_blank" rel="noopener noreferrer" sx={{ p: 0.25 }}>
              <OpenInNewIcon sx={{ fontSize: '0.7rem' }} />
            </IconButton>
          )}
        </Box>
      ))}
    </Box>
  );
};

// Subcomponente reutilizable para secciones expandibles
export const SeccionExpandible = ({ icon, title, expanded, onToggle, children }) => (
  <Box sx={{ mt: 0.25 }}>
    <Box onClick={onToggle} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
      {icon}
      <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>{title}</Typography>
      <IconButton size="small" sx={{ p: 0.25, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
        <OpenInNewIcon sx={{ fontSize: '0.9rem' }} />
      </IconButton>
    </Box>
    <Collapse in={expanded}>
      <Box sx={{ pl: 2, pt: 0.5 }}>{children}</Box>
    </Collapse>
  </Box>
); 
