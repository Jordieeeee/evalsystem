export const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return (
    <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
      {message}
    </div>
  );
};