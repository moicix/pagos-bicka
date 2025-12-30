const Transacciones = () => {
  const data = [
    { id: 1, descripcion: 'Pago a proveedor', fecha: '2025-11-12', cargo: '500', abono: '0', saldo: '9500', cuentaBancaria: 'BBVA-3056', cliente: 'Cliente A', distribuidora: 'Mom', cotejado: 'Sí', tipo: 'SPEI Enviado', pedidoRelacionado: 'P-001', pagoRelacionado: 'PG-001', notas: '' },
    { id: 2, descripcion: 'Depósito de cliente', fecha: '2025-11-12', cargo: '0', abono: '1000', saldo: '21000', cuentaBancaria: 'Banorte-1234', cliente: 'Cliente B', distribuidora: 'Alma', cotejado: 'No', tipo: 'Depósito', pedidoRelacionado: 'P-002', pagoRelacionado: 'PG-002', notas: '' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Transacciones</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b dark:border-gray-700">Descripción</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Fecha</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Cargo</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Abono</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Saldo</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Cuenta Bancaria</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Cliente</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Distribuidora</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Cotejado</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Tipo</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Pedido Relacionado</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Pago Relacionado</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Notas</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.descripcion}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.fecha}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.cargo}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.abono}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.saldo}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.cuentaBancaria}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.cliente}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.distribuidora}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.cotejado}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.tipo}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.pedidoRelacionado}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.pagoRelacionado}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.notas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transacciones;