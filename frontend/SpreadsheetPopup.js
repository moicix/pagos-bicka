import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Spreadsheet from 'react-spreadsheet';
import { useBase, useRecords } from '@airtable/blocks/interface/ui';

const DEFAULT_BLANK_ROWS = 8;
const DEFAULT_COLUMN_WIDTH = 160;
const GRID_COLUMN_GAP_PX = 16;
const COLUMN_WIDTH_OVERRIDES = {
  Fecha: 140,
  Descripción: 360,
  Cargo: 140,
  Abono: 140,
  Saldo: 140,
  Monto: 140,
  Tipo: 140,
  'Notas/Cliente/Distribuidora': 320,
  'Cliente/Proveedor': 220,
  Distribuidora: 200,
  'Recibio/Pago': 160,
};

const createBlankRows = (columnCount, rowCount = DEFAULT_BLANK_ROWS) => {
  const safeColumnCount = Math.max(columnCount, 1);
  return Array.from({ length: rowCount }, () =>
    Array.from({ length: safeColumnCount }, () => ({ value: '' }))
  );
};

const cloneGrid = (grid) => grid.map(row => row.map(cell => ({ ...cell })));

const INITIAL_BLANK_ROWS = createBlankRows(1);

const ACCOUNT_DATA = {
  'BBVA-3056': {
    columns: [
      { title: 'Fecha', type: 'Date' },
      { title: 'Descripción', type: 'Text' },
      { title: 'Cargo', type: 'Number' },
      { title: 'Abono', type: 'Number' },
      { title: 'Saldo', type: 'Number' },
      { title: 'Notas/Cliente/Distribuidora', type: 'Text' }
    ],
    data: [
      [{ value: '17/09/2025' }, { value: 'SPEI ENVIADO SANTANDER / 0062430077... Better Sem 36' }, { value: '-507.31' }, { value: '' }, { value: '615.44' }, { value: 'Pago Better Sem 36' }],
      [{ value: '16/09/2025' }, { value: 'SPEI ENVIADO HSBC / 0057777913... kinela' }, { value: '-3000' }, { value: '' }, { value: '1122.75' }, { value: 'Pago Kinela Tina' }],
      [{ value: '16/09/2025' }, { value: 'PAGO CUENTA DE TERCERO / 0074332472... Kinela' }, { value: '-3000' }, { value: '' }, { value: '4122.75' }, { value: 'Pago Kinela Selene' }],
      [{ value: '16/09/2025' }, { value: 'SU PAGO EN EFECTIVO / EN COMERCIO' }, { value: '' }, { value: '5000' }, { value: '7122.75' }, { value: 'Deposito Efectivo Boletos' }],
      [{ value: '15/09/2025' }, { value: 'SPEI RECIBIDOBANAMEX / 0194043509... isn' }, { value: '' }, { value: '1064' }, { value: '2122.75' }, { value: 'Pago ISN Vaneza Medina' }],
      [{ value: '11/09/2025' }, { value: 'PAGO SEG: 0 / P0FC971405ZO... PAGO SEGURO' }, { value: '-375.08' }, { value: '' }, { value: '1058.75' }, { value: 'Pago seguro Casa Chele' }],
      [{ value: '06/09/2025' }, { value: 'SPEI ENVIADO INBURSA / 0058297592... Luz Elena' }, { value: '-160' }, { value: '' }, { value: '1433.83' }, { value: 'Pago Alarma Chele Mom' }],
      [{ value: '01/09/2025' }, { value: 'PAGO CUENTA DE TERCERO / 0052865752... Edmundo' }, { value: '' }, { value: '1560' }, { value: '1593.83' }, { value: 'Edmundo Honorarios Agosto' }],
      [{ value: '16/08/2025' }, { value: 'PAGO CUENTA DE TERCERO / 0011670027... Pago' }, { value: '-750' }, { value: '' }, { value: '33.83' }, { value: 'Pago Madai' }],
      [{ value: '15/08/2025' }, { value: 'GOBIERNO ELECTRONICO / GUIA:6379510...' }, { value: '-932' }, { value: '' }, { value: '783.83' }, { value: 'Pago ISN Vaneza Medina' }],
      [{ value: '15/08/2025' }, { value: 'SPEI RECIBIDOBANAMEX / 0122562046... isn' }, { value: '' }, { value: '932' }, { value: '1715.83' }, { value: 'Pago ISN Vaneza Medina' }],
      [{ value: '11/08/2025' }, { value: 'PAGO SEG: 0 / P0FC971405ZO... PAGO SEGURO' }, { value: '-375.08' }, { value: '' }, { value: '783.83' }, { value: 'Seguro Casa Alma/Mom' }],
      [{ value: '07/08/2025' }, { value: 'SPEI RECIBIDOBANAMEX / 0181236241... Transferencia' }, { value: '' }, { value: '1100' }, { value: '1158.91' }, { value: 'Vaneza Medina ISN' }],
      [{ value: '22/07/2025' }, { value: 'PAGO CUENTA DE TERCERO / 0003139845... Pago Demic' }, { value: '-2009' }, { value: '' }, { value: '58.91' }, { value: 'Pago Demic Mes de Julio' }],
      [{ value: '22/07/2025' }, { value: 'SAT / GUIA:5183109...' }, { value: '-56' }, { value: '' }, { value: '2067.91' }, { value: 'Pago Sat Joaquin' }],
      [{ value: '16/07/2025' }, { value: 'SPEI RECIBIDOBANAMEX / 0169095628... Transferencia' }, { value: '' }, { value: '1135' }, { value: '2123.91' }, { value: 'Vaneza Medina Pago ISN' }],
      [{ value: '15/07/2025' }, { value: 'GOBIERNO ELECTRONICO / GUIA:1560743...' }, { value: '-199' }, { value: '' }, { value: '988.91' }, { value: 'Pago ISN Luz Elena Najera' }],
      [{ value: '15/07/2025' }, { value: 'PAGO CUENTA DE TERCERO / 0003245946... Edmundo' }, { value: '' }, { value: '780' }, { value: '1187.91' }, { value: 'Edmundo Montes' }],
      [{ value: '15/07/2025' }, { value: 'SPEI RECIBIDOSANTANDER / 0159905167... TRANSFERENCIA' }, { value: '' }, { value: '300' }, { value: '407.91' }, { value: 'Oneida' }],
      [{ value: '11/07/2025' }, { value: 'PAGO SEG: 0 / P0FC971405ZO... PAGO SEGURO' }, { value: '-375.08' }, { value: '' }, { value: '107.91' }, { value: 'Seguro Casa Alma/Mom' }],
      [{ value: '05/07/2025' }, { value: 'SPEI ENVIADO INBURSA / 0059344678... Pago Alarma' }, { value: '-160' }, { value: '' }, { value: '482.99' }, { value: 'Pago Alarma Chele Mom' }]
    ]
  },
  'BBVA-3273': {
    columns: [
      { title: 'Fecha', type: 'Date' },
      { title: 'Descripción', type: 'Text' },
      { title: 'Cargo', type: 'Number' },
      { title: 'Abono', type: 'Number' },
      { title: 'Saldo', type: 'Number' },
      { title: 'Notas/Cliente/Distribuidora', type: 'Text' }
    ],
    data: [
      [{ value: '18/09/2025' }, { value: 'SPEI RECIBIDOBANAMEX / 0109217438... Transferencia' }, { value: '' }, { value: '400' }, { value: '32005.28' }, { value: 'Javier Estrada Kinela' }],
      [{ value: '17/09/2025' }, { value: 'PAGO CUENTA DE TERCERO / 0062715654... Imelda' }, { value: '' }, { value: '200' }, { value: '31605.28' }, { value: 'Imelda Boleto' }],
      [{ value: '17/09/2025' }, { value: 'PAGO CUENTA DE TERCERO / 0099021545... Kinela Susy-Norma' }, { value: '' }, { value: '800' }, { value: '31405.28' }, { value: 'Susy Kinela Norma Y susy' }],
      [{ value: '17/09/2025' }, { value: 'PAGO CUENTA DE TERCERO / 0096812432... qnela Sergio' }, { value: '' }, { value: '400' }, { value: '30605.28' }, { value: 'Sergio Kinela' }],
      [{ value: '17/09/2025' }, { value: 'SPEI RECIBIDOBANAMEX / 0103530835... Ropa' }, { value: '' }, { value: '650' }, { value: '30205.28' }, { value: 'Paola Miranda Mendiola' }],
      [{ value: '17/09/2025' }, { value: 'PAGO CUENTA DE TERCERO / 0005341313... rifa' }, { value: '' }, { value: '200' }, { value: '29555.28' }, { value: 'Maryfer Boleto' }],
      [{ value: '16/09/2025' }, { value: 'SU PAGO EN EFECTIVO / EN COMERCIO' }, { value: '' }, { value: '3000' }, { value: '29355.28' }, { value: 'Deposito Efectico Chele P/Kinela' }],
      [{ value: '16/09/2025' }, { value: 'PAGO CUENTA DE TERCERO / 0009678157... veronica fernandez' }, { value: '' }, { value: '500' }, { value: '26355.28' }, { value: 'Azucena Blanca Veronica' }],
      [{ value: '16/09/2025' }, { value: 'SPEI RECIBIDOSCOTIABANK / 0198591895... Jesus boletos' }, { value: '' }, { value: '400' }, { value: '25855.28' }, { value: 'Jesus Boletos' }],
      [{ value: '15/09/2025' }, { value: 'SPEI RECIBIDOHSBC / 0197512626... Abono Alexa' }, { value: '' }, { value: '100' }, { value: '25455.28' }, { value: 'Diana Duran Alexa' }]
    ]
  },
  'BANORTE': {
    columns: [
      { title: 'Fecha', type: 'Text' },
      { title: 'Descripción', type: 'Text' },
      { title: 'Cargo', type: 'Number' },
      { title: 'Abono', type: 'Number' },
      { title: 'Saldo', type: 'Number' },
      { title: 'Notas/Cliente/Distribuidora', type: 'Text' }
    ],
    data: [
      [{ value: '45912' }, { value: 'TRASPASO 0000250912... abono' }, { value: '' }, { value: '350' }, { value: '15116.26' }, { value: 'Isabel Bencomo' }],
      [{ value: '45904' }, { value: 'TRASPASO 0000250904... abono' }, { value: '' }, { value: '350' }, { value: '14766.26' }, { value: 'Isabel Bencomo' }],
      [{ value: '45903' }, { value: 'TRASPASO 0000250903... pago' }, { value: '' }, { value: '1000' }, { value: '14416.26' }, { value: 'Cambio Efectivo Rita' }],
      [{ value: '45902' }, { value: 'COMPRA ORDEN DE PAGO SPEI 0250902... Traspaso' }, { value: '-2000' }, { value: '' }, { value: '13416.26' }, { value: 'Traspaso a HSBC Credito' }],
      [{ value: '45902' }, { value: 'COMPRA ORDEN DE PAGO SPEI 0250902... Nancy' }, { value: '-500' }, { value: '' }, { value: '15416.26' }, { value: 'Cambio de Efectivo Nancy' }],
      [{ value: '45901' }, { value: 'COMPRA ORDEN DE PAGO SPEI 0250901... Traspaso' }, { value: '-11300' }, { value: '' }, { value: '15916.26' }, { value: 'Traspaso para lo del Palmore Chele' }],
      [{ value: '45901' }, { value: 'TRASPASO 0000250901... pago' }, { value: '' }, { value: '715' }, { value: '27216.26' }, { value: 'Pago Boletos Rita' }],
      [{ value: '45901' }, { value: 'OXXO MISION RFC:CCO 8605231N4...' }, { value: '-1017' }, { value: '' }, { value: '26501.26' }, { value: 'Pago de Vicky Gabrielito' }]
    ]
  },
  'HSBC': {
    columns: [
      { title: 'Fecha', type: 'Text' },
      { title: 'Descripción', type: 'Text' },
      { title: 'Cargo', type: 'Number' },
      { title: 'Abono', type: 'Number' },
      { title: 'Saldo', type: 'Number' },
      { title: 'Notas/Cliente/Distribuidora', type: 'Text' }
    ],
    data: [
      [{ value: '45412' }, { value: 'I.V.A.' }, { value: '-10.4' }, { value: '' }, { value: '-489.93' }, { value: '' }],
      [{ value: '45412' }, { value: 'MEMBRESIA SERVICIOS SIN LIMITE' }, { value: '-65' }, { value: '' }, { value: '468.13' }, { value: '' }],
      [{ value: '45408' }, { value: 'I.V.A.' }, { value: '-3.35' }, { value: '' }, { value: '-479.53' }, { value: '' }],
      [{ value: '45408' }, { value: 'MEMBRESIA SERVICIOS SIN LIMITE' }, { value: '-20.88' }, { value: '' }, { value: '533.13' }, { value: '' }],
      [{ value: '45408' }, { value: 'MERCADO*PAGO 5979683' }, { value: '' }, { value: '600' }, { value: '-476.18' }, { value: 'Perla Campos' }],
      [{ value: '45378' }, { value: 'I.V.A.' }, { value: '-7.05' }, { value: '' }, { value: '554.01' }, { value: '' }]
    ]
  },
  'Efectivo': {
    columns: [
      { title: 'Fecha', type: 'Text' },
      { title: 'Descripción', type: 'Text' },
      { title: 'Monto', type: 'Number' },
      { title: 'Tipo', type: 'Text' },
      { title: 'Cliente/Proveedor', type: 'Text' },
      { title: 'Distribuidora', type: 'Text' },
      { title: 'Recibio/Pago', type: 'Text' }
    ],
    data: [
      [{ value: '45834' }, { value: 'Pago Efectivo' }, { value: '5250' }, { value: 'Abonos' }, { value: 'Azucena' }, { value: 'Azucena' }, { value: 'Alma' }],
      [{ value: '45834' }, { value: 'Pago Efectivo' }, { value: '500' }, { value: '' }, { value: 'Berthita' }, { value: 'Azucena' }, { value: 'Alma' }],
      [{ value: '45834' }, { value: 'Pago Efectivo' }, { value: '100' }, { value: '' }, { value: 'Bonny' }, { value: 'Azucena' }, { value: 'Alma' }],
      [{ value: '45831' }, { value: 'Pago Efectivo' }, { value: '1500' }, { value: 'Abonos' }, { value: 'Diana Duran' }, { value: 'Diana Duran' }, { value: 'Chele' }],
      [{ value: '45831' }, { value: 'Pago Efectivo' }, { value: '200' }, { value: 'Abonos' }, { value: 'Alexa' }, { value: 'Diana Duran' }, { value: 'Chele' }],
      [{ value: '45826' }, { value: 'Pago Efectivo' }, { value: '1600' }, { value: 'Abonos' }, { value: 'Azucena' }, { value: 'Azucena' }, { value: 'Chele' }]
    ]
  }
};

const DEFAULT_ACCOUNT_NAME = 'BBVA-3056';
const DEFAULT_ACCOUNT = ACCOUNT_DATA[DEFAULT_ACCOUNT_NAME];

const normalizeTitle = (title = '') => {
  const stringTitle = `${title}`;
  return stringTitle
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
};

const parseNumberValue = (value) => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  const stringValue = `${value}`.trim();
  if (stringValue === '') {
    return undefined;
  }
  const sanitized = stringValue.replace(/,/g, '');
  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const formatNumberForMessage = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return 'N/A';
  }
  const numberValue = Number(value);
  return numberValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const parseTextValue = (value) => {
  if (value === null || value === undefined) {
    return undefined;
  }
  const stringValue = `${value}`.trim();
  return stringValue === '' ? undefined : stringValue;
};

const EXCEL_SERIAL_ORIGIN = new Date(Date.UTC(1899, 11, 30));
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const parseDateValue = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  const stringValue = `${value}`.trim();
  if (stringValue === '' || stringValue === 'undefined' || stringValue === 'null') {
    return undefined;
  }
  const slashParts = stringValue.split(/[-/]/).map((part) => part.trim());
  if (slashParts.length >= 3) {
    const [first, second, third] = slashParts;
    const day = Number(first);
    const month = Number(second) - 1;
    const year = Number(third);
    if ([day, month, year].every(Number.isFinite)) {
      const candidate = new Date(year, month, day);
      if (!Number.isNaN(candidate.getTime())) {
        return candidate;
      }
    }
  }
  const parsedIso = Date.parse(stringValue);
  if (!Number.isNaN(parsedIso)) {
    return new Date(parsedIso);
  }
  const serialNumber = Number(stringValue);
  if (!Number.isNaN(serialNumber) && serialNumber > 10000) {
    const candidate = new Date(EXCEL_SERIAL_ORIGIN.getTime() + serialNumber * MS_PER_DAY);
    if (!Number.isNaN(candidate.getTime())) {
      return candidate;
    }
  }
  return undefined;
};

const FIELD_TITLE_TO_PROPERTY_KEY = {
  fecha: 'transFechaField',
  descripcion: 'transDescripcionField',
  description: 'transDescripcionField',
  cargo: 'transCargoField',
  abono: 'transAbonoField',
  saldo: 'transSaldoField',
  'notas cliente distribuidora': 'transNotasField',
  notas: 'transNotasField',
};

const SpreadsheetPopup = ({ onClose, cuentasTable, cuentasNombreField, customPropertyValueByKey }) => {
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState(null);
  const [data, setData] = useState(cloneGrid(INITIAL_BLANK_ROWS));
  const [importStatus, setImportStatus] = useState(null);
  const [columnMappings, setColumnMappings] = useState([]);
  const [headerWidths, setHeaderWidths] = useState([]);
  const [rowHeaderWidth, setRowHeaderWidth] = useState(0);
  const spreadsheetWrapperRef = useRef(null);
  const historyRef = useRef([cloneGrid(INITIAL_BLANK_ROWS)]);
  const historyIndexRef = useRef(0);
  const undoingRef = useRef(false);
  const base = useBase();
  const fallbackCuentasTable = base.tables[0];
  const cuentasRecordsTable = cuentasTable ?? fallbackCuentasTable;
  const cuentasRecords = useRecords(cuentasRecordsTable);
  const config = customPropertyValueByKey ?? {};
  const transTable = config.transaccionesTable;
  const transRecordsTable = transTable ?? base.tables[0];
  const transRecords = useRecords(transRecordsTable);
  const shouldUseDynamicAccounts = Boolean(cuentasTable && cuentasNombreField);
  const dynamicAccountButtons = shouldUseDynamicAccounts
    ? (() => {
        const seen = new Set();
        const buttons = [];
        for (const record of cuentasRecords) {
          const value = record.getCellValueAsString(cuentasNombreField);
          const trimmedValue = value?.trim();
          if (!trimmedValue || seen.has(trimmedValue)) {
            continue;
          }
          seen.add(trimmedValue);
          buttons.push({ key: trimmedValue, label: trimmedValue });
        }
        return buttons;
      })()
    : [];
  const accountButtons = dynamicAccountButtons;

  const applyProgrammaticData = useCallback((nextData) => {
    undoingRef.current = true;
    setData(nextData);
    setTimeout(() => {
      undoingRef.current = false;
    }, 0);
  }, []);

  const resetDataHistory = useCallback(
    (columnCount, initialRows) => {
      const blank = initialRows ?? createBlankRows(Math.max(columnCount, 1));
      applyProgrammaticData(blank);
      historyRef.current = [cloneGrid(blank)];
      historyIndexRef.current = 0;
      setHeaderWidths([]);
      setRowHeaderWidth(0);
    },
    [applyProgrammaticData]
  );

  const recordHistory = useCallback((nextData) => {
    const snapshot = cloneGrid(nextData);
    const trimmed = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current = [...trimmed, snapshot];
    historyIndexRef.current = trimmed.length;
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) {
      return;
    }
    const previousIndex = historyIndexRef.current - 1;
    const previousSnapshot = historyRef.current[previousIndex];
    if (!previousSnapshot) {
      return;
    }
    historyIndexRef.current = previousIndex;
    applyProgrammaticData(cloneGrid(previousSnapshot));
  }, [applyProgrammaticData]);

  const getColumnsForType = (type) => ACCOUNT_DATA[type]?.columns ?? DEFAULT_ACCOUNT.columns;

  const handleRecordTypeSelect = (type) => {
    const columns = getColumnsForType(type);
    const columnCount = columns?.length ?? 1;
    const initialRows = createBlankRows(columnCount);

    setAccountType(type);
    setStep(2);
    setColumnMappings(columns ?? []);
    resetDataHistory(columnCount, initialRows);
  };

  const handleClearSpreadsheet = () => {
    setImportStatus(null);
    const columns = getColumnsForType(accountType);
    const columnCount = columns?.length ?? columnMappings.length ?? 1;
    resetDataHistory(columnCount);
  };

  const handleColumnMappingChange = (index, field, value) => {
    const newMappings = [...columnMappings];
    const oldMapping = newMappings[index];
    newMappings[index] = { ...oldMapping, [field]: value };
    setColumnMappings(newMappings);
  };

  const handleCleanDuplicates = useCallback(() => {
    const duplicateRows = importStatus?.rowsWithDiscrepancy ?? [];
    if (!duplicateRows.length) {
      return;
    }
    const duplicateIndexes = new Set(
      duplicateRows.map((row) => {
        const idx = Number(row.rowIndex) - 1;
        return Number.isNaN(idx) ? -1 : idx;
      })
    );
    const filteredRows = data.filter((_, idx) => !duplicateIndexes.has(idx));
    const columns = filteredRows[0]?.length ?? columnMappings.length ?? 1;
    const nextRows = filteredRows.length > 0 ? filteredRows : createBlankRows(columns);
    resetDataHistory(columns, nextRows);
    setImportStatus(null);
  }, [data, columnMappings.length, importStatus?.rowsWithDiscrepancy, resetDataHistory]);

  const getColumnWidth = (index) => {
    const mappedTitle = columnMappings[index]?.title;
    const measured = headerWidths[index];
    if (measured && measured > 0) {
      return measured;
    }
    if (mappedTitle && COLUMN_WIDTH_OVERRIDES[mappedTitle]) {
      return COLUMN_WIDTH_OVERRIDES[mappedTitle];
    }
    return DEFAULT_COLUMN_WIDTH;
  };

  const formatMappingLabel = useCallback((title) => {
    if (title === 'Notas/Cliente/Distribuidora') {
      return 'Notas';
    }
    return title;
  }, []);
  
  const measureHeaderWidths = useCallback(() => {
    const container = spreadsheetWrapperRef.current;
    if (!container) {
      setHeaderWidths([]);
      return;
    }

    requestAnimationFrame(() => {
      const headerRow = container.querySelector('table.Spreadsheet__table tr');
      if (!headerRow) {
        setHeaderWidths([]);
        return;
      }
      const allHeaders = headerRow.querySelectorAll('th.Spreadsheet__header');
      if (!allHeaders.length) {
        setHeaderWidths([]);
        setRowHeaderWidth(0);
        return;
      }
      const [, ...rest] = Array.from(allHeaders);
      const widths = rest.map((cell) => cell.getBoundingClientRect().width);
      setHeaderWidths(widths);
      const rowHeaderCell = allHeaders[0];
      setRowHeaderWidth(rowHeaderCell.getBoundingClientRect().width);
    });
  }, []);

  useEffect(() => {
    measureHeaderWidths();
  }, [measureHeaderWidths, data, columnMappings, step]);

  useEffect(() => {
    const container = spreadsheetWrapperRef.current;
    if (!container || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(measureHeaderWidths);
    observer.observe(container);
    return () => observer.disconnect();
  }, [measureHeaderWidths]);

  const highlightedRowIndices = useMemo(
    () =>
      new Set(
        (importStatus?.rowsWithDiscrepancy ?? []).map((row) => Math.max(row.rowIndex - 1, 0))
      ),
    [importStatus?.rowsWithDiscrepancy]
  );

  useEffect(() => {
    const container = spreadsheetWrapperRef.current;
    if (!container) {
      return;
    }
    const table = container.querySelector('table.Spreadsheet__table');
    if (!table) {
      return;
    }
    table.querySelectorAll('tr[row]').forEach((rowEl) => {
      const rowAttr = rowEl.getAttribute('row');
      if (rowAttr === null) {
        rowEl.classList.remove('spreadsheet-discrepancy-row');
        return;
      }
      const index = Number(rowAttr);
      if (Number.isNaN(index)) {
        return;
      }
      if (highlightedRowIndices.has(index)) {
        rowEl.classList.add('spreadsheet-discrepancy-row');
      } else {
        rowEl.classList.remove('spreadsheet-discrepancy-row');
      }
    });
  }, [highlightedRowIndices, data, columnMappings, step]);

  const handleDataChange = (newData) => {
    if (undoingRef.current) {
      undoingRef.current = false;
      return;
    }

    recordHistory(newData);
    setData(newData);

    const numCols = newData[0]?.length || 0;
    const needsUpdate = numCols !== columnMappings.length;

    if (needsUpdate) {
      const newMappings = Array(numCols).fill({ title: '', type: 'Text' });

      // Preserve existing mappings
      const numToPreserve = Math.min(numCols, columnMappings.length);
      for (let i = 0; i < numToPreserve; i++) {
        newMappings[i] = columnMappings[i];
      }

      setColumnMappings(newMappings);
    }
  };

  const handleImport = async ({ ignoreWarnings = false } = {}) => {
    setImportStatus(null);
    console.log('Starting Transacciones import', {
      accountType,
      rowCount: data.length,
      columnMappings,
    });
    if (!transTable) {
      const message = 'Configura la tabla de Transacciones antes de importar.';
      console.log(message);
      setImportStatus({ type: 'error', message });
      return;
    }

    const requiredConfigKeys = ['transFechaField', 'transDescripcionField', 'transCuentaField'];
    const missingConfig = requiredConfigKeys.filter((key) => !config[key]);
    if (missingConfig.length > 0) {
      const message = `Faltan campos obligatorios en la configuración: ${missingConfig.join(', ')}.`;
      console.log(message);
      setImportStatus({ type: 'error', message });
      return;
    }

    if (!accountType) {
      const message = 'Selecciona primero una cuenta o método de pago.';
      console.log(message);
      setImportStatus({ type: 'error', message });
      return;
    }

    const columnIndexByFieldKey = {};
    columnMappings.forEach((mapping, columnIndex) => {
      const normalizedTitle = normalizeTitle(mapping.title);
      const propertyKey = FIELD_TITLE_TO_PROPERTY_KEY[normalizedTitle];
      if (propertyKey && columnIndexByFieldKey[propertyKey] === undefined) {
        columnIndexByFieldKey[propertyKey] = columnIndex;
      }
    });

    const findAccountRecord = () => {
      if (!cuentasNombreField) {
        return undefined;
      }
      const targetName = accountType.trim().toLowerCase();
      return cuentasRecords.find((record) => {
        const value = record.getCellValueAsString(cuentasNombreField);
        return value?.trim?.().toLowerCase() === targetName;
      });
    };

    const accountRecord = findAccountRecord();
    const accountRecordId = accountRecord?.id;
    if (!accountRecordId) {
      const message = `No se encontró una cuenta llamada "${accountType}" en Cuentas Bancarias.`;
      console.log(message);
      setImportStatus({ type: 'error', message });
      return;
    }

    const getColumnValue = (fieldKey, row) => {
      const columnIndex = columnIndexByFieldKey[fieldKey];
      return columnIndex !== undefined ? row[columnIndex]?.value : undefined;
    };

    const recordsToCreate = [];
    const newRows = [];

    data.forEach((row, rowIndex) => {
      const hasValue = row.some((cell) => {
        const cellValue = cell?.value;
        return cellValue !== undefined && cellValue !== null && `${cellValue}`.trim() !== '';
      });
      if (!hasValue) {
        return;
      }

      const fields = {};
      const descriptionValue = parseTextValue(getColumnValue('transDescripcionField', row));
      const fallbackDescription = accountType
        ? `Transacción ${accountType} fila ${rowIndex + 1}`
        : `Transacción fila ${rowIndex + 1}`;
      const descriptionText = descriptionValue ?? fallbackDescription;

      if (config.transDescripcionField) {
        fields[config.transDescripcionField.id] = descriptionText;
      }

      const primaryFieldId = transTable.primaryField?.id;
      if (primaryFieldId && !fields[primaryFieldId]) {
        fields[primaryFieldId] = descriptionText;
      }

      const fechaValue = parseDateValue(getColumnValue('transFechaField', row));
      if (fechaValue && config.transFechaField) {
        fields[config.transFechaField.id] = fechaValue;
      } else if (getColumnValue('transFechaField', row)) {
        const message = `La fecha de la fila ${rowIndex + 1} no tiene un formato válido.`;
        console.log(message, getColumnValue('transFechaField', row));
        setImportStatus({ type: 'error', message });
        return;
      }

      const cargoValue = parseNumberValue(getColumnValue('transCargoField', row));
      if (cargoValue !== undefined && config.transCargoField) {
        fields[config.transCargoField.id] = cargoValue;
      }

      const abonoValue = parseNumberValue(getColumnValue('transAbonoField', row));
      if (abonoValue !== undefined && config.transAbonoField) {
        fields[config.transAbonoField.id] = abonoValue;
      }

      const saldoValue = parseNumberValue(getColumnValue('transSaldoField', row));
      if (saldoValue !== undefined && config.transSaldoField) {
        fields[config.transSaldoField.id] = saldoValue;
      }

      const noteValue = parseTextValue(getColumnValue('transNotasField', row));
      const noteText = noteValue ?? `${descriptionText} (${accountType})`;
      if (config.transNotasField) {
        fields[config.transNotasField.id] = noteText;
      }

      if (accountRecordId && config.transCuentaField) {
        fields[config.transCuentaField.id] = [{ id: accountRecordId }];
      }

      if (Object.keys(fields).length === 0) {
        return;
      }

      recordsToCreate.push({ fields });
      newRows.push({
        description: descriptionText,
        fecha: fechaValue,
        cargo: cargoValue,
        abono: abonoValue,
        saldo: saldoValue,
        accountId: accountRecordId,
        rowIndex,
      });
    });

    if (recordsToCreate.length === 0) {
      const message = 'No se detectaron filas con información válida.';
      console.log(message);
      setImportStatus({ type: 'error', message });
      return;
    }

    const getLinkedRecordIds = (value) => {
      if (!value) {
        return [];
      }
      if (Array.isArray(value)) {
        return value.map((cell) => (cell?.id ?? cell)).filter(Boolean);
      }
      if (typeof value === 'object') {
        return value?.id ? [value.id] : [];
      }
      if (typeof value === 'string') {
        return [value];
      }
      return [];
    };

    const buildSignature = ({ description, cargo, abono, saldo }) => {
      const descKey = normalizeTitle(description ?? '');
      const cargoKey = cargo !== undefined ? cargo : '';
      const abonoKey = abono !== undefined ? abono : '';
      const saldoKey = saldo !== undefined ? saldo : '';
      return `${descKey}|${cargoKey}|${abonoKey}|${saldoKey}`;
    };

    const existingSignatures = new Set();
    const groupedExistingRecords = new Map();
    if (!transTable) {
      const message =
        'Configura la tabla de Transacciones antes de validar duplicados o discrepancias.';
      console.log(message);
      setImportStatus({ type: 'error', message });
      return;
    }

    const existingRecords = transRecords;
    console.log('Buscando duplicados en Transacciones', {
      tableName: transTable?.name,
      existingCount: existingRecords.length,
      incomingCount: newRows.length,
    });
    for (const record of existingRecords) {
      const accountIds = config.transCuentaField
        ? getLinkedRecordIds(record.getCellValue(config.transCuentaField))
        : [];
      const description = config.transDescripcionField
        ? record.getCellValueAsString(config.transDescripcionField)
        : '';
      const fechaValue = config.transFechaField
        ? parseDateValue(record.getCellValue(config.transFechaField))
        : undefined;
      const cargoValue = config.transCargoField
        ? parseNumberValue(record.getCellValue(config.transCargoField))
        : undefined;
      const abonoValue = config.transAbonoField
        ? parseNumberValue(record.getCellValue(config.transAbonoField))
        : undefined;
      const saldoValue = config.transSaldoField
        ? parseNumberValue(record.getCellValue(config.transSaldoField))
        : undefined;
      accountIds.forEach((accountId) => {
          const signature = buildSignature({ description, cargo: cargoValue, abono: abonoValue, saldo: saldoValue });
          if (signature) {
            existingSignatures.add(signature);
          }
        const existingRow = {
          date: fechaValue,
          saldo: saldoValue,
          autoNumber: config.transAutoNumberField
            ? parseNumberValue(record.getCellValue(config.transAutoNumberField))
            : undefined,
        };
        if (!groupedExistingRecords.has(accountId)) {
          groupedExistingRecords.set(accountId, []);
        }
        groupedExistingRecords.get(accountId).push(existingRow);
      });
    }

    const detectDiscrepancies = () => {
      if (!config.transSaldoField) {
        return { hasDiscrepancy: false, rows: [] };
      }
      const tolerance = 0.01;
      const rowsByAccount = new Map();
      newRows.forEach((row) => {
        if (!row.accountId) {
          return;
        }
        if (!rowsByAccount.has(row.accountId)) {
          rowsByAccount.set(row.accountId, []);
        }
        rowsByAccount.get(row.accountId).push(row);
      });

      const affectedRows = [];
      for (const [accountId, rows] of rowsByAccount.entries()) {
        const existingRows = groupedExistingRecords.get(accountId) ?? [];
        const combinedRows = [
          ...rows.map((row) => ({ ...row, isNew: true })),
          ...existingRows.map((row) => ({ ...row, isNew: false })),
        ];
        combinedRows.sort((a, b) => {
          const aTime = a.date?.getTime?.() ?? 0;
          const bTime = b.date?.getTime?.() ?? 0;
          if (aTime !== bTime) {
            return bTime - aTime;
          }
          if (a.isNew !== b.isNew) {
            return a.isNew ? -1 : 1;
          }
          if (a.isNew && b.isNew) {
            return (a.rowIndex ?? 0) - (b.rowIndex ?? 0);
          }
          const aAuto = a.autoNumber ?? Number.MAX_SAFE_INTEGER;
          const bAuto = b.autoNumber ?? Number.MAX_SAFE_INTEGER;
          if (aAuto !== bAuto) {
            return aAuto - bAuto;
          }
          return 0;
        });

        for (let i = 0; i < combinedRows.length; i++) {
          const row = combinedRows[i];
          if (!row.isNew || row.saldo === undefined) {
            continue;
          }
          const nextRow = combinedRows[i + 1];
          const prevSaldo = nextRow?.saldo;
          if (prevSaldo === undefined) {
            continue;
          }
          const currentSaldo = row.saldo;
          const abono = row.abono;
          const cargo = row.cargo;
          const matchesAbono =
            abono !== undefined && Math.abs(currentSaldo - (prevSaldo + abono)) < tolerance;
          const matchesCargo =
            cargo !== undefined &&
            (Math.abs(currentSaldo - (prevSaldo + cargo)) < tolerance ||
              Math.abs(currentSaldo - (prevSaldo - cargo)) < tolerance);
          if (!matchesAbono && !matchesCargo) {
            affectedRows.push({
              rowIndex: row.rowIndex + 1,
              accountId,
              cargo: row.cargo,
              abono: row.abono,
              saldo: currentSaldo,
              prevSaldo,
            });
          }
        }
      }
      return { hasDiscrepancy: affectedRows.length > 0, rows: affectedRows };
    };

    const duplicateRows = [];
    const seenSignatures = new Set();
    for (const row of newRows) {
      const signature = buildSignature({
        description: row.description,
        cargo: row.cargo,
        abono: row.abono,
        saldo: row.saldo,
      });
      if (!signature) {
        continue;
      }
      if (existingSignatures.has(signature) || seenSignatures.has(signature)) {
        duplicateRows.push({
          rowIndex: row.rowIndex + 1,
          cargo: row.cargo,
          abono: row.abono,
          saldo: row.saldo,
        });
      }
      seenSignatures.add(signature);
    }

    if (duplicateRows.length > 0) {
      console.log('Coincidencias de duplicados encontradas en Transacciones', duplicateRows);
    }

    if (!ignoreWarnings && duplicateRows.length > 0) {
      const message = 'Se detectaron transacciones duplicadas. Revisa los valores o continúa a pesar de la advertencia.';
      console.log('Detected duplicate rows', duplicateRows);
      setImportStatus({
        type: 'warning',
        message,
        warningKind: 'duplicates',
        rowsWithDiscrepancy: duplicateRows,
      });
      return;
    }

    const discrepancyResult = detectDiscrepancies();
    if (!ignoreWarnings && discrepancyResult.hasDiscrepancy) {
      const message =
        'Se detectaron discrepancias entre Cargo/Abono y Saldo. Revisa los saldos antes de importar.';
      setImportStatus({
        type: 'warning',
        message,
        warningKind: 'discrepancies',
        canContinueDespiteWarning: true,
        rowsWithDiscrepancy: discrepancyResult.rows,
      });
      return;
    }

    const permissionResult = transTable.checkPermissionsForCreateRecords(recordsToCreate);
    if (!permissionResult.hasPermission) {
      const message = `Sin permiso para crear registros: ${permissionResult.reasonDisplayString}`;
      console.log(message);
      setImportStatus({ type: 'error', message });
      return;
    }

    const MAX_RECORDS_PER_BATCH = 50;
    const recordBatches = [];
    for (let i = 0; i < recordsToCreate.length; i += MAX_RECORDS_PER_BATCH) {
      recordBatches.push(recordsToCreate.slice(i, i + MAX_RECORDS_PER_BATCH));
    }

    try {
      const createdRecordIds = [];
      for (const batch of recordBatches) {
        const ids = await transTable.createRecordsAsync(batch);
        createdRecordIds.push(...ids);
      }
      const message = `Se importaron ${createdRecordIds.length} transacciones correctamente.`;
      console.log(message, { createdRecordIds });
      setImportStatus({ type: 'success', message });
    } catch (error) {
      const message = 'Ocurrió un error al crear las transacciones.';
      console.error(message, error);
      setImportStatus({ type: 'error', message });
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  const columnTemplate =
    columnMappings.length > 0
      ? columnMappings
          .map((_, index) => {
            const width = getColumnWidth(index);
            const adjusted =
              index < columnMappings.length - 1
                ? Math.max(width - GRID_COLUMN_GAP_PX, 32)
                : width;
            return `${adjusted}px`;
          })
          .join(' ')
      : `repeat(${Math.max(columnMappings.length, 1)}, minmax(${DEFAULT_COLUMN_WIDTH}px, 1fr))`;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Importar Datos</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {step === 1 && (
          <div>
            <h3 className="text-xl mb-4">Paso 1: Selecciona la cuenta o método de pago a importar</h3>
            <div className="flex gap-4 flex-wrap">
              {accountButtons.map((account) => (
                <button
                  key={account.key}
                  onClick={() => handleRecordTypeSelect(account.key)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Cuenta {account.label}
                </button>
              ))}
              <button
                onClick={() => handleRecordTypeSelect('Efectivo')}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Método de Pago: Efectivo
              </button>
            </div>
            {accountButtons.length === 0 && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No se encontraron cuentas configuradas en la tabla de Cuentas Bancarias. Ajusta el campo &quot;Nombre&quot; para que aparezcan botones aquí.
              </p>
            )}
          </div>
        )}

        {step === 2 && (
           <div className="flex-grow flex flex-col overflow-hidden">
             <h3 className="text-xl mb-4">Paso 2: Revisa y edita los datos para importar en &quot;{accountType}&quot;</h3>
            
            <div className="flex-grow overflow-auto mb-4">
                <div
                  className="grid gap-4 mb-4 min-w-full"
                  style={{
                    gridTemplateColumns: columnTemplate,
                    paddingLeft: rowHeaderWidth ? `${rowHeaderWidth}px` : undefined,
                  }}
                >
                  {columnMappings.map((mapping, index) => (
                    <div key={index} className="flex flex-col gap-2 w-full">
                      <select
                        value={mapping.title}
                        onChange={(e) => handleColumnMappingChange(index, 'title', e.target.value)}
                        className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 w-full"
                      >
                        {columnMappings.map((option) => (
                          <option key={`${option.title}-${index}`} value={option.title}>
                            {formatMappingLabel(option.title)}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <div ref={spreadsheetWrapperRef} className="h-full">
                  <Spreadsheet data={data} onChange={handleDataChange} />
                </div>
            </div>

            {importStatus && (
              <div
                className={`rounded-lg border px-4 py-3 mb-4 text-sm ${
                  importStatus.type === 'success'
                    ? 'border-green-400 bg-green-50 text-green-800 dark:bg-green-900/50 dark:border-green-600 dark:text-green-200'
                    : 'border-red-400 bg-red-50 text-red-800 dark:bg-red-900/50 dark:border-red-600 dark:text-red-200'
                }`}
              >
                {importStatus.message}
                {importStatus.rowsWithDiscrepancy?.length > 0 && (
                  <div className="mt-2 text-sm space-y-2 max-h-48 overflow-auto pr-1">
                    {importStatus.rowsWithDiscrepancy.map((row) => (
                      <div
                        key={`${row.accountId}-${row.rowIndex}`}
                        className="flex flex-col gap-0.5 rounded px-2 py-1 text-xs bg-red-100 dark:bg-red-900/60 whitespace-pre-line"
                      >
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-red-600" />
                          <span>Fila {row.rowIndex}</span>
                        </div>
                        <div className="pl-4">
                          Cargo: {formatNumberForMessage(row.cargo)} · Abono: {formatNumberForMessage(row.abono)} ·
                          Saldo: {formatNumberForMessage(row.saldo)} · Saldo previo: {formatNumberForMessage(row.prevSaldo)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {importStatus.warningKind === 'duplicates' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={handleCleanDuplicates}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded"
                    >
                      Limpiar duplicados
                    </button>
                  </div>
                )}
                {importStatus.warningKind !== 'duplicates' && importStatus.canContinueDespiteWarning && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleImport({ ignoreWarnings: true })}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded"
                    >
                      Continuar a pesar de la advertencia
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-4 items-center">
              <button onClick={() => setStep(1)} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Atrás</button>
              <button onClick={handleClearSpreadsheet} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded">Limpiar</button>
              <button onClick={handleUndo} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded">Deshacer (Ctrl+Z)</button>
              <button onClick={handleImport} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Importar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpreadsheetPopup;
