import { useBase, useRecords } from '@airtable/blocks/interface/ui';
import ConfigurationNotice from './ConfigurationNotice';

const REQUIRED_FIELDS = [
  { key: 'cuentasNombreField', label: 'Nombre' },
  { key: 'cuentasBancoField', label: 'Banco' },
  { key: 'cuentasNumeroField', label: 'Número de Cuenta' },
  { key: 'cuentasSaldoField', label: 'Saldo' },
  { key: 'cuentasDistribuidoraField', label: 'Distribuidora Principal' },
  { key: 'cuentasNotasField', label: 'Notas' },
];

const CuentasBancarias = ({ customPropertyValueByKey, errorState }) => {
  const base = useBase();
  const props = customPropertyValueByKey ?? {};
  const table = props.cuentasTable;
  const fallbackTable = base.tables[0];
  const records = useRecords(table ?? fallbackTable);
  const missingFields = REQUIRED_FIELDS.filter((field) => !props[field.key]);

  if (!table || missingFields.length > 0) {
    return (
      <ConfigurationNotice
        title="Cuentas Bancarias"
        tableMissing={!table}
        missingFields={missingFields}
        errorState={errorState}
      />
    );
  }

  const formatValue = (record, field) => {
    if (!field) {
      return '';
    }
    return record.getCellValueAsString(field);
  };

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
              <th className="py-2 px-4 border-b dark:border-gray-700">Saldo</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Distribuidora Principal</th>
              <th className="py-2 px-4 border-b dark:border-gray-700">Notas</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-6 px-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No hay registros en Cuentas Bancarias
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id}>
                  <td className="py-2 px-4 border-b dark:border-gray-700">
                    {formatValue(record, props.cuentasNombreField)}
                  </td>
                  <td className="py-2 px-4 border-b dark:border-gray-700">
                    {formatValue(record, props.cuentasBancoField)}
                  </td>
                  <td className="py-2 px-4 border-b dark:border-gray-700">
                    {formatValue(record, props.cuentasNumeroField)}
                  </td>
                  <td className="py-2 px-4 border-b dark:border-gray-700">
                    {formatValue(record, props.cuentasSaldoField)}
                  </td>
                  <td className="py-2 px-4 border-b dark:border-gray-700">
                    {formatValue(record, props.cuentasDistribuidoraField)}
                  </td>
                  <td className="py-2 px-4 border-b dark:border-gray-700">
                    {formatValue(record, props.cuentasNotasField)}
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

export default CuentasBancarias;
