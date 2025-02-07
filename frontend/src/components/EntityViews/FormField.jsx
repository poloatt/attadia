import React, { memo, useState, useCallback, useMemo } from 'react';
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
  Autocomplete,
  InputAdornment,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

const normalizeOption = (option) => {
  if (!option) return null;
  
  return {
    id: String(option.id || option.value || ''),
    value: option.value || option.id || '',
    label: option.label || option.displayValue || String(option.value),
    displayValue: option.displayValue || option.label || String(option.value),
    data: option.data || option
  };
};

const normalizeOptions = (options = []) => {
  return options.map(normalizeOption).filter(Boolean);
};

const BaseTextField = memo(({ 
  field, 
  value, 
  onChange, 
  error,
  isLoading,
  helperText 
}) => {
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    onChange({
      target: {
        name: field.name,
        value: newValue,
        type: field.type
      }
    });
  }, [field.name, field.type, onChange]);

  return (
    <TextField
      name={field.name}
      label={field.label}
      value={value ?? ''}
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
      disabled={field.disabled || isLoading}
      InputLabelProps={{
        shrink: field.type === 'date' ? true : undefined,
        required: field.required
      }}
      InputProps={{
        endAdornment: isLoading && (
          <InputAdornment position="end">
            <CircularProgress size={20} />
          </InputAdornment>
        ),
        ...field.InputProps
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 0
        },
        '& .MuiOutlinedInput-input': {
          padding: '10px 14px'
        }
      }}
    />
  );
});

const CreateForm = memo(({ 
  field, 
  onSubmit, 
  onCancel, 
  isLoading 
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({
      ...prev,
      [name]: null
    }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    field.createFields?.forEach(createField => {
      if (createField.required && !formData[createField.name]) {
        newErrors[createField.name] = 'Este campo es requerido';
        isValid = false;
      }
      if (createField.validate) {
        const error = createField.validate(formData[createField.name], formData);
        if (error) {
          newErrors[createField.name] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [field.createFields, formData]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  }, [formData, onSubmit, validateForm]);

  return (
    <Box sx={{ mt: 2, bgcolor: 'background.paper', p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {field.createTitle || 'Crear Nuevo'}
      </Typography>
      <form onSubmit={handleSubmit}>
        {field.createFields?.map(createField => (
          <BaseTextField
            key={createField.name}
            field={createField}
            value={formData[createField.name]}
            onChange={handleChange}
            error={errors[createField.name]}
            isLoading={isLoading}
          />
        ))}
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button 
            type="submit" 
            variant="contained" 
            size="small"
            disabled={isLoading}
            sx={{ borderRadius: 0 }}
          >
            {isLoading ? <CircularProgress size={20} /> : 'Crear'}
          </Button>
          <Button 
            type="button" 
            onClick={onCancel} 
            size="small"
            sx={{ borderRadius: 0 }}
          >
            Cancelar
          </Button>
        </Box>
      </form>
    </Box>
  );
});

const SelectField = memo(({ 
  field, 
  value, 
  onChange, 
  error,
  options = [],
  onCreateNew,
  isLoading,
  helperText
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const CREATE_NEW_OPTION = useMemo(() => ({
    id: '__create_new__',
    value: '__create_new__',
    label: field.createButtonText || 'Crear Nuevo',
    isCreateNew: true
  }), [field.createButtonText]);

  const normalizedOptions = useMemo(() => 
    normalizeOptions(options), [options]
  );

  const selectedOption = useMemo(() => {
    if (Array.isArray(value)) {
      return value.map(v => normalizedOptions.find(opt => opt.value === v) || null).filter(Boolean);
    }
    return normalizedOptions.find(opt => opt.value === value) || null;
  }, [normalizedOptions, value]);

  const displayedOptions = useMemo(() => {
    const filteredOptions = normalizedOptions.filter(option =>
      option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
      option.displayValue?.toLowerCase().includes(inputValue.toLowerCase())
    );

    return field.onCreateNew && !field.disabled
      ? [...filteredOptions, CREATE_NEW_OPTION]
      : filteredOptions;
  }, [normalizedOptions, field.onCreateNew, field.disabled, inputValue, CREATE_NEW_OPTION]);

  const handleChange = useCallback((_, newValue) => {
    if (Array.isArray(newValue)) {
      onChange({
        target: {
          name: field.name,
          value: newValue.map(v => v.value),
          type: 'select',
          selectedOptions: newValue
        }
      });
      return;
    }

    if (newValue?.isCreateNew) {
      setIsCreating(true);
      return;
    }

    const normalizedValue = normalizeOption(newValue);
    onChange({
      target: {
        name: field.name,
        value: normalizedValue?.value || null,
        type: 'select',
        selectedOption: normalizedValue
      }
    });
  }, [field.name, onChange]);

  const handleInputChange = useCallback((_, newInputValue) => {
    setInputValue(newInputValue);
  }, []);

  const renderTags = useCallback((tagValue, getTagProps) => 
    tagValue.map((option, index) => (
      <Chip
        label={option.displayValue || option.label}
        {...getTagProps({ index })}
        size="small"
      />
    )), []);

  return (
    <Box>
      {isCreating ? (
        <CreateForm
          field={field}
          onSubmit={async (data) => {
            try {
              const newItem = await onCreateNew(data);
              const normalizedItem = normalizeOption(newItem);
              onChange({
                target: {
                  name: field.name,
                  value: normalizedItem.value,
                  type: 'select',
                  selectedOption: normalizedItem
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
      ) : (
        <Autocomplete
          multiple={field.multiple}
          value={selectedOption}
          inputValue={inputValue}
          onInputChange={handleInputChange}
          onChange={handleChange}
          options={displayedOptions}
          getOptionLabel={(option) => option?.displayValue || option?.label || ''}
          isOptionEqualToValue={(option, value) => 
            option?.id === value?.id || option?.value === value?.value
          }
          loading={isLoading}
          disabled={field.disabled || isLoading}
          freeSolo={false}
          disablePortal
          renderTags={field.multiple ? renderTags : undefined}
          renderOption={(props, option) => {
            const key = option.id || `option-${option.value}-${option.label}`;
            return (
              <li {...props} key={key}>
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    ...(option.isCreateNew && {
                      color: 'primary.main',
                      fontWeight: 'medium',
                      borderTop: '1px solid',
                      borderColor: 'divider',
                    })
                  }}
                >
                  {option.isCreateNew && <AddIcon fontSize="small" />}
                  <Box>
                    <Typography variant="body2">
                      {option.displayValue || option.label}
                    </Typography>
                    {option.displayValue && option.label !== option.displayValue && (
                      <Typography variant="caption" color="text.secondary">
                        {option.label}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={field.label}
              required={field.required}
              error={!!error}
              helperText={error || helperText}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
                endAdornment: (
                  <>
                    {isLoading ? <CircularProgress size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                )
              }}
              sx={{
                mt: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 0,
                }
              }}
            />
          )}
        />
      )}
    </Box>
  );
});

export const FormField = memo(({ 
  field, 
  value, 
  onChange, 
  relatedData,
  error,
  onCreateNew,
  isLoading = false,
  helperText
}) => {
  const getFieldOptions = useCallback(() => {
    if (field.type === 'select') {
      return field.options || [];
    }
    if (field.type === 'relational' || field.type === 'creatable') {
      return relatedData?.[field.name] || field.options || [];
    }
    return [];
  }, [field.type, field.name, field.options, relatedData]);

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
          helperText={helperText}
          options={getFieldOptions()}
          onCreateNew={field.onCreateNew || onCreateNew}
          isLoading={isLoading}
        />
      );
    default:
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
  }
}); 