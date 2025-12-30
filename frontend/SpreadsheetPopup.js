import { useState, useCallback, useEffect, useRef } from 'react';
import Spreadsheet from 'react-spreadsheet';

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

const SpreadsheetPopup = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState(null);
  const [data, setData] = useState(cloneGrid(INITIAL_BLANK_ROWS));
  const [columnMappings, setColumnMappings] = useState([]);
  const [headerWidths, setHeaderWidths] = useState([]);
  const [rowHeaderWidth, setRowHeaderWidth] = useState(0);
  const spreadsheetWrapperRef = useRef(null);
  const historyRef = useRef([cloneGrid(INITIAL_BLANK_ROWS)]);
  const historyIndexRef = useRef(0);
  const undoingRef = useRef(false);

  const applyProgrammaticData = useCallback((nextData) => {
    undoingRef.current = true;
    setData(nextData);
    setTimeout(() => {
      undoingRef.current = false;
    }, 0);
  }, []);

  const resetDataHistory = useCallback(
    (columnCount) => {
      const blank = createBlankRows(Math.max(columnCount, 1));
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

  const handleRecordTypeSelect = (type) => {
    const accountData = ACCOUNT_DATA[type];
    const columnCount = accountData?.columns?.length ?? 1;
    setAccountType(type);
    setStep(2);
    setColumnMappings(accountData?.columns ?? []);
    resetDataHistory(columnCount);
  };

  const handleClearSpreadsheet = () => {
    const fallbackColumns =
      ACCOUNT_DATA[accountType]?.columns?.length ?? columnMappings.length ?? 1;
    resetDataHistory(fallbackColumns);
  };

  const handleColumnMappingChange = (index, field, value) => {
    const newMappings = [...columnMappings];
    const oldMapping = newMappings[index];
    newMappings[index] = { ...oldMapping, [field]: value };
    setColumnMappings(newMappings);
  };

  const getAvailableColumns = (currentIndex) => {
    const allColumns = ACCOUNT_DATA[accountType]?.columns ?? [];
    const mappedColumns = columnMappings
      .map((mapping, index) => (index !== currentIndex ? mapping.title : null))
      .filter(Boolean);
    return allColumns.filter(col => !mappedColumns.includes(col.title));
  };

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

  const handleImport = async () => {
    console.log('Importing data...');
    console.log('Data:', data);
    console.log('Column Mappings:', columnMappings);
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
               <button onClick={() => handleRecordTypeSelect('BBVA-3056')} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Cuenta BBVA-3056</button>
               <button onClick={() => handleRecordTypeSelect('BBVA-3273')} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Cuenta BBVA-3273</button>
               <button onClick={() => handleRecordTypeSelect('BANORTE')} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Cuenta BANORTE</button>
               <button onClick={() => handleRecordTypeSelect('HSBC')} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Cuenta HSBC</button>
               <button onClick={() => handleRecordTypeSelect('Efectivo')} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Método de Pago: Efectivo</button>
             </div>
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
                        <option value={mapping.title}>{formatMappingLabel(mapping.title)}</option>
                        {getAvailableColumns(index).map(col => (
                          <option key={col.title} value={col.title}>
                            {formatMappingLabel(col.title)}
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
