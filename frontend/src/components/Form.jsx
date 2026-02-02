const Form = ({ onSubmit, children, className = '' }) => {
  return (
    <form onSubmit={onSubmit} className={`space-y-4 ${className}`} noValidate>
      {children}
    </form>
  );
};

export default Form;
