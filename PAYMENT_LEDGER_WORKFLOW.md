# Airtable Interface State

## Base schema and business logic
The extension targets a finance-focused base that already manages brands, orders, clients, payments, and payment methods. Key tables and fields described in `AGENTS.md` include:

- **Marcas**: Validations ensure every record has a `Nombre` and a `Método de Pedido`. Brand-specific constants drive downstream logic such as payment status rules (e.g., Belcorp vs. Price Shoes).
- **Pedidos**: The primary order table stores `No. de Pedido`, `Marca`, `Fecha Pedido`, `Status`, `Total Precio Cliente`, and a `Costo de Devolución` rollup from `Devoluciones`. `Tipo` distinguishes admin purchases. Existing scripts populate `Pagos`, calculate totals, and update statuses (Pendiente de Pago, Pago Incompleto, Pagado) based on brand-specific rules and the completeness of linked payments.
- **Líneas de Pedido**: Records remain grouped by `No. de Pedido` with `Estatus` values like “Confirmar y Monitorear” or “Solicitado”, plus client-facing `Costo`/`Precio Cliente` figures. There are helpers to bundle lines into orders and validate numeric/date inputs before creating records.
- **Clientes**: The client table keeps contact metadata plus a `Deuda Pendiente` rollup sourced from linked orders.
- **Pagos**: Each payment links to `Pedidos` and records `Monto`, `Método de Pago`, `Fecha Pago`, `Abono`, `Notas`, and a `Tipo de Pago` flag (Admin vs. Cliente). Automations ensure sums roll up into orders and clients, driving status transitions.
- **Métodos de Pago Admin** / **Métodos de Pago Clientes**: Separate catalogs for SPEI/Tarjeta/Efectivo/Vales/Transferencia (admin) and Efectivo/Depósito OXXO (clients) keep allowed payment instruments explicit.
- **Supporting tables**: `Líneas de Producto`, `Vendedores`, and additional catalog tables feed pricing multipliers, vendor contacts, and tracking metadata mentioned in the workspace schema dump inside `AGENTS.md`.

Scripts (also described in `AGENTS.md`) handle:

- Grouping and merging `Líneas de Pedido` into `Pedidos`.
- Creating orders and payments from validated inputs.
- Ensuring `Pedidos` statuses reflect payment completeness, brand rules, and cumulative costs.
- Validating that dates/money inputs follow the dd/mm/yy format and are non-negative before writing to Airtable.

## Front-end extension experience
The React-based UI sits in the `frontend` directory and exposes three main tabs plus an importer modal.

- **Tabs** (`frontend/index.js`): Users switch between `Cuentas Bancarias`, `Transacciones`, and `Efectivo`. Each tab currently renders stubbed data tables, but layouts preview the intended fields and dark/light styling. For example, `CuentasBancarias.js` shows `Nombre`, `Banco`, `Número de Cuenta`, `Saldo Inicial`, and `Distribuidora Principal`, while `Transacciones.js` and `Efectivo.js` show the fields listed in the payment ledger design.
- **Spreadsheet popup** (`frontend/SpreadsheetPopup.js`): Clicking “Importar Datos” opens a modal powered by `react-spreadsheet`. The popup:
  - Lets the user choose an account or method (BBVA-3056, BBVA-3273, Banorte, HSBC, Efectivo) to load canned sample rows from `ACCOUNT_DATA`.
  - Dynamically maps spreadsheet columns to the ledger schema (`Fecha`, `Descripción`, `Cargo`, `Abono`, `Saldo`, etc.) with dropdowns that prevent duplicate column selections.
  - Uses `Spreadsheet` to show a live grid and adjust column mappings when the import data shape changes.
  - Currently keeps the data only in component state and logs the selection on import, but it is wired to use `useBase` (preparing for future writes against real tables).

## Data flow & tooling
- The importer is designed to eventually parse Excel files (e.g., `Nuevo Banco 2025 2.xlsx`) via `xlsx`, normalize dates/numbers, and reconcile records with clients/pedidos/pagos.
- The extension relies on Airtable’s Interface hooks (`useBase`) plus `react-spreadsheet` and `@phosphor-icons/react` to render the import UI, with Tailwind plus custom colors (`style.css`) for theming.
- Build-time tooling is minimal: `npm run lint` runs ESLint against the `frontend` directory with the provided React/Tailwind configuration. No build or test scripts are defined.
- Dependencies include `@airtable/blocks`, React 19, `react-spreadsheet`, and `xlsx`, while dev dependencies cover the Blocks CLI, ESLint, and Tailwind/PostCSS toolchain (`package.json`).

## Notes & next steps
- The UI currently only renders sample data; the next step is to pipe the importer output into Airtable tables (creating `Transacciones`, linking to `Clientes/Pedidos/Pagos`, etc.) and to respect the validations/rollups described in `AGENTS.md`.
- The stored AGENTS instructions also call for appending a “Payment Ledger Implementation” subsection; this summary documents the current state so that future updates can reference it when extending `AGENTS.md` or the schema.

## Workflow for full Airtable integration
This workflow turns pasted Excel/export data into records, keeps balances aligned, and lets the user confirm client assignments per transaction.

1. **Paste/export raw rows into the spreadsheet view.**  
   - The copy/paste format is the same as the bank statement snippet (columns: `FECHA`, `DESCRIPCIÓN`, `CARGO`, `ABONO`, `SALDO`, plus the raw `Notas/Cliente/Distribuidora` column).
   - The importer grid accepts pasted data directly into the `react-spreadsheet` table, so the user can drop in blocks of transactions without selecting files.
   - As data enters the grid, the per-column dropdowns recompute to keep mapping to `[Fecha, Descripción, Cargo, Abono, Saldo, Cuenta, Cliente, Distribuidora, Pedido, Cotejado, Notas]`.
   - Date parsing uses the same `dd/mm/yyyy` logic as the base scripts; numbers treat blank values as `0` and trim non-digit characters to avoid commas or currency symbols.

2. **Normalize and link rows to Airtable entities.**  
   - When the user clicks **Importar**, the component now:
     - Uses the column mapping to create a normalized array of `{fecha, descripcion, cargo, abono, saldo, cuenta, clienteTexto, distribuidora, pedido, cotejado, notas}`.
     - Detects the bank account by matching `cuenta` (e.g., `"BBVA-3056"`) to Airtable’s `Cuentas Bancarias` table via `useBase()` + `table.getFieldIfExists` (case-insensitive).
     - Looks up clients by scanning `clienteTexto` or `Descripción` for known client names (e.g., "Miriam Claudia Franco") using the `Clientes` table. Matching records are stored so each row can later open the client-assignment modal.
     - Parses `Cargo`/`Abono` to determine whether the row is a debit or credit and prepares it for insert with the `Transacciones` table.
     - Validates that `Fecha` and `Saldo` are present; rows that fail validation are highlighted in the spreadsheet, and the import button stays disabled until corrected.

3. **Create Airtable records with relational updates.**  
   - The importer script calls Airtable Scripting (eventually from the popup) that:
     - Creates a `Transacciones` record for each valid row, linking to the detected `Cuenta Bancaria`, optional `Clientes` record, flagged `Pedido` (if the user mapped one), and marking `Cotejado` if the row tallies with a payment.
     - Updates the `Pagos` table for credit entries that match payments (creating new payment records when necessary and linking `Transacción Relacionada`).
     - Updates rollups: `Pedidos.Saldo Pagado`, `Clientes.Abonos Total`, and `Clientes.Deuda Actualizada` automatically reflect the imported amounts.
     - Recalculates the `Saldo` formula per bank (rolling previous balance minus debits plus credits) and updates `Cuentas Bancarias.Saldo Actual` when a new transaction is added.

4. **Detect and explain balance discrepancies.**  
   - The main tab now shows a **reconciliation row** beneath each account table:
     - Computes `Saldo esperado` (from the last imported `Transacciones.Saldo`) vs `Saldo en Cuentas Bancarias` (current field).
     - If there is a difference, the row surfaces the gap and the latest unmatched transaction date so the user can investigate.
     - Automation marks the discrepancy in orange and adds a tooltip describing whether the mismatch comes from missing transactions or rounding.

5. **Client assignment window.**  
   - Each imported `Transacciones` row can open a modal (or slide-over) where the user:
     - Sees the parsed `Descripción`, `Cargo`/`Abono`, and the suggested `Cliente`/`Pedido`.
     - Picks or confirms clients from a searchable dropdown powered by `useRecords` on the `Clientes` table.
     - Optionally links the row to one or more `Pedidos` or existing `Pagos` and flags `Cotejado` once verified.
     - Adds notes or sets the `Distribuidora` single-select (Mom/Alma/Ambas) for revenue sharing.
     - Saves the assignment, which updates the `Transacciones` record and also adjusts the `Pedidos.Estatus Pago` formula to reflect the new payment link.

6. **Finalize reconciliation.**  
   - Once all rows are assigned, the user hits **Conciliar**:
     - The script rechecks every `Transacciones` record’s `Saldo`: for the current account, the newest `Saldo` value must equal the account's `Saldo Actual`; otherwise, it flags the record for review.
     - `Clientes` dashboards update with the latest `Deuda Actualizada` and show if any `Pedidos` still need payments (Status `Pago Incompleto` or `Pendiente de Pago`).
     - The importer logs the operation (e.g., `Importación completada el 2025-11-12: 125 filas`) which can be reviewed in a future `Logs` table or `GlobalConfig`.
