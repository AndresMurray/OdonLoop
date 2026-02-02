import { useState } from 'react';
import { validateForm } from '../utils/validators';

export const useForm = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = (onSubmit) => {
    return async (e) => {
      e.preventDefault();
      setIsSubmitting(true);

      // Validar todos los campos
      const validationErrors = validateForm(values, validationRules);
      
      if (Object.keys(validationErrors).length > 0) {
        console.log('Errores de validación:', validationErrors);
        setErrors(validationErrors);
        // Marcar todos los campos como touched para mostrar errores
        const allTouched = Object.keys(validationRules).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {});
        setTouched(allTouched);
        setIsSubmitting(false);
        return;
      }

      console.log('Enviando datos:', values);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Error en submit:', error);
        // Manejar errores del servidor
        if (error.errors) {
          setErrors(error.errors);
        }
      } finally {
        setIsSubmitting(false);
      }
    };
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setErrors,
  };
};
