import { useState } from 'react';
import { initializeBlock } from '@airtable/blocks/interface/ui';
import './style.css';
import CuentasBancarias from './CuentasBancarias';
import Transacciones from './Transacciones';
import Efectivo from './Efectivo';
import SpreadsheetPopup from './SpreadsheetPopup';

const TABS = ['Cuentas Bancarias', 'Transacciones', 'Efectivo'];

function Main() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleOpenPopup = () => setIsPopupOpen(true);
  const handleClosePopup = () => setIsPopupOpen(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'Cuentas Bancarias':
        return <CuentasBancarias />;
      case 'Transacciones':
        return <Transacciones />;
      case 'Efectivo':
        return <Efectivo />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-8 min-h-screen relative bg-gray-gray50 dark:bg-gray-gray800 text-gray-gray700 dark:text-gray-gray200">
      <div className="rounded-lg p-6 sm:p-12 w-full bg-white shadow-xl dark:bg-gray-gray700 dark:shadow-none">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-display font-bold leading-tight">
            Control Financiero
            </h1>
            <button
                onClick={handleOpenPopup}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                Importar Datos
            </button>
        </div>
        <div className="flex border-b border-gray-200 dark:border-gray-600">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`py-2 px-4 font-semibold ${activeTab === tab ? 'border-b-2 border-blue-500 text-blue-500' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="mt-8">
          {renderContent()}
        </div>
      </div>
      {isPopupOpen && (
        <SpreadsheetPopup onClose={handleClosePopup} />
      )}
    </div>
  );
}

initializeBlock({ interface: () => <Main /> });