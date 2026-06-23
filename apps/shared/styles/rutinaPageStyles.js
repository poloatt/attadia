import { alpha } from '@mui/material/styles';
import {
  HUB_SECTION,
  hubSectionBg,
  hubSectionShellSx,
  hubSectionHeaderSx,
  hubSectionShellBodySx,
  hubGridContainerSx,
  hubGridItemSx,
  getHubSubsectionSx,
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

export const rutinaPageMainSx = {
  width: '100%',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
};

export const rutinaPageContainerSx = {
  width: '100%',
  maxWidth: RUTINA_PAGE_MAX_WIDTH,
  mx: 'auto',
  px: { xs: 1, sm: 2, md: 3 },
  py: 0,
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
};

export function rutinaPageScrollSx(isMobile, bottomPadding) {
  return {
    py: isMobile ? 1 : 2,
    px: { xs: 1, sm: 2, md: 3 },
    height: isMobile ? 'calc(100vh - 180px)' : 'calc(100vh - 190px)',
    overflowY: 'auto',
    pb: bottomPadding ?? (isMobile ? 4 : 6),
    '&::-webkit-scrollbar': {
      width: isMobile ? '4px' : '8px',
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: (theme) =>
        alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.06 : 0.04),
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: (theme) =>
        alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.18 : 0.12),
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: (theme) =>
        alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.28 : 0.2),
    },
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
  maxWidth: RUTINA_PAGE_MAX_WIDTH,
  mx: 'auto',
  px: { xs: 1, sm: 2, md: 3 },
  py: 3,
  boxSizing: 'border-box',
};

export const rutinaGridContainerSx = hubGridContainerSx;

export const rutinaGridItemSx = hubGridItemSx;

/** Shell de sección (Cuidado Personal, Nutrición, etc.) — misma base que HubSectionShell. */
export const rutinaSectionShellSx = {
  ...hubSectionShellSx,
  mb: 1,
  overflow: 'visible',
  position: 'relative',
};

export function rutinaSectionHeaderSx(isExpanded) {
  return {
    ...hubSectionHeaderSx,
    px: 1,
    py: 0.75,
    minHeight: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: isExpanded ? 1 : 0,
    borderColor: 'divider',
    cursor: 'pointer',
    bgcolor: (theme) =>
      alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.04 : 0.03),
  };
}

export const rutinaSectionTitleSx = {
  ...taskFormCaptionTextSx,
  fontWeight: 700,
  fontSize: '0.72rem',
  letterSpacing: 0.2,
  textTransform: 'uppercase',
  pointerEvents: 'none',
};

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
  gap: 0.3,
  alignItems: 'center',
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
