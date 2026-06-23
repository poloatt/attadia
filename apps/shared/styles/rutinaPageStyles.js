import { alpha } from '@mui/material/styles';
import {
  HUB_SECTION,
  hubSectionBg,
  hubSectionShellSx,
  hubSectionHeaderSx,
  hubSectionTitleSx,
  hubHeaderIconSx,
  hubSectionShellBodySx,
  hubGridContainerSx,
  hubGridItemSx,
  getHubSubsectionSx,
  hubPageScrollSx,
} from './hubSectionStyles';
import {
  taskFormCaptionTextSx,
  taskFormBodyTextSx,
  taskFormRowWithActionSx,
  taskFormHeaderActionIconSx,
  TASK_FORM_CAPTION_FONT_SIZE,
} from '../components/forms/tareaFormTokens';

/** Ancho máximo del contenido de la página Rutinas (alineado con TareaForm / hub Foco). */
export const RUTINA_PAGE_MAX_WIDTH = 900;

/** Contenedor único: hero de fecha + cuerpo de página comparten max-width y padding horizontal. */
export const rutinaPageContentShellSx = {
  width: '100%',
  maxWidth: RUTINA_PAGE_MAX_WIDTH,
  mx: 'auto',
  px: { xs: 1, sm: 2, md: 3 },
  boxSizing: 'border-box',
};

export const rutinaPageMainSx = {
  width: '100%',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
};

export const rutinaPageContainerSx = {
  ...rutinaPageContentShellSx,
  py: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
};

export function rutinaPageScrollSx(isMobile, bottomPadding, extraTopOffset = 0) {
  return {
    ...hubPageScrollSx({ isMobile, bottomPadding, extraTopOffset }),
    px: 0,
  };
}

export const rutinaPageLoaderSx = {
  display: 'flex',
  justifyContent: 'center',
  my: 4,
};

export const rutinaEmptyStatePaperSx = {
  ...getHubSubsectionSx(),
  p: 2,
  mb: 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 1,
  textAlign: 'center',
};

export const rutinaErrorStatePaperSx = {
  p: 2,
  mb: 2,
  bgcolor: 'error.light',
  color: 'error.contrastText',
  borderRadius: HUB_SECTION.sectionRadius,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

export const rutinaTableContainerSx = {
  width: '100%',
  boxSizing: 'border-box',
};

export const rutinaGridContainerSx = {
  ...hubGridContainerSx,
  alignItems: 'stretch',
};

export const rutinaGridItemSx = {
  ...hubGridItemSx,
  display: 'flex',
  '& > *': { width: '100%' },
};

/** Shell de sección (Cuidado Personal, Nutrición, etc.) — misma base que HubSectionShell. */
export const rutinaSectionShellSx = {
  ...hubSectionShellSx,
  mb: 0,
  width: '100%',
  height: '100%',
  overflow: 'hidden',
};

export function rutinaSectionHeaderSx(isExpanded) {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: isExpanded ? 0 : 0.5,
    overflow: 'hidden',
    borderBottom: isExpanded ? 1 : 0,
    borderColor: 'divider',
    cursor: 'pointer',
  };
}

/** Fila superior de sección: cabecera tintada estilo hub + chevron. */
export const rutinaSectionHeaderTopRowSx = {
  ...hubSectionHeaderSx,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  minWidth: 0,
  gap: 0.5,
  borderBottom: 0,
  py: 0.75,
  px: 1.25,
};

export const rutinaSectionTitleRowSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  minWidth: 0,
  flex: 1,
};

export const rutinaSectionTitleSx = {
  ...hubSectionTitleSx,
  textTransform: 'none',
  letterSpacing: 0,
};

export const rutinaSectionHeaderIconSx = hubHeaderIconSx;

export const rutinaSectionBodySx = {
  ...hubSectionShellBodySx,
  px: 1,
  py: 0.5,
  pt: 0,
  bgcolor: hubSectionBg,
};

export const rutinaSectionSubdividerSx = {
  mb: 1,
  pb: 1,
  borderBottom: 1,
  borderColor: 'divider',
};

export const rutinaSectionEmptySx = {
  ...getHubSubsectionSx(),
  mb: 1,
  p: 2,
};

export const rutinaExpandIconSx = {
  ...taskFormHeaderActionIconSx('text.secondary'),
  width: 24,
  height: 24,
  minWidth: 24,
  opacity: 0.7,
  '&:hover': { opacity: 1 },
};

export const rutinaBackToListIconSx = {
  ...rutinaExpandIconSx,
  mr: 0.5,
};

/** Botón circular de hábito (vista expandida y colapsada). */
export function getRutinaHabitIconButtonSx({ isCompleted, size = 38, mr = 1 } = {}) {
  return {
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    mr,
    cursor: 'pointer',
    color: isCompleted ? 'primary.main' : 'text.secondary',
    bgcolor: isCompleted ? 'action.selected' : 'transparent',
    borderRadius: '50%',
    transition: 'all 0.2s ease',
    '&:hover': {
      color: isCompleted ? 'primary.main' : 'text.primary',
      bgcolor: isCompleted ? 'action.selected' : 'action.hover',
    },
  };
}

export const rutinaCollapsedIconsRowSx = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 0.25,
  alignItems: 'center',
  width: '100%',
  minWidth: 0,
  px: 1.25,
  pb: 0.5,
  bgcolor: hubSectionBg,
};

export const rutinaChecklistItemSx = {
  mb: 0.5,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  bgcolor: 'transparent',
};

export const rutinaChecklistRowSx = {
  ...taskFormRowWithActionSx,
  width: '100%',
  py: 0.5,
  position: 'relative',
  pr: 0,
};

export const rutinaChecklistContentSx = {
  display: 'flex',
  alignItems: 'center',
  flexGrow: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: 'text.primary',
  pr: 0,
};

export const rutinaChecklistTextColumnSx = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  minWidth: 0,
  flexGrow: 1,
  overflow: 'hidden',
};

export function rutinaChecklistLabelSx(isCompleted) {
  return {
    ...taskFormBodyTextSx,
    fontWeight: 400,
    color: isCompleted ? 'text.disabled' : 'text.primary',
    textDecoration: isCompleted ? 'line-through' : 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    minWidth: 0,
  };
}

export const rutinaChecklistMetaSx = {
  ...taskFormCaptionTextSx,
  fontSize: TASK_FORM_CAPTION_FONT_SIZE,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export const rutinaHorariosRowSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.3,
  ml: 0.5,
};

export function rutinaHorarioIconButtonSx(horarioCompleted) {
  return {
    ...taskFormHeaderActionIconSx(horarioCompleted ? 'primary.main' : 'text.disabled'),
    padding: 0.25,
    width: 'auto',
    height: 'auto',
    minWidth: 'auto',
    opacity: horarioCompleted ? 1 : 0.4,
    '&:hover': {
      color: horarioCompleted ? 'primary.main' : 'text.secondary',
      opacity: horarioCompleted ? 1 : 0.7,
      bgcolor: 'action.hover',
    },
    '&:disabled': {
      opacity: 0.3,
      cursor: 'default',
    },
  };
}

export const rutinaHorarioIconSx = {
  fontSize: '0.75rem',
};

export const rutinaRowActionsSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
  ml: 'auto',
  position: 'absolute',
  right: 0,
  top: '50%',
  transform: 'translateY(-50%)',
};

export function rutinaRowActionIconSx(isActive = false) {
  return {
    ...taskFormHeaderActionIconSx(isActive ? 'primary.main' : 'text.disabled'),
    width: 24,
    height: 24,
    minWidth: 24,
    '&:hover': {
      color: 'primary.main',
      bgcolor: 'action.hover',
    },
  };
}

export const rutinaSystemButtonsSx = {
  display: 'flex',
  alignItems: 'center',
  '& .MuiIconButton-root': {
    width: 24,
    height: 24,
    borderRadius: 0,
    padding: 0.25,
    '& .MuiSvgIcon-root': {
      fontSize: '1rem',
    },
  },
};

export const rutinaInlineConfigSx = {
  width: '100%',
  mt: 1,
};
