import { Box } from '@mui/material';

export default function PageContainer({ children, sx = {}, ...props }) {
  return (
    <Box
      sx={{
        width: '100%',
        flex: 1,
        px: { xs: 1, sm: 2, md: 3 },
        py: 2,
        ...sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
} 