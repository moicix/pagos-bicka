import { useState, useEffect, useMemo, useCallback } from 'react';
import { useBase, useRecords } from '@airtable/blocks/interface/ui';
import { FieldType } from '@airtable/blocks/interface/models';
import ConfigurationNotice from './ConfigurationNotice';

const REQUIRED_FIELDS = [
  { key: 'transFechaField', label: 'Fecha' },
  { key: 'transDescripcionField', label: 'Descripción' },
  { key: 'transCargoField', label: 'Cargo' },
  { key: 'transAbonoField', label: 'Abono' },
  { key: 'transSaldoField', label: 'Saldo' },
  { key: 'transCuentaField', label: 'Cuenta Bancaria' },
  { key: 'transClienteField', label: 'Cliente' },
  { key: 'transCotejadoField', label: 'Cotejado' },
  { key: 'transTipoField', label: 'Tipo' },
  { key: 'transPedidoField', label: 'Productos Relacionados' },
  { key: 'transAutoNumberField', label: 'Auto Incremento' },
  { key: 'transNotasField', label: 'Notas' },
];

const TRANSACCIONES_INITIAL_VISIBLE = 50;
const TRANSACCIONES_VISIBLE_INCREMENT = 50;

const toNumericValue = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  const stringValue = `${value}`.trim();
  if (stringValue === '') {
    return undefined;
  }
  const sanitized = stringValue.replace(/[^0-9.-]+/g, '');
  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const Transacciones = ({ customPropertyValueByKey, errorState }) => {
  const base = useBase();
  const props = customPropertyValueByKey ?? {};
  const table = props.transaccionesTable;
  const fallbackTable = base.tables[0];
  const records = useRecords(table ?? fallbackTable);
  const cuentasTable = props.cuentasTable;
  const fallbackCuentasTable = base.tables[0];
  const cuentasRecords = useRecords(cuentasTable ?? fallbackCuentasTable);
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [visibleRecordLimit, setVisibleRecordLimit] = useState(TRANSACCIONES_INITIAL_VISIBLE);
  const missingFields = REQUIRED_FIELDS.filter((field) => !props[field.key]);
  const autoNumberField =
    props.transAutoNumberField ??
    table?.fields?.find((field) => field.config?.type === FieldType.AUTO_NUMBER);

  const formatValue = (record, field) => (field ? record.getCellValueAsString(field) : '');
  const formatCheckbox = (record, field) => {
    if (!field) {
      return '';
    }
    return record.getCellValue(field) ? 'Sí' : 'No';
  };

  const formatAccountLabel = useCallback(
    (accountRecord) => {
      if (props.cuentasNombreField) {
        const label = accountRecord.getCellValueAsString(props.cuentasNombreField);
        if (label) {
          return label;
        }
      }
      return accountRecord.name;
    },
    [props.cuentasNombreField]
  );

  const accountTabs = useMemo(() => {
    if (!props.cuentasTable) {
      return [{ id: null, label: 'Todas las cuentas' }];
    }
    return [
      { id: null, label: 'Todas las cuentas' },
      ...cuentasRecords.map((accountRecord) => ({
        id: accountRecord.id,
        label: formatAccountLabel(accountRecord),
      })),
    ];
  }, [props.cuentasTable, cuentasRecords, formatAccountLabel]);

  const shouldShowAccountTabs = Boolean(props.cuentasTable && accountTabs.length > 1);

  useEffect(() => {
    if (!activeAccountId) {
      return;
    }
    const exists = accountTabs.some((tab) => tab.id === activeAccountId);
    if (!exists) {
      setActiveAccountId(null);
    }
  }, [activeAccountId, accountTabs]);

  const matchesAccountSelection = (record) => {
    if (!props.transCuentaField || !activeAccountId) {
      return true;
    }
    const linkedRecords = record.getCellValue(props.transCuentaField);
    if (!linkedRecords) {
      return false;
    }
    const linkedArray = Array.isArray(linkedRecords)
      ? linkedRecords
      : [linkedRecords];
    return linkedArray.some((linkedRecord) => linkedRecord?.id === activeAccountId);
  };

  const filteredRecords = records.filter(matchesAccountSelection);

  const sortedRecords = useMemo(() => {
    const hasDateField = Boolean(props.transFechaField);
    const hasAutoNumberField = Boolean(autoNumberField);
    if (!hasDateField && !hasAutoNumberField) {
      return filteredRecords;
    }

    const normalizeDate = (value) => {
      if (value instanceof Date) {
        return value.getTime();
      }
      if (typeof value === 'string') {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? 0 : parsed;
      }
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
      }
      return 0;
    };

    const normalizeAutoNumber = (value) => {
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
      }
      if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };

    return [...filteredRecords].sort((a, b) => {
      const aDate = hasDateField ? normalizeDate(a.getCellValue(props.transFechaField)) : 0;
      const bDate = hasDateField ? normalizeDate(b.getCellValue(props.transFechaField)) : 0;
      if (aDate !== bDate) {
        return bDate - aDate;
      }
      if (hasAutoNumberField) {
        const aAuto = normalizeAutoNumber(a.getCellValue(autoNumberField));
        const bAuto = normalizeAutoNumber(b.getCellValue(autoNumberField));
        if (aAuto !== bAuto) {
          return aAuto - bAuto;
        }
      }
      return 0;
    });
  }, [filteredRecords, props.transFechaField, autoNumberField]);

  const getNumericCellValue = useCallback(
    (record, field) => {
      if (!field) {
        return undefined;
      }
      return toNumericValue(record.getCellValue(field));
    },
    []
  );

  const rowStatuses = useMemo(() => {
    if (!props.transSaldoField) {
      return sortedRecords.map(() => 'unknown');
    }
    const tolerance = 0.01;
    return sortedRecords.map((record, index) => {
      const prevRecord = sortedRecords[index + 1];
      if (!prevRecord) {
        return 'match';
      }
      const prevSaldo = getNumericCellValue(prevRecord, props.transSaldoField);
      const currentSaldo = getNumericCellValue(record, props.transSaldoField);
      if (prevSaldo === undefined || currentSaldo === undefined) {
        return 'unknown';
      }
      const abono = getNumericCellValue(record, props.transAbonoField);
      const cargo = getNumericCellValue(record, props.transCargoField);
      const matchesAbono =
        abono !== undefined && Math.abs(currentSaldo - (prevSaldo + abono)) < tolerance;
      const matchesCargo =
        cargo !== undefined && Math.abs(currentSaldo - (prevSaldo + cargo)) < tolerance;
      if (matchesAbono || matchesCargo) {
        return 'match';
      }
      return 'mismatch';
    });
  }, [
    sortedRecords,
    props.transSaldoField,
    props.transAbonoField,
    props.transCargoField,
    getNumericCellValue,
  ]);

  useEffect(() => {
    setVisibleRecordLimit(TRANSACCIONES_INITIAL_VISIBLE);
  }, [sortedRecords.length, activeAccountId]);

  const visibleRecords = useMemo(
    () =>
      sortedRecords.slice(
        0,
        Math.min(sortedRecords.length, visibleRecordLimit)
      ),
    [sortedRecords, visibleRecordLimit]
  );
  const canShowMoreRecords = visibleRecords.length < sortedRecords.length;
  const remainingRecords = sortedRecords.length - visibleRecords.length;
  const nextRecordsToShow = Math.min(TRANSACCIONES_VISIBLE_INCREMENT, remainingRecords);
  const handleShowMoreRecords = useCallback(() => {
    setVisibleRecordLimit((prev) => Math.min(sortedRecords.length, prev + TRANSACCIONES_VISIBLE_INCREMENT));
  }, [sortedRecords.length]);
  const handleResetVisibleRecords = useCallback(() => {
    setVisibleRecordLimit(TRANSACCIONES_INITIAL_VISIBLE);
  }, []);

  const getRowBackgroundClass = (status) => {
    if (status === 'match') {
      return 'bg-green-50 dark:bg-green-900/40';
    }
    if (status === 'mismatch') {
      return 'bg-red-50 dark:bg-red-900/40';
    }
    return '';
  };

  if (!table || missingFields.length > 0) {
    return (
      <ConfigurationNotice
        title="Transacciones"
        tableMissing={!table}
        missingFields={missingFields}
        errorState={errorState}
      />
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Transacciones</h2>
      {shouldShowAccountTabs && (
        <div className="flex flex-wrap gap-2 mb-4">
          {accountTabs.map((tab) => {
            const isActive = activeAccountId === tab.id;
            return (
              <button
                key={tab.id ?? 'all'}
                onClick={() => setActiveAccountId(tab.id)}
                className={`px-4 py-1 rounded border text-sm font-semibold transition ${
                  isActive
                    ? 'border-blue-500 bg-blue-500 text-white hover:bg-blue-600'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}
      {sortedRecords.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Mostrando {visibleRecords.length} / {sortedRecords.length} transacciones
          </span>
          <div className="flex flex-wrap gap-2">
            {canShowMoreRecords && (
              <button
                type="button"
                onClick={handleShowMoreRecords}
                className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 dark:border-gray-600 dark:text-gray-200"
              >
                Mostrar {nextRecordsToShow} más
              </button>
            )}
            {!canShowMoreRecords && sortedRecords.length > TRANSACCIONES_INITIAL_VISIBLE && (
              <button
                type="button"
                onClick={handleResetVisibleRecords}
                className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 dark:border-gray-600 dark:text-gray-200"
              >
                Ver primeros {TRANSACCIONES_INITIAL_VISIBLE}
              </button>
            )}
          </div>
        </div>
      )}
      {visibleRecords.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
          No se encontraron transacciones
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
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
                  <th className="py-2 px-4 border-b dark:border-gray-700">Cotejado</th>
                  <th className="py-2 px-4 border-b dark:border-gray-700">Tipo</th>
                  <th className="py-2 px-4 border-b dark:border-gray-700">Productos Relacionados</th>
                  <th className="py-2 px-4 border-b dark:border-gray-700">Notas</th>
                </tr>
              </thead>
              <tbody>
                {visibleRecords.map((record, index) => (
                  <tr key={record.id} className={getRowBackgroundClass(rowStatuses[index])}>
                    <td className="py-2 px-4 border-b dark:border-gray-700">
                      {formatValue(record, props.transDescripcionField)}
                    </td>
                    <td className="py-2 px-4 border-b dark:border-gray-700">
                      {formatValue(record, props.transFechaField)}
                    </td>
                    <td className="py-2 px-4 border-b dark:border-gray-700">
                      {formatValue(record, props.transCargoField)}
                    </td>
                    <td className="py-2 px-4 border-b dark:border-gray-700">
                      {formatValue(record, props.transAbonoField)}
                    </td>
                    <td className="py-2 px-4 border-b dark:border-gray-700">
                      {formatValue(record, props.transSaldoField)}
                    </td>
                    <td className="py-2 px-4 border-b dark:border-gray-700">
                      {formatValue(record, props.transCuentaField)}
                    </td>
                    <td className="py-2 px-4 border-b dark:border-gray-700">
                      {formatValue(record, props.transClienteField)}
                    </td>
                    <td className="py-2 px-4 border-b dark:border-gray-700">
                      {formatCheckbox(record, props.transCotejadoField)}
                    </td>
                    <td className="py-2 px-4 border-b dark:border-gray-700">
                      {formatValue(record, props.transTipoField)}
                    </td>
                    <td className="py-2 px-4 border-b dark:border-gray-700">
                      {formatValue(record, props.transPedidoField)}
                    </td>
                    <td className="py-2 px-4 border-b dark:border-gray-700">
                      {formatValue(record, props.transNotasField)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 md:hidden">
            {visibleRecords.map((record, index) => {
              const descriptionValue =
                formatValue(record, props.transDescripcionField) || record.name;
              const fechaValue = formatValue(record, props.transFechaField);
              const tipoValue = formatValue(record, props.transTipoField) || 'Tipo desconocido';
              const cargoValue = formatValue(record, props.transCargoField);
              const abonoValue = formatValue(record, props.transAbonoField);
              const saldoValue = formatValue(record, props.transSaldoField);
              const cuentaValue = formatValue(record, props.transCuentaField);
              const clienteValue = formatValue(record, props.transClienteField);
              const productosValue = formatValue(record, props.transPedidoField);
              const notasValue = formatValue(record, props.transNotasField);
              const cotejadoValue = formatCheckbox(record, props.transCotejadoField);
              return (
                <div
                  key={record.id}
                  className={`rounded-2xl border bg-white p-4 shadow-sm transition ${getRowBackgroundClass(
                    rowStatuses[index]
                  )} dark:border-gray-600 dark:bg-gray-700`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                        {descriptionValue}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-300">
                        {fechaValue} · {tipoValue}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-200">
                      {cotejadoValue}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-gray-500 dark:text-gray-300 sm:grid-cols-2">
                    <div className="flex justify-between">
                      <span>Cargo</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {cargoValue || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Abono</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {abonoValue || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saldo</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {saldoValue || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cuenta</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {cuentaValue || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cliente</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {clienteValue || '—'}
                      </span>
                    </div>
                  </div>
                  {(productosValue || notasValue) && (
                    <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-300">
                      {productosValue && (
                        <p>
                          <span className="font-semibold text-gray-700 dark:text-gray-200">
                            Productos:{' '}
                          </span>
                          <span className="text-gray-900 dark:text-gray-100">
                            {productosValue}
                          </span>
                        </p>
                      )}
                      {notasValue && (
                        <p>
                          <span className="font-semibold text-gray-700 dark:text-gray-200">
                            Notas:{' '}
                          </span>
                          <span className="text-gray-900 dark:text-gray-100">{notasValue}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Transacciones;
