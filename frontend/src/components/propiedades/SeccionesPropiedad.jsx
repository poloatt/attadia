import React, { useState } from 'react';
import { Box, Typography, IconButton, Tooltip, Collapse } from '@mui/material';
import { Link } from 'react-router-dom';
import { 
  PeopleOutlined as PeopleIcon, 
  Inventory2Outlined as InventoryIcon, 
  MonetizationOnOutlined as MoneyIcon, 
  OpenInNew as OpenInNewIcon, 
  Visibility as VisibilityIcon,
  Folder as FolderIcon,
  Description as DescriptionIcon,
  DriveFolderUpload as DriveFolderUploadIcon // Nuevo icono sugerido
} from '@mui/icons-material';
import { agruparHabitaciones } from './propiedadUtils';
import { getInquilinosByPropiedad } from './inquilinos';
import { icons } from '../../navigation/menuIcons';
import InquilinoDetail from './inquilinos/InquilinoDetail';

// Sección: Inquilinos
export const SeccionInquilinos = ({ propiedad, inquilinos = [], inquilinosActivos = [], inquilinosFinalizados = [] }) => {
  const [selectedInquilino, setSelectedInquilino] = useState(null);
  const [inquilinoDetailOpen, setInquilinoDetailOpen] = useState(false);

  // Si se pasa la propiedad, obtener los inquilinos desde el helper
  const inqs = propiedad ? getInquilinosByPropiedad(propiedad) : inquilinos;
  
  // Separar activos y finalizados - Usando estados correctos del sistema
  const activos = inqs.filter(i => 
    i.estado === 'ACTIVO' || 
    i.estado === 'RESERVADO' || 
    i.estado === 'PENDIENTE'
  );
  const finalizados = inqs.filter(i => 
    i.estado === 'INACTIVO' || 
    i.estado === 'SIN_CONTRATO'
  );

  // Debug: Verificar qué inquilinos se están obteniendo (deshabilitado)
  // console.log('SeccionInquilinos - Debug:', {
  //   totalInquilinos: inqs.length,
  //   activos: activos.length,
  //   finalizados: finalizados.length,
  //   estados: inqs.map(i => ({ nombre: `${i.nombre} ${i.apellido}`, estado: i.estado }))
  // });

  const handleOpenInquilino = (inquilino) => {
    setSelectedInquilino(inquilino);
    setInquilinoDetailOpen(true);
  };

  const handleCloseInquilino = () => {
    setInquilinoDetailOpen(false);
    setSelectedInquilino(null);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
        <PeopleIcon sx={{ fontSize: '1.1rem', mr: 1 }} />
        Inquilinos Activos ({activos.length})
      </Typography>
      
      {activos.length === 0 && (
        <Typography variant="body2" color="text.secondary">Ninguno</Typography>
      )}
      
      {activos.map(i => (
        <Box key={i._id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
          <Typography variant="body2" sx={{ fontSize: '0.85rem', flex: 1 }}>
            {i.nombre} {i.apellido}
          </Typography>
          <Tooltip title="Ver detalle inquilino">
            <IconButton 
              size="small" 
              onClick={() => handleOpenInquilino(i)}
              sx={{ p: 0.5, color: 'primary.main' }}
            >
              <VisibilityIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
      ))}
      
      {finalizados.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mt: 2, fontSize: '0.85rem', fontWeight: 500 }}>
            Inquilinos Finalizados ({finalizados.length})
          </Typography>
          {finalizados.map(i => (
            <Box key={i._id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
              <Typography variant="body2" sx={{ fontSize: '0.85rem', flex: 1, color: 'text.secondary' }}>
                {i.nombre} {i.apellido} ({i.estado})
              </Typography>
              <Tooltip title="Ver detalle inquilino">
                <IconButton 
                  size="small" 
                  onClick={() => handleOpenInquilino(i)}
                  sx={{ p: 0.5, color: 'text.secondary' }}
                >
                  <VisibilityIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
          ))}
        </>
      )}

      {/* Modal de detalle de inquilino */}
      {selectedInquilino && (
        <InquilinoDetail
          open={inquilinoDetailOpen}
          onClose={handleCloseInquilino}
          inquilino={selectedInquilino}
        />
      )}
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
export const SeccionDocumentos = ({ documentos = [], onInventarioClick, propiedad, onSyncSeccion }) => {
  if (!documentos.length) return null;
  const categorias = ['CONTRATO', 'PAGO', 'COBRO', 'MANTENIMIENTO', 'GASTO_FIJO', 'GASTO_VARIABLE', 'ALQUILER'];
  const docsPorCategoria = categorias.reduce((acc, cat) => {
    acc[cat] = documentos.filter(doc => doc.categoria === cat);
    return acc;
  }, {});
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}><DescriptionIcon sx={{ fontSize: '1.1rem', mr: 1 }} />Documentos</Typography>
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
                {/* Botón de archivos solo para contratos que tengan documentos asociados */}
                {cat === 'CONTRATO' && (
                  propiedad?.documentos && propiedad.documentos.length > 0 ? (
                    <Tooltip title={`Ver ${propiedad.documentos.length} documento${propiedad.documentos.length > 1 ? 's' : ''} de la propiedad`}>
                      <IconButton size="small" sx={{ p: 0.2, color: 'text.secondary' }} onClick={() => {
                        // Si hay una url de carpeta de drive, abrirla
                        if (propiedad.driveFolderUrl) {
                          window.open(propiedad.driveFolderUrl, '_blank');
                        } else if (onInventarioClick) {
                          onInventarioClick({ tipo: 'documentos', propiedad });
                        }
                      }}>
                        <IconoContratoDocumentos sinDocumentos={false} />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Sincronizar con Google Drive">
                      <span>
                        <IconButton size="small" sx={{ p: 0.2, color: 'text.disabled' }} onClick={() => {
                          if (typeof onSyncSeccion === 'function') {
                            onSyncSeccion(propiedad?._id, 'CONTRATO');
                          }
                        }}>
                          <IconoContratoDocumentos sinDocumentos={true} />
                        </IconButton>
                      </span>
                    </Tooltip>
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

// Componente centralizado para el icono de contratos en documentos
export const IconoContratoDocumentos = ({ sinDocumentos = false, onClick, url, ...props }) => (
  <span onClick={onClick} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
    {sinDocumentos
      ? <DriveFolderUploadIcon sx={{ fontSize: '1rem' }} {...props} />
      : <FolderIcon sx={{ fontSize: '1rem' }} {...props} />}
  </span>
);

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
