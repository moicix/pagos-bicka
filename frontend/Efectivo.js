const Efectivo = () => {
  const data = [
    { id: 1, forma: 'Efectivo', fecha: '2025-11-12', descripcion: 'Abono de cliente', monto: '1000', tipo: 'Abono', cliente: 'Cliente C', distribuidora: 'Mom', vs: '', recibio: 'Chele', momAssignment: '1000', almaAssignment: '0', notas: '' },
    { id: 2, forma: 'Efectivo', fecha: '2025-11-12', descripcion: 'Gasto de oficina', monto: '200', tipo: 'Gasto', cliente: '', distribuidora: 'Alma', vs: '', recibio: 'Alma', momAssignment: '0', almaAssignment: '200', notas: '' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Efectivo</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b dark:border-gray-700">Forma Pago/Abono</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Fecha</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Descripción</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Monto</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Tipo</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Cliente/Proveedor</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Distribuidora</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">VS</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Recibió/Pagó</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Mom Assignment</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Alma Assignment</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Notas</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.forma}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.fecha}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.descripcion}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.monto}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.tipo}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.cliente}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.distribuidora}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.vs}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.recibio}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.momAssignment}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.almaAssignment}</td>
                <td className="py-2 px-4 border-b dark:border-gray-700">{row.notas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Efectivo;