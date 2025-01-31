import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Fade,
  Checkbox,
  Button
} from '@mui/material';
import {
  AddOutlined,
  SearchOutlined,
  DeleteOutlineOutlined,
  FilterListOutlined,
  CloseOutlined,
  CheckOutlined
} from '@mui/icons-material';

const EntityToolbar = ({ 
  onAdd,
  onDelete,
  onSearch,
  onFilter,
  selectedItems = [],
  setSelectedItems,
  items = [],
  searchPlaceholder = 'Buscar...'
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [selectMode, setSelectMode] = useState(false);

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch && onSearch) {
      onSearch(''); // Limpiar búsqueda al cerrar
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  const handleDeleteSelected = () => {
    if (onDelete && selectedItems.length > 0) {
      onDelete(selectedItems);
      setSelectedItems([]);
      setSelectMode(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 2,
        height: 40,
        position: 'relative'
      }}
    >
      {/* Modo Selección */}
      {selectMode ? (
        <>
          <Checkbox
            size="small"
            indeterminate={selectedItems.length > 0 && selectedItems.length < items.length}
            checked={selectedItems.length === items.length}
            onChange={handleSelectAll}
            sx={{
              color: 'text.secondary',
              '&.Mui-checked': {
                color: 'text.primary',
              }
            }}
          />
          <Button
            size="small"
            onClick={() => setSelectMode(false)}
            sx={{
              color: 'text.secondary',
              textTransform: 'none',
              minWidth: 'auto',
              p: 0.5,
              '&:hover': {
                backgroundColor: 'transparent',
                color: 'text.primary'
              }
            }}
          >
            Cancelar
          </Button>
          {selectedItems.length > 0 && (
            <Button
              size="small"
              startIcon={<DeleteOutlineOutlined />}
              onClick={handleDeleteSelected}
              sx={{
                color: '#FF5252',
                textTransform: 'none',
                minWidth: 'auto',
                p: 0.5,
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: '#FF0000'
                }
              }}
            >
              Eliminar ({selectedItems.length})
            </Button>
          )}
        </>
      ) : (
        <>
          {/* Botones principales */}
          <Tooltip title="Agregar">
            <IconButton
              size="small"
              onClick={onAdd}
              sx={{
                color: 'text.secondary',
                '&:hover': { color: 'text.primary' }
              }}
            >
              <AddOutlined sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Seleccionar">
            <IconButton
              size="small"
              onClick={() => setSelectMode(true)}
              sx={{
                color: 'text.secondary',
                '&:hover': { color: 'text.primary' }
              }}
            >
              <CheckOutlined sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title={showSearch ? "Cerrar búsqueda" : "Buscar"}>
            <IconButton
              size="small"
              onClick={handleSearchToggle}
              sx={{
                color: showSearch ? 'text.primary' : 'text.secondary',
                '&:hover': { color: 'text.primary' }
              }}
            >
              {showSearch ? 
                <CloseOutlined sx={{ fontSize: 20 }} /> : 
                <SearchOutlined sx={{ fontSize: 20 }} />
              }
            </IconButton>
          </Tooltip>

          <Tooltip title="Filtrar">
            <IconButton
              size="small"
              onClick={onFilter}
              sx={{
                color: 'text.secondary',
                '&:hover': { color: 'text.primary' }
              }}
            >
              <FilterListOutlined sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </>
      )}

      {/* Campo de búsqueda */}
      <Fade in={showSearch}>
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          onChange={(e) => onSearch(e.target.value)}
          variant="standard"
          sx={{
            position: 'absolute',
            right: 0,
            width: showSearch ? '200px' : '0px',
            transition: 'width 0.3s ease-in-out',
            '& .MuiInput-root': {
              fontSize: '0.875rem',
              '&:before, &:after': {
                borderColor: 'text.secondary'
              },
              '&:hover:not(.Mui-disabled):before': {
                borderColor: 'text.primary'
              }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined 
                  sx={{ 
                    fontSize: 18,
                    color: 'text.secondary'
                  }} 
                />
              </InputAdornment>
            ),
          }}
        />
      </Fade>
    </Box>
  );
};

export default EntityToolbar; 