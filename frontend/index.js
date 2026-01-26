import { useState, useEffect } from 'react';
import { initializeBlock, useCustomProperties } from '@airtable/blocks/interface/ui';
import './style.css';
import CuentasBancarias from './CuentasBancarias';
import Transacciones from './Transacciones';
import Efectivo from './Efectivo';
import ClienteAssignment from './ClienteAssignment';
import SpreadsheetPopup from './SpreadsheetPopup';
import { FieldType } from '@airtable/blocks/interface/models';

const TABS = ['Cuentas Bancarias', 'Transacciones', 'Asignar Cliente', 'Efectivo'];

const findTableByName = (base, name) => {
  const exact = base.getTableByNameIfExists(name);
  if (exact) {
    return exact;
  }
  const normalized = name?.toLowerCase?.() ?? '';
  return base.tables.find((table) => table.name.toLowerCase().includes(normalized));
};

const findFieldByNames = (table, names = []) => {
  if (!table || !names.length) {
    return undefined;
  }
  const normalized = new Set(names.map((name) => name.toLowerCase()));
  return table.fields.find((field) => normalized.has(field.name.toLowerCase()));
};

const createFieldProperty = ({ key, label, table, allowedTypes, defaultNames = [] }) => ({
  key,
  label,
  type: 'field',
  table,
  defaultValue: findFieldByNames(table, defaultNames),
  shouldFieldBeAllowed: (field) => allowedTypes.includes(field.config.type),
});

const getCustomProperties = (base) => {
  const cuentasTable = findTableByName(base, 'Cuentas Bancarias');
  const transaccionesTable = findTableByName(base, 'Transacciones');
  const clientesTable = findTableByName(base, 'Clientes');
  const efectivoTable = findTableByName(base, 'Efectivo');
  const textTypes = [FieldType.SINGLE_LINE_TEXT, FieldType.MULTILINE_TEXT];
  const numberTypes = [FieldType.NUMBER, FieldType.CURRENCY];
  return [
    {
      key: 'cuentasTable',
      label: 'Tabla Cuentas Bancarias',
      type: 'table',
      defaultValue: cuentasTable,
    },
    {
      key: 'transaccionesTable',
      label: 'Tabla Transacciones',
      type: 'table',
      defaultValue: transaccionesTable,
    },
    {
      key: 'clientesTable',
      label: 'Tabla Clientes',
      type: 'table',
      defaultValue: clientesTable,
    },
    {
      key: 'efectivoTable',
      label: 'Tabla Efectivo',
      type: 'table',
      defaultValue: efectivoTable,
    },
    createFieldProperty({
      key: 'cuentasNombreField',
      label: 'Campo Nombre (Cuentas)',
      table: cuentasTable,
      allowedTypes: [...textTypes],
      defaultNames: ['Nombre'],
    }),
    createFieldProperty({
      key: 'cuentasBancoField',
      label: 'Campo Banco (Cuentas)',
      table: cuentasTable,
      allowedTypes: [FieldType.SINGLE_SELECT, ...textTypes],
      defaultNames: ['Banco'],
    }),
    createFieldProperty({
      key: 'cuentasNumeroField',
      label: 'Campo Número de Cuenta (Cuentas)',
      table: cuentasTable,
      allowedTypes: [...textTypes],
      defaultNames: ['Número de Cuenta', 'Numero de Cuenta'],
    }),
    createFieldProperty({
      key: 'cuentasSaldoField',
      label: 'Campo Saldo (Cuentas)',
      table: cuentasTable,
      allowedTypes: [...numberTypes, FieldType.FORMULA],
      defaultNames: ['Saldo', 'Saldo Inicial'],
    }),
    createFieldProperty({
      key: 'cuentasDistribuidoraField',
      label: 'Campo Distribuidora Principal (Cuentas)',
      table: cuentasTable,
      allowedTypes: [FieldType.SINGLE_SELECT],
      defaultNames: ['Distribuidora Principal'],
    }),
    createFieldProperty({
      key: 'cuentasNotasField',
      label: 'Campo Notas (Cuentas)',
      table: cuentasTable,
      allowedTypes: [...textTypes],
      defaultNames: ['Notas'],
    }),
    createFieldProperty({
      key: 'transFechaField',
      label: 'Campo Fecha (Transacciones)',
      table: transaccionesTable,
      allowedTypes: [FieldType.DATE, FieldType.DATE_TIME],
      defaultNames: ['Fecha'],
    }),
    createFieldProperty({
      key: 'transDescripcionField',
      label: 'Campo Descripción (Transacciones)',
      table: transaccionesTable,
      allowedTypes: [...textTypes],
      defaultNames: ['Descripción'],
    }),
    createFieldProperty({
      key: 'transCargoField',
      label: 'Campo Cargo (Transacciones)',
      table: transaccionesTable,
      allowedTypes: [...numberTypes],
      defaultNames: ['Cargo'],
    }),
    createFieldProperty({
      key: 'transAbonoField',
      label: 'Campo Abono (Transacciones)',
      table: transaccionesTable,
      allowedTypes: [...numberTypes],
      defaultNames: ['Abono'],
    }),
    createFieldProperty({
      key: 'transSaldoField',
      label: 'Campo Saldo (Transacciones)',
      table: transaccionesTable,
      allowedTypes: [...numberTypes, FieldType.FORMULA],
      defaultNames: ['Saldo'],
    }),
    createFieldProperty({
      key: 'transCuentaField',
      label: 'Campo Cuenta Bancaria (Transacciones)',
      table: transaccionesTable,
      allowedTypes: [FieldType.MULTIPLE_RECORD_LINKS],
      defaultNames: ['Cuenta Bancaria'],
    }),
    createFieldProperty({
      key: 'transClienteField',
      label: 'Campo Cliente (Transacciones)',
      table: transaccionesTable,
      allowedTypes: [FieldType.MULTIPLE_RECORD_LINKS],
      defaultNames: ['Cliente'],
    }),
    createFieldProperty({
      key: 'transCotejadoField',
      label: 'Campo Cotejado (Transacciones)',
      table: transaccionesTable,
      allowedTypes: [FieldType.CHECKBOX],
      defaultNames: ['Cotejado'],
    }),
    createFieldProperty({
      key: 'transTipoField',
      label: 'Campo Tipo (Transacciones)',
      table: transaccionesTable,
      allowedTypes: [FieldType.SINGLE_SELECT],
      defaultNames: ['Tipo'],
    }),
    createFieldProperty({
      key: 'transBancoField',
      label: 'Campo Banco (Transacciones)',
      table: transaccionesTable,
      allowedTypes: [FieldType.SINGLE_SELECT],
      defaultNames: ['Banco'],
    }),
    createFieldProperty({
      key: 'transCuentaExtraidaField',
      label: 'Campo Cuenta BBVA Extraída (Transacciones)',
      table: transaccionesTable,
      allowedTypes: [FieldType.SINGLE_LINE_TEXT, FieldType.MULTILINE_TEXT, FieldType.NUMBER, FieldType.FORMULA],
      defaultNames: ['Cuenta BBVA Extraída'],
    }),
    createFieldProperty({
      key: 'transPedidoField',
      label: 'Campo Productos Relacionados (Transacciones)',
      table: transaccionesTable,
      allowedTypes: [FieldType.MULTIPLE_RECORD_LINKS],
      defaultNames: ['Productos Relacionados'],
    }),
    createFieldProperty({
      key: 'transAutoNumberField',
      label: 'Campo Auto Incremento (Transacciones)',
      table: transaccionesTable,
      allowedTypes: [FieldType.AUTO_NUMBER],
      defaultNames: ['Auto Increment', 'Auto Incremento', 'Auto Number', 'AutoNumber'],
    }),
    createFieldProperty({
      key: 'transNotasField',
      label: 'Campo Notas (Transacciones)',
      table: transaccionesTable,
      allowedTypes: [...textTypes],
      defaultNames: ['Notas'],
    }),
    createFieldProperty({
      key: 'clientesNombreField',
      label: 'Campo Nombre (Clientes)',
      table: clientesTable,
      allowedTypes: [...textTypes],
      defaultNames: ['Nombre'],
    }),
    createFieldProperty({
      key: 'clientesBancoField',
      label: 'Campo BANCO (Clientes)',
      table: clientesTable,
      allowedTypes: [FieldType.SINGLE_SELECT, ...textTypes],
      defaultNames: ['BANCO'],
    }),
    createFieldProperty({
      key: 'clientesNumCuentaField',
      label: 'Campo Num Cuenta (Clientes)',
      table: clientesTable,
      allowedTypes: [...textTypes],
      defaultNames: ['Num Cuenta', 'Número de Cuenta'],
    }),
    createFieldProperty({
      key: 'clientesCodField',
      label: 'Campo COD Cliente (Clientes)',
      table: clientesTable,
      allowedTypes: [...textTypes],
      defaultNames: ['COD Cliente', 'Cliente ID'],
    }),
    createFieldProperty({
      key: 'efectivoFechaField',
      label: 'Campo Fecha (Efectivo)',
      table: efectivoTable,
      allowedTypes: [FieldType.DATE, FieldType.DATE_TIME],
      defaultNames: ['Fecha'],
    }),
    createFieldProperty({
      key: 'efectivoDescripcionField',
      label: 'Campo Descripción (Efectivo)',
      table: efectivoTable,
      allowedTypes: [...textTypes],
      defaultNames: ['Descripción'],
    }),
    createFieldProperty({
      key: 'efectivoMontoField',
      label: 'Campo Monto (Efectivo)',
      table: efectivoTable,
      allowedTypes: [...numberTypes],
      defaultNames: ['Monto'],
    }),
    createFieldProperty({
      key: 'efectivoClienteField',
      label: 'Campo Cliente/Proveedor (Efectivo)',
      table: efectivoTable,
      allowedTypes: [FieldType.MULTIPLE_RECORD_LINKS],
      defaultNames: ['Cliente/Proveedor', 'Cliente'],
    }),
    createFieldProperty({
      key: 'efectivoNotasField',
      label: 'Campo Notas (Efectivo)',
      table: efectivoTable,
      allowedTypes: [...textTypes],
      defaultNames: ['Notas'],
    }),
  ];
};

function Main() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { customPropertyValueByKey, errorState } = useCustomProperties(getCustomProperties);

  const handleOpenPopup = () => setIsPopupOpen(true);
  const handleClosePopup = () => setIsPopupOpen(false);
  const handleTabSelect = (tab) => {
    if (tab === activeTab) {
      return;
    }
    setIsTabLoading(true);
    setActiveTab(tab);
  };

  useEffect(() => {
    if (!isTabLoading) {
      return;
    }
    const timer = window.setTimeout(() => setIsTabLoading(false), 260);
    return () => window.clearTimeout(timer);
  }, [activeTab, isTabLoading]);

  const renderContent = () => {
    const sharedProps = { customPropertyValueByKey, errorState };
    switch (activeTab) {
      case 'Cuentas Bancarias':
        return <CuentasBancarias {...sharedProps} />;
      case 'Transacciones':
        return <Transacciones {...sharedProps} />;
      case 'Asignar Cliente':
        return <ClienteAssignment {...sharedProps} />;
      case 'Efectivo':
        return <Efectivo {...sharedProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-8 min-h-screen relative bg-gray-gray50 dark:bg-gray-gray800 text-gray-gray700 dark:text-gray-gray200">
      <div className="rounded-lg p-6 sm:p-12 w-full bg-white shadow-xl dark:bg-gray-gray700 dark:shadow-none">
        <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-600">
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  className={`py-2 px-4 font-semibold ${isActive ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600 dark:text-gray-300'}`}
                  onClick={() => handleTabSelect(tab)}
                >
                  {tab}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleOpenPopup}
              className="rounded bg-blue-500 px-4 py-2 text-white font-bold hover:bg-blue-700"
            >
              Importar Datos
            </button>
          </div>
        </div>
        {errorState?.error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
            {errorState.error.message}
          </div>
        )}
        <div className="relative mt-8">
          {isTabLoading && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-white/70 dark:bg-gray-900/70">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></span>
              <span className="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-200">
                Cargando vista...
              </span>
            </div>
          )}
          <div className={isTabLoading ? 'opacity-50' : ''}>{renderContent()}</div>
        </div>
      </div>
      {isPopupOpen && (
        <SpreadsheetPopup
          onClose={handleClosePopup}
          cuentasTable={customPropertyValueByKey?.cuentasTable}
          cuentasNombreField={customPropertyValueByKey?.cuentasNombreField}
          customPropertyValueByKey={customPropertyValueByKey}
        />
      )}
    </div>
  );
}

initializeBlock({ interface: () => <Main /> });
