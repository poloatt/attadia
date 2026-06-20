import React from 'react';
import { Typography } from '@mui/material';
import {
  BadgeOutlined as BadgeIcon,
  EmailOutlined as EmailIcon,
  PhoneOutlined as PhoneIcon,
} from '@mui/icons-material';
import { TaskFormRow } from '../../../../foco/src/foco/taskFormUi';
import { propiedadDetailEmptyTextSx } from '../propiedadDetailStyles';

export default function InquilinoContactRows({ inquilino }) {
  const { email, telefono, dni, nacionalidad, ocupacion } = inquilino || {};
  const hasContact = email || telefono || dni || nacionalidad || ocupacion;

  if (!hasContact) {
    return (
      <TaskFormRow icon={BadgeIcon} showDivider>
        <Typography sx={propiedadDetailEmptyTextSx}>Sin datos de contacto</Typography>
      </TaskFormRow>
    );
  }

  return (
    <>
      {email ? (
        <TaskFormRow icon={EmailIcon} showDivider>
          <Typography sx={{ fontSize: '0.875rem', lineHeight: 1.45, color: 'text.primary' }}>
            {email}
          </Typography>
        </TaskFormRow>
      ) : null}

      {telefono ? (
        <TaskFormRow icon={PhoneIcon} showDivider>
          <Typography sx={{ fontSize: '0.875rem', lineHeight: 1.45, color: 'text.primary' }}>
            {telefono}
          </Typography>
        </TaskFormRow>
      ) : null}

      {dni ? (
        <TaskFormRow icon={BadgeIcon} showDivider>
          <Typography sx={{ fontSize: '0.875rem', lineHeight: 1.45, color: 'text.primary' }}>
            DNI {dni}
          </Typography>
        </TaskFormRow>
      ) : null}

      {nacionalidad || ocupacion ? (
        <TaskFormRow icon={BadgeIcon} showDivider>
          <Typography sx={{ fontSize: '0.875rem', lineHeight: 1.45, color: 'text.primary' }}>
            {[nacionalidad, ocupacion].filter(Boolean).join(' · ')}
          </Typography>
        </TaskFormRow>
      ) : null}
    </>
  );
}
