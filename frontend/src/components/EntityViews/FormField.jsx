import React, { memo } from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';

const BaseTextField = memo(({ 
  field, 
  value, 
  onChange, 
  error 
}) => (
  <TextField
    name={field.name}
    label={field.label}
    value={value ?? ''}
    onChange={onChange}
    fullWidth
    margin="normal"
    required={field.required}
    multiline={field.multiline}
    rows={field.rows}
    type={field.type}
    size="small"
    error={!!error}
    helperText={error}
    InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
  />
));

const SelectField = memo(({ 
  field, 
  value, 
  onChange, 
  error,
  options = [] 
}) => (
  <FormControl 
    fullWidth 
    margin="normal" 
    size="small"
    error={!!error}
  >
    <InputLabel>{field.label}</InputLabel>
    <Select
      name={field.name}
      value={value ?? ''}
      onChange={onChange}
      label={field.label}
      required={field.required}
    >
      {options.map((option) => (
        <MenuItem 
          key={option.value} 
          value={option.value}
        >
          {option.label}
        </MenuItem>
      ))}
    </Select>
    {error && (
      <FormHelperText>{error}</FormHelperText>
    )}
  </FormControl>
));

export const FormField = memo(({ 
  field, 
  value, 
  onChange, 
  relatedData,
  error 
}) => {
  // Determinar el tipo de campo y sus opciones
  const getFieldOptions = () => {
    if (field.type === 'select') {
      return field.options;
    }
    if (field.type === 'relational' || field.type === 'creatable') {
      return relatedData[field.name] || [];
    }
    return [];
  };

  // Renderizar el campo según su tipo
  switch (field.type) {
    case 'select':
    case 'relational':
    case 'creatable':
      return (
        <SelectField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
          options={getFieldOptions()}
        />
      );
    default:
      return (
        <BaseTextField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
        />
      );
  }
}); 