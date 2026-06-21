import React, { useState } from 'react';

import {

  Box,

  Menu,

  MenuItem,

  Stack,

} from '@mui/material';

import {

  KeyboardArrowDown as ChevronDownIcon,

} from '@mui/icons-material';

import { TareaFormRow, TareaFormPillButton, tareaFormFixedPillSx, tareaFormPillChevronSx, tareaFormPillIconSx, tareaFormPillRowSx, tareaFormErrorTextSx, tareaFormRowContentGutterSx } from '@shared/components/forms/tareaFormUi';

import { TareaFormIcons } from '@shared/components/forms/tareaFormIcons';

import TareaFormRecurrencePicker from './TareaFormRecurrencePicker';



const DEFAULT_ESTADO_OPTIONS = [

  { value: 'PENDIENTE', label: 'Pendiente' },

  { value: 'EN_PROGRESO', label: 'En Progreso' },

  { value: 'COMPLETADA', label: 'Completada' },

];



function getEstadoLabel(estado, options) {

  return options.find((o) => o.value === estado)?.label || options[0]?.label || 'Pendiente';

}



/**

 * Fila unificada: Estado | Prioridad | Cadencia (pills compartidos).

 */

export default function TareaFormSettingsRow({

  estado,

  onEstadoChange,

  prioridad,

  onPrioridadChange,

  showPrioridad = true,

  showRecurrence = true,

  recurrenceRrule = null,

  onRecurrenceChange,

  tipo = 'TAREA',

  errors = {},

  estadoOptions = DEFAULT_ESTADO_OPTIONS,

}) {

  const [estadoAnchor, setEstadoAnchor] = useState(null);

  const estadoOpen = Boolean(estadoAnchor);



  const handleEstadoSelect = (value) => {

    setEstadoAnchor(null);

    onEstadoChange?.({ target: { value } });

  };



  return (

    <TareaFormRow icon={TareaFormIcons.estado} showDivider={false} align="center">

      <Stack

        direction="row"

        flexWrap="wrap"

        alignItems="center"

        gap={0.75}

        useFlexGap

        sx={{ ...tareaFormPillRowSx, ...tareaFormRowContentGutterSx }}

      >

        <TareaFormPillButton

          variant="settings"

          onClick={(e) => setEstadoAnchor(e.currentTarget)}

          aria-label="Estado"

          sx={{
            ...tareaFormFixedPillSx,
            justifyContent: 'space-between',
            ...(errors.estado ? { outline: '1px solid', outlineColor: 'error.main' } : undefined),
          }}

        >

          {getEstadoLabel(estado || 'PENDIENTE', estadoOptions)}

          <ChevronDownIcon sx={tareaFormPillChevronSx} />

        </TareaFormPillButton>



        <Menu anchorEl={estadoAnchor} open={estadoOpen} onClose={() => setEstadoAnchor(null)}>

          {estadoOptions.map((opt) => (

            <MenuItem key={opt.value} onClick={() => handleEstadoSelect(opt.value)}>

              {opt.label}

            </MenuItem>

          ))}

        </Menu>



        {showPrioridad && tipo !== 'EVENTO' && onPrioridadChange && (

          <TareaFormPillButton

            variant="settings"

            onClick={() => onPrioridadChange(prioridad === 'ALTA' ? 'BAJA' : 'ALTA')}

            aria-label="Prioridad"

            sx={{ color: prioridad === 'ALTA' ? 'error.main' : 'text.primary' }}

          >

            <TareaFormIcons.prioridad sx={tareaFormPillIconSx} />

            {prioridad === 'ALTA' ? 'Alta' : 'Baja'}

          </TareaFormPillButton>

        )}



        {showRecurrence && onRecurrenceChange && (

          <TareaFormRecurrencePicker

            variant="settings"

            value={recurrenceRrule}

            onChange={onRecurrenceChange}

          />

        )}

      </Stack>



      {errors.estado ? (

        <Box component="span" sx={{ ...tareaFormErrorTextSx, mt: 0.5, display: 'block' }}>

          {errors.estado}

        </Box>

      ) : null}

    </TareaFormRow>

  );

}

