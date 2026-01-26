const ConfigurationNotice = ({ title, tableMissing, missingFields = [], errorState }) => {
  const instructions = [];
  if (tableMissing) {
    instructions.push('Selecciona la tabla correspondiente en el panel de propiedades.');
  }
  if (missingFields.length) {
    instructions.push(
      `Asegúrate de mapear: ${missingFields.map((field) => field.label).join(', ')}.`
    );
  }

  return (
    <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-gray-700 dark:border-yellow-500 dark:bg-yellow-900/40">
      <p className="font-semibold text-yellow-800 dark:text-yellow-200">
        {title} necesita configuración
      </p>
      <p className="mt-1 text-yellow-700 dark:text-yellow-100">
        Abre el panel de propiedades y completa la configuración necesaria para que la pestaña
        pueda leer datos reales.
      </p>
      {instructions.length > 0 && (
        <ul className="mt-2 list-disc pl-5 space-y-1 text-yellow-700 dark:text-yellow-100">
          {instructions.map((instruction) => (
            <li key={instruction}>{instruction}</li>
          ))}
        </ul>
      )}
      {errorState?.error?.message && (
        <p className="mt-2 text-xs text-red-700 dark:text-red-300">{errorState.error.message}</p>
      )}
    </div>
  );
};

export default ConfigurationNotice;
