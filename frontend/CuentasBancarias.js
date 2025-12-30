const CuentasBancarias = () => {
  const data = [
    { id: 1, nombre: 'BBVA-3056', banco: 'BBVA', numeroCuenta: '1234567890', saldoInicial: '10000', distribuidora: 'Mom', notas: '' },
    { id: 2, nombre: 'Banorte-1234', banco: 'Banorte', numeroCuenta: '0987654321', saldoInicial: '20000', distribuidora: 'Alma', notas: '' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Cuentas Bancarias</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b dark:border-gray-700">Nombre</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Banco</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Número de Cuenta</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Saldo Inicial</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Distribuidora Principal</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Notas</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.nombre}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.banco}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.numeroCuenta}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.saldoInicial}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.distribuidora}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.notas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CuentasBancarias;