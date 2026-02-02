export const validators = {
  required: (value) => {
    if (!value || value.trim() === '') {
      return 'Este campo es requerido';
    }
    return null;
  },

  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Email inválido';
    }
    return null;
  },

  minLength: (min) => (value) => {
    if (value.length < min) {
      return `Debe tener al menos ${min} caracteres`;
    }
    return null;
  },

  matchField: (fieldName, fieldValue) => (value) => {
    if (value !== fieldValue) {
      return `${fieldName} no coincide`;
    }
    return null;
  },

  username: (value) => {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(value)) {
      return 'Usuario debe tener 3-20 caracteres alfanuméricos';
    }
    return null;
  },
};

export const validateField = (value, rules = []) => {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
};

export const validateForm = (values, validationRules) => {
  const errors = {};
  
  Object.keys(validationRules).forEach((fieldName) => {
    const rules = validationRules[fieldName];
    const error = validateField(values[fieldName] || '', rules);
    if (error) {
      errors[fieldName] = error;
    }
  });

  return errors;
};
