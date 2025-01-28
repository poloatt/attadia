import { Box, Paper, Typography } from '@mui/material';

export default function EntityDetails({ title, children, action }) {
  return (
    <Paper 
      elevation={0}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.paper',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h6">
          {title}
        </Typography>
        {action && (
          <Box>
            {action}
          </Box>
        )}
      </Box>
      <Box sx={{ 
        flexGrow: 1,
        overflow: 'auto',
        minHeight: 0
      }}>
        {children}
      </Box>
    </Paper>
  );
} 