export const Button = ({ children, disabled, type = 'button', className = '', ...props }) => {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};