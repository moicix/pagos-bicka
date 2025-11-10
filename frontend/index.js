import Spreadsheet from "react-spreadsheet";
import {initializeBlock} from '@airtable/blocks/interface/ui';
import './style.css';

function SpreadsheetApp() {
    const data = [
        [{ value: "Vanilla" }, { value: "Chocolate" }, { value: "Strawberry" }],
        [{ value: "2" }, { value: "3" }, { value: "5" }],
        [{ value: "4" }, { value: "6" }, { value: "8" }],
    ];
    return (
        <div className="p-4 sm:p-8 min-h-screen relative bg-gray-gray50 dark:bg-gray-gray800">
            <div
                className="rounded-lg p-6 sm:p-12 max-w-lg mx-auto text-center mt-10 sm:mt-20
            bg-white shadow-xl
            dark:bg-gray-gray700 dark:shadow-none"
            >
                <h1
                    className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-display font-bold mb-2 leading-tight
                text-gray-gray700
                dark:text-gray-gray200"
                >
                    My Spreadsheet 📊
                </h1>
                <div className="mt-6">
                    <Spreadsheet data={data} />
                </div>
            </div>
        </div>
    );
}

initializeBlock({interface: () => <SpreadsheetApp />});
