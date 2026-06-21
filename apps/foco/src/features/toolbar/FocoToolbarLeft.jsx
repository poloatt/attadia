import React, { useMemo } from 'react';
import { ArrowBack } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { SystemButtons } from '@shared/components/common/SystemButtons';
import {
  resolveFocoBranchHubPath,
  resolveFocoBranchHubLabel,
} from '@shared/navigation/appNavResolver';

const commonButtonSx = {
  width: { xs: 32, sm: 26 },
  height: { xs: 32, sm: 26 },
  padding: { xs: 0.25, sm: 0.125 },
  minWidth: { xs: 32, sm: 26 },
  minHeight: { xs: 32, sm: 26 },
  '& .MuiSvgIcon-root': { fontSize: { xs: '1.1rem', sm: '1.1rem' } },
  '&:hover': { backgroundColor: 'action.hover' },
};

/**
 * Toolbar izquierda Foco: botón «atrás» al hub (/foco) en subpáginas del módulo Tiempo.
 */
export default function FocoToolbarLeft() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const branchHubPath = useMemo(
    () => resolveFocoBranchHubPath(pathname),
    [pathname],
  );
  const branchHubLabel = useMemo(
    () => resolveFocoBranchHubLabel(pathname),
    [pathname],
  );

  const backAction = useMemo(() => {
    if (!branchHubPath) return null;
    return {
      key: 'branchBack',
      icon: <ArrowBack />,
      label: branchHubLabel || 'Volver',
      tooltip: `Volver a ${branchHubLabel || 'Foco'}`,
      color: 'text.secondary',
      hoverColor: 'primary.main',
      buttonSx: commonButtonSx,
      onClick: () => navigate(branchHubPath),
    };
  }, [branchHubPath, branchHubLabel, navigate]);

  if (!backAction) return null;

  return <SystemButtons actions={[backAction]} gap={0.25} />;

}
