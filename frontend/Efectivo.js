import { useBase, useRecords } from '@airtable/blocks/interface/ui';
import ConfigurationNotice from './ConfigurationNotice';

const REQUIRED_FIELDS = [
  { key: 'efectivoFechaField', label: 'Fecha' },
  { key: 'efectivoDescripcionField', label: 'Descripción' },
  { key: 'efectivoMontoField', label: 'Monto' },
  { key: 'efectivoClienteField', label: 'Cliente/Proveedor' },
  { key: 'efectivoNotasField', label: 'Notas' },
];

const Efectivo = ({ customPropertyValueByKey, errorState }) => {
  const base = useBase();
  const props = customPropertyValueByKey ?? {};
  const table = props.efectivoTable;
  const fallbackTable = base.tables[0];
  const records = useRecords(table ?? fallbackTable);
  const missingFields = REQUIRED_FIELDS.filter((field) => !props[field.key]);

  if (!table || missingFields.length > 0) {
    return (
      <ConfigurationNotice
        title="Efectivo"
        tableMissing={!table}
        missingFields={missingFields}
        errorState={errorState}
      />
    );
  }

  const formatValue = (record, field) => (field ? record.getCellValueAsString(field) : '');

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Efectivo</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b dark:border-gray-700">Fecha</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Descripción</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Monto</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Cliente/Proveedor</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Notas</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="py-6 px-4 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  Aún no hay registros de efectivo
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id}>
                  <td className="py-2 px-4 border-b dark:border-gray-700">
                    {formatValue(record, props.efectivoFechaField)}
                  </td>
                  <td className="py-2 px-4 border-b dark:border-gray-700">
                    {formatValue(record, props.efectivoDescripcionField)}
                  </td>
                  <td className="py-2 px-4 border-b dark:border-gray-700">
                    {formatValue(record, props.efectivoMontoField)}
                  </td>
                  <td className="py-2 px-4 border-b dark:border-gray-700">
                    {formatValue(record, props.efectivoClienteField)}
                  </td>
                  <td className="py-2 px-4 border-b dark:border-gray-700">
                    {formatValue(record, props.efectivoNotasField)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Efectivo;
