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
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

const normalizeOption = (option) => {
  if (!option) return null;
  
  return {
    id: String(option.id || option.value || ''),
    value: option.value,
    label: option.label || String(option.value),
    ...option
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
  isLoading 
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
      helperText={error}
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
        )
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

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSubmit(formData);
  }, [formData, onSubmit]);

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
  isLoading
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const CREATE_NEW_OPTION = {
    id: '__create_new__',
    value: '__create_new__',
    label: field.createButtonText || 'Crear Nuevo',
    isCreateNew: true
  };

  const normalizedOptions = useMemo(() => 
    normalizeOptions(options), [options]
  );

  const selectedOption = useMemo(() => 
    normalizedOptions.find(opt => opt.value === value) || null,
    [normalizedOptions, value]
  );

  const displayedOptions = useMemo(() => {
    const filteredOptions = normalizedOptions.filter(option =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );

    return field.onCreateNew && !field.disabled
      ? [...filteredOptions, CREATE_NEW_OPTION]
      : filteredOptions;
  }, [normalizedOptions, field.onCreateNew, field.disabled, inputValue]);

  const handleChange = useCallback((_, newValue) => {
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
          value={selectedOption}
          inputValue={inputValue}
          onInputChange={handleInputChange}
          onChange={handleChange}
          options={displayedOptions}
          getOptionLabel={(option) => option?.label || ''}
          isOptionEqualToValue={(option, value) => 
            option?.id === value?.id
          }
          loading={isLoading}
          disabled={field.disabled || isLoading}
          freeSolo={false}
          disablePortal
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
                  {option.label}
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
              helperText={error}
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
  isLoading = false
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
          isLoading={isLoading}
        />
      );
  }
}); 