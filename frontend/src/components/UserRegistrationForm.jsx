import { useForm } from '../hooks/useForm';
import { validators } from '../utils/validators';
import Input from './Input';
import Button from './Button';
import Form from './Form';

const UserRegistrationForm = ({ onSuccess, onError }) => {
  const validationRules = {
    username: [validators.required, validators.username],
    email: [validators.required, validators.email],
    password: [validators.required, validators.minLength(8)],
    password2: [validators.required],
    first_name: [validators.required],
    last_name: [validators.required],
  };

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm(
    {
      username: '',
      email: '',
      password: '',
      password2: '',
      first_name: '',
      last_name: '',
    },
    validationRules
  );

  // Validación adicional para password2
  const password2Error = 
    values.password2 && values.password !== values.password2
      ? 'Las contraseñas no coinciden'
      : errors.password2;

  const onSubmit = async (formValues) => {
    try {
      await onSuccess(formValues);
    } catch (error) {
      if (onError) {
        onError(error);
      }
    }
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Nombre de usuario"
        name="username"
        value={values.username}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.username && errors.username}
        placeholder="usuario123"
        required
      />

      <Input
        label="Email"
        name="email"
        type="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.email && errors.email}
        placeholder="correo@ejemplo.com"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre"
          name="first_name"
          value={values.first_name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.first_name && errors.first_name}
          placeholder="Juan"
          required
        />

        <Input
          label="Apellido"
          name="last_name"
          value={values.last_name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.last_name && errors.last_name}
          placeholder="Pérez"
          required
        />
      </div>

      <Input
        label="Contraseña"
        name="password"
        type="password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.password && errors.password}
        placeholder="Mínimo 8 caracteres"
        required
      />

      <Input
        label="Confirmar contraseña"
        name="password2"
        type="password"
        value={values.password2}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.password2 && password2Error}
        placeholder="Repite tu contraseña"
        required
      />

      <Button
        type="submit"
        variant="primary"
        isLoading={isSubmitting}
        disabled={isSubmitting}
        className="w-full"
      >
        Registrarse
      </Button>
    </Form>
  );
};

export default UserRegistrationForm;
