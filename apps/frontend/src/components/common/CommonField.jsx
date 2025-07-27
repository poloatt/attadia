import React, { memo, useState, useCallback } from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Button,
  Typography,
  CircularProgress,
  InputAdornment,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const BaseTextField = memo(({ 
  field, 
  value, 
  onChange, 
  error,
  isLoading,
  helperText 
}) => {
  const handleChange = useCallback((e) => {
    onChange({
      target: {
        name: field.name,
        value: e.target.value
      }
    });
  }, [field.name, onChange]);

  return (
    <TextField
      name={field.name}
      label={field.label}
      value={value || ''}
      onChange={handleChange}
      fullWidth
      margin="normal"
      required={field.required}
      multiline={field.multiline}
      rows={field.rows}
      type={field.type}
      size="small"
      error={!!error}
      helperText={error || helperText}
      disabled={isLoading}
      InputLabelProps={{
        shrink: true,
        required: field.required
      }}
      InputProps={{
        endAdornment: isLoading && (
          <InputAdornment position="end">
            <CircularProgress size={20} />
          </InputAdornment>
        )
      }}
    />
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.error === nextProps.error &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.field.name === nextProps.field.name
  );
});

const CreateForm = memo(({ 
  field, 
  onSubmit, 
  onCancel, 
  isLoading 
}) => {
  const [formData, setFormData] = useState({});

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    onSubmit(formData);
  }, [formData, onSubmit]);

  return (
    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper' }}>
      <Typography variant="subtitle2" gutterBottom>
        {field.createTitle || 'Crear Nuevo'}
      </Typography>
      {field.createFields?.map(createField => {
        if (createField.type === 'relational' || createField.type === 'select') {
          return (
            <FormField
              key={createField.name}
              field={createField}
              value={formData[createField.name]}
              onChange={handleChange}
              isLoading={isLoading}
            />
          );
        }
        return (
          <BaseTextField
            key={createField.name}
            field={createField}
            value={formData[createField.name]}
            onChange={handleChange}
            isLoading={isLoading}
          />
        );
      })}
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          Crear
        </Button>
        <Button onClick={onCancel}>
          Cancelar
        </Button>
      </Box>
    </Box>
  );
});

export const CommonField = memo(({ 
  field, 
  value, 
  onChange, 
  relatedData,
  error,
  onCreateNew,
  isLoading = false,
  helperText,
  nestedData,
  formData = {}
}) => {
  const [isCreating, setIsCreating] = useState(false);

  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    if (newValue === '__create_new__') {
      setIsCreating(true);
      return;
    }
    onChange({
      target: {
        name: field.name,
        value: newValue,
        type: field.type
      }
    });
  }, [field.name, field.type, onChange]);

  if (field.hidden && typeof field.hidden === 'function' && field.hidden(formData)) {
    return null;
  }

  if (isCreating) {
    return (
      <CreateForm
        field={field}
        onSubmit={async (data) => {
          try {
            const newItem = await onCreateNew(data);
            onChange({
              target: {
                name: field.name,
                value: newItem.id,
                type: field.type
              }
            });
            setIsCreating(false);
          } catch (error) {
            console.error('Error al crear:', error);
          }
        }}
        onCancel={() => setIsCreating(false)}
        isLoading={isLoading}
      />
    );
  }

  if (field.type === 'select' || field.type === 'relational') {
    const options = field.type === 'relational' 
      ? (field.options || [])
      : (field.options || []);

    return (
      <FormControl 
        fullWidth 
        margin="normal" 
        error={!!error}
        size="small"
      >
        <InputLabel required={field.required}>{field.label}</InputLabel>
        <Select
          name={field.name}
          value={value || ''}
          onChange={handleChange}
          label={field.label}
          disabled={isLoading}
        >
          {options.map((option, index) => {
            if (option.divider) {
              return <Divider key={`divider-${index}`} />;
            }
            return (
              <MenuItem 
                key={option.value || `option-${index}`} 
                value={option.value}
              >
                {option.label}
              </MenuItem>
            );
          })}
          {field.onCreateNew && (
            <MenuItem key="__create_new__" value="__create_new__">
              <AddIcon sx={{ mr: 1 }} />
              {field.createButtonText || 'Crear Nuevo'}
            </MenuItem>
          )}
        </Select>
        {(error || helperText) && (
          <FormHelperText>{error || helperText}</FormHelperText>
        )}
      </FormControl>
    );
  }

  return (
    <BaseTextField
      field={field}
      value={value}
      onChange={onChange}
      error={error}
      helperText={helperText}
      isLoading={isLoading}
    />
  );
}); 

export default CommonField; 
