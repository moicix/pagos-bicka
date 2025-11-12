# AGENTS.md

## Build/Lint/Test Commands
- **Lint**: `npm run lint` (ESLint on frontend directory)
- **Build**: No build script defined
- **Test**: No test script defined
- **Single test**: No test framework configured

## Code Style Guidelines
- **Imports**: Only from `@airtable/blocks/interface/ui` and `@airtable/blocks/interface/models`
- **Formatting**: ESLint with React recommended rules, JSX runtime, React hooks enabled
- **Types**: Prop types disabled, use TypeScript-style naming conventions
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Error handling**: Check permissions before data operations, use `getFieldIfExists()` not `getField()`
- **Styling**: Tailwind CSS with custom Airtable color palette, support dark mode with `dark:` prefixes

## Cursor Rules
Follow the comprehensive Airtable Interface Extensions development rules in `.cursor/rules/interface-extensions.mdc`:
- Use custom properties instead of hard-coded field/table names
- Check permissions before create/update/delete operations
- Use `FieldType` enum for field type comparisons
- Access tables via custom properties, not hard-coded IDs/names
- Support dark/light mode in UI components
- Use preferred third-party libraries: recharts, @phosphor-icons/react, @dnd-kit/core

## Airtable Interface Extension Development

This section provides a comprehensive reference for developing extensions using the Airtable Interface API (from the "interface-api-reference.pdf" documentation). It covers models for interacting with bases, tables, fields, records, and more; mutations for data changes; React components and hooks for UI building; utilities for colors; and utility functions for loading assets and initializing blocks.

### Introduction

The Airtable Interface API enables building custom extensions (formerly "blocks") for Airtable bases. It provides models for schema and data access, hooks for reactive UI, and functions for UI interactions. Key concepts include watching for changes (via watch/unwatch), permissions checking, and asynchronous mutations for data operations. Extensions run in a sandboxed environment with real-time syncing (except in public shares). GlobalConfig is used for persistent settings.

### Models

#### Base

Model class representing a base.

If you want the base model to automatically recalculate whenever the base schema changes, try the useBase hook.

##### Members

- `activeCollaborators`: `Array<CollaboratorData>` – Users with access to this base.
- `color`: `string` – The color of the base.
- `id`: `string` – The ID for this model.
- `isDeleted`: `boolean` – true if the model has been deleted, and false otherwise.
- `name`: `string` – The name of the base.
- `tables`: `Array<Table>` – The tables in this base. Can be watched to know when tables are created, deleted, or reordered.
- `workspaceId`: `string` – The workspace id of the base.

##### Methods

- `getCollaborator(idOrNameOrEmail: UserId | string): CollaboratorData | null` – The user matching the given ID, name, or email address.
- `getCollaboratorById(collaboratorId: UserId): CollaboratorData` – The user matching the given ID.
- `getCollaboratorByIdIfExists(collaboratorId: UserId): CollaboratorData | null` – The user matching the given ID, or null if not exist.
- `getCollaboratorIfExists(idOrNameOrEmail: UserId | string): CollaboratorData | null` – The user matching the given ID, name, or email address, or null.
- `getMaxRecordsPerTable(): number` – Returns the maximum number of records allowed in each table of this base.
- `getTable(tableIdOrName: TableId | string): Table` – The table matching the given ID or name.
- `getTableById(tableId: string): Table` – The table matching the given ID.
- `getTableByIdIfExists(tableId: string): Table | null` – The table matching the given ID, or null.
- `getTableByName(tableName: string): Table` – The table matching the given name.
- `getTableByNameIfExists(tableName: string): Table | null` – The table matching the given name, or null.
- `getTableIfExists(tableIdOrName: TableId | string): Table | null` – The table matching the given ID or name, or null.
- `toString(): string` – A string representation of the model for debugging.
- `unwatch(keys: WatchableBaseKey | ReadonlyArray<WatchableBaseKey>, callback, context?): Array<WatchableBaseKey>` – Unwatch keys.
- `watch(keys: WatchableBaseKey | ReadonlyArray<WatchableBaseKey>, callback, context?): Array<WatchableBaseKey>` – Get notified of changes.

##### Examples

```js
import {useBase} from '@airtable/blocks/interface/ui';
function MyApp() {
  const base = useBase();
  console.log(base.activeCollaborators[0].email);
}
```

#### Field

Model class representing a field in a table.

##### Members

- `config`: `FieldConfig` – The type and options of the field.
- `description`: `string | null` – The description of the field, if it has one. Can be watched.
- `id`: `string` – The ID for this model.
- `isComputed`: `boolean` – true if this field is computed, false otherwise.
- `isDeleted`: `boolean` – true if the model has been deleted.
- `isPrimaryField`: `boolean` – true if this field is its parent table's primary field.
- `name`: `string` – The name of the field. Can be watched.
- `options`: `FieldOptions | null` – The configuration options of the field.
- `type`: `FieldType` – The type of the field. Can be watched.

##### Methods

- `convertStringToCellValue(string: string): unknown` – Attempt to parse a given string and return a valid cell value.
- `toString(): string` – A string representation for debugging.
- `unwatch(...)` – Unwatch keys.
- `watch(...)` – Get notified of changes.

##### Examples

```js
import {useBase} from '@airtable/blocks/interface/ui';
function App() {
  const base = useBase();
  const table = base.getTableByName('Table 1');
  const field = table.getFieldByName('Name');
  console.log('The type of this field is', field.type);
}
```

#### GlobalConfig

A key-value store for persisting configuration options for an extension installation.

##### Members

- Methods for permissions and setting values.

##### Methods

- `checkPermissionsForSet(...)` – Checks permission to set key.
- `checkPermissionsForSetPaths(...)` – Checks permission to set paths.
- `get(key: GlobalConfigKey): unknown` – Get value at path.
- `hasPermissionToSet(...)` – Alias for permission check.
- `hasPermissionToSetPaths(...)` – Alias for paths permission.
- `setAsync(key: GlobalConfigKey, value?: GlobalConfigValue): Promise<void>` – Sets value asynchronously.
- `setPathsAsync(updates: Array<GlobalConfigUpdate>): Promise<void>` – Sets multiple values.
- `unwatch(...)` – Unwatch.
- `watch(...)` – Watch for changes.

##### Examples

```js
import {useGlobalConfig} from '@airtable/blocks/interface/ui';
function MyApp() {
  const globalConfig = useGlobalConfig();
  const topLevelValue = globalConfig.get('topLevelKey');
}
```

#### Record

Model class representing a record in a table.

##### Members

- `createdTime`: `Date` – The created time of this record.
- `id`: `string` – The ID for this model.
- `isDeleted`: `boolean` – true if deleted.
- `name`: `string` – The primary cell value formatted as string.

##### Methods

- `fetchForeignRecordsAsync(...)` – Fetch foreign records.
- `getCellValue(field: Field | FieldId | string): unknown` – Gets cell value.
- `getCellValueAsString(field: Field | FieldId | string): string` – Gets cell value as string.
- `toString(): string` – Debug string.
- `unwatch(...)` – Unwatch.
- `watch(...)` – Watch.

##### Examples

```js
console.log(`This record was created at ${myRecord.createdTime.toISOString()}`);
```

#### Session

Model class representing the current user's session.

##### Members

- `currentUser`: `CollaboratorData | null` – The current user, or null if in public share.
- `id`: `string` – The ID.
- `isDeleted`: `boolean` – true if deleted.

##### Methods

- `toString(): string` – Debug string.
- `unwatch(...)` – Unwatch.
- `watch(...)` – Watch.

##### Examples

```js
import {useSession} from '@airtable/blocks/interface/ui';
function Username() {
  const session = useSession();
  if (session.currentUser !== null) {
    return <span>The current user's name is {session.currentUser.name}</span>;
  } else {
    return <span>This extension is being viewed in a public share</span>;
  }
}
```

#### Table

Model class representing a table.

##### Members

- `description`: `string | null` – The description, can be watched.
- `fields`: `Array<Field>` – The fields.
- `id`: `string` – The ID.
- `isDeleted`: `boolean` – true if deleted.
- `name`: `string` – The name, can be watched.
- `primaryField`: `Field` – The primary field.

##### Methods

- `checkPermissionToExpandRecords(): PermissionCheckResult` – Checks if records can be expanded.
- `checkPermissionsForCreateRecord(...)` – Checks permission to create record.
- `checkPermissionsForCreateRecords(...)` – Checks for multiple.
- `checkPermissionsForDeleteRecord(...)` – Checks for delete.
- `checkPermissionsForDeleteRecords(...)` – Checks for multiple delete.
- `checkPermissionsForUpdateRecord(...)` – Checks for update.
- `checkPermissionsForUpdateRecords(...)` – Checks for multiple update.
- `createRecordAsync(fields: ObjectMap<FieldId | string, unknown>): Promise<RecordId>` – Creates record.
- `createRecordsAsync(records: ReadonlyArray<{fields: ObjectMap<FieldId | string, unknown>}>): Promise<Array<RecordId>>` – Creates multiple.
- `deleteRecordAsync(recordOrRecordId: Record | RecordId): Promise<void>` – Deletes record.
- `deleteRecordsAsync(recordsOrRecordIds: ReadonlyArray<Record | RecordId>): Promise<void>` – Deletes multiple.
- `getField(fieldIdOrName: FieldId | string): Field` – Gets field.
- `getFieldById(fieldId: FieldId): Field` – Gets by ID.
- `getFieldByIdIfExists(fieldId: FieldId): Field | null` – Gets by ID or null.
- `getFieldByName(fieldName: string): Field` – Gets by name.
- `getFieldByNameIfExists(fieldName: string): Field | null` – Gets by name or null.
- `getFieldIfExists(fieldIdOrName: FieldId | string): Field | null` – Gets or null.
- `hasPermissionToCreateRecord(...)` – Alias for create permission.
- `hasPermissionToCreateRecords(...)` – Alias for multiple.
- `hasPermissionToDeleteRecord(...)` – Alias for delete.
- `hasPermissionToDeleteRecords(...)` – Alias for multiple delete.
- `hasPermissionToExpandRecords(): boolean` – Whether records can be expanded.
- `hasPermissionToUpdateRecord(...)` – Alias for update.
- `hasPermissionToUpdateRecords(...)` – Alias for multiple update.
- `toString(): string` – Debug string.
- `unwatch(...)` – Unwatch.
- `updateRecordAsync(recordOrRecordId: Record | RecordId, fields: ObjectMap<FieldId | string, unknown>): Promise<void>` – Updates record.
- `updateRecordsAsync(records: ReadonlyArray<{fields: ObjectMap<FieldId | string, unknown>, id: RecordId}>): Promise<void>` – Updates multiple.
- `watch(...)` – Watch.

##### Examples

```js
import {useBase} from '@airtable/blocks/interface/ui';
function App() {
  const base = useBase();
  const table = base.getTables()[0];
  if (table) {
    console.log('The name of this table is', table.name);
  }
}
```

#### AbstractModel

Abstract superclass for all models.

##### Members

- `id`: `string` – The ID.
- `isDeleted`: `boolean` – true if deleted.

##### Methods

- `toString(): string` – Debug string.
- `unwatch(...)` – Unwatch.
- `watch(...)` – Watch.

#### Watchable

Abstract superclass for watchable models.

##### Methods

- `unwatch(...)` – Unwatch.
- `watch(...)` – Watch.

### Mutations

#### CreateMultipleRecordsMutation

The Mutation emitted when the App creates one or more Records.

##### Properties

- `records`: `ReadonlyArray<{cellValuesByFieldId: ObjectMap<FieldId, unknown>, id: RecordId}>` – The records being created.
- `tableId`: `TableId` – The identifier for the Table.
- `type`: `"createMultipleRecords"` – Discriminant property.

#### DeleteMultipleRecordsMutation

The Mutation emitted when the App deletes one or more Records.

##### Properties

- `recordIds`: `ReadonlyArray<RecordId>` – The identifiers for records being deleted.
- `tableId`: `TableId` – The identifier for the Table.
- `type`: `"deleteMultipleRecords"` – Discriminant property.

#### SetMultipleGlobalConfigPathsMutation

The Mutation emitted when the App modifies one or more values in the GlobalConfig.

##### Properties

- `type`: `"setMultipleGlobalConfigPaths"` – Discriminant property.
- `updates`: `ReadonlyArray<GlobalConfigUpdate>` – One or more pairs of path and value.

#### SetMultipleRecordsCellValuesMutation

The Mutation emitted when the App modifies one or more Records.

##### Properties

- `records`: `ReadonlyArray<{cellValuesByFieldId: ObjectMap<FieldId, unknown>, id: RecordId}>` – The Records being modified.
- `tableId`: `TableId` – The identifier for the Table.
- `type`: `"setMultipleRecordsCellValues"` – Discriminant property.

### Components

#### CellRenderer

Displays the contents of a cell given a field and record.

##### Props

- `cellClassName`: `undefined | string` – Additional class names for the cell.
- `cellStyle`: `React.CSSProperties` – Additional styles for the cell.
- `cellValue`: `unknown` – The cell value to render.
- `className`: `undefined | string` – Additional class names for the container.
- `field`: `Field` – The Field for the Record.
- `record`: `Record | null | undefined` – The Record from which to render.
- `renderInvalidCellValue`: `undefined | function (cellValue: unknown, field: Field) => ReactElement` – Render function if validation fails.
- `shouldWrap`: `undefined | false | true` – Whether to wrap contents.
- `style`: `React.CSSProperties` – Additional styles for the container.

### Hooks

#### useBase

A hook for connecting to the base schema.

##### Signature

```js
function () => Base
```

##### Examples

```js
import {useBase} from '@airtable/blocks/interface/ui';
function TableList() {
  const base = useBase();
  const tables = base.tables.map(table => {
    return <li key={table.id}>{table.name}</li>;
  });
  return <ul>{tables}</ul>;
}
```

#### useColorScheme

A hook for checking light or dark mode.

##### Signature

```js
function () => {colorScheme: "light" | "dark"}
```

##### Examples

```js
import {useColorScheme} from '@airtable/blocks/interface/ui';
function MyApp() {
  const {colorScheme} = useColorScheme();
  return (
    <div style={colorScheme === 'dark' ? {color: 'white', backgroundColor: 'black'} : {color: 'black', backgroundColor: 'white'}}>
      Tada!
    </div>
  );
}
```

#### useCustomProperties

A hook for integrating configuration settings.

##### Signature

```js
function (getCustomProperties: function (base: Base) => Array<BlockPageElementCustomProperty>) => {customPropertyValueByKey: {[key: string]: unknown}, errorState: {error: Error} | null}
```

##### Examples

```js
import {useCustomProperties} from '@airtable/blocks/interface/ui';
function MyApp() {
  const {customPropertyValueByKey, errorState} = useCustomProperties(getCustomProperties);
}
```

#### useGlobalConfig

Returns the extension's GlobalConfig.

##### Signature

```js
function () => GlobalConfig
```

##### Examples

```js
import {useGlobalConfig} from '@airtable/blocks/interface/ui';
function SyncedCounter() {
  const globalConfig = useGlobalConfig();
  const count = globalConfig.get('count');
}
```

#### useRecords

A hook for working with records in a table.

##### Signature

```js
function (table: Table) => Array<Record>
```

##### Examples

```js
import {useBase, useRecords} from '@airtable/blocks/interface/ui';
function RecordList() {
  const base = useBase();
  const table = base.tables[0];
  const records = useRecords(table);
  return (
    <ul>
      {records.map(record => <li key={record.id}>{record.name}</li>)}
    </ul>
  );
}
```

#### useRunInfo

A hook for getting run context information.

##### Signature

```js
function () => {isDevelopmentMode: boolean, isPageElementInEditMode: boolean}
```

##### Examples

```js
import {useRunInfo} from '@airtable/blocks/interface/ui';
function MyApp() {
  const runInfo = useRunInfo();
  return (
    <div>
      <p>Is development mode: {runInfo.isDevelopmentMode ? 'Yes' : 'No'}</p>
      <p>Is page element in edit mode: {runInfo.isPageElementInEditMode ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

#### useSession

A hook for connecting to the current session.

##### Signature

```js
function () => Session
```

##### Examples

```js
import {useSession} from '@airtable/blocks/interface/ui';
function CurrentUserGreeter() {
  const session = useSession();
  return <React.Fragment>Hello {session.currentUser?.name ?? 'stranger'}!</React.Fragment>;
}
```

#### useSynced

A hook for syncing to GlobalConfig.

##### Signature

```js
function (globalConfigKey: GlobalConfigKey) => [value, setValue, canSetValue]
```

##### Examples

```js
import {useSynced} from '@airtable/blocks/interface/ui';
function CustomInputSynced() {
  const [value, setValue, canSetValue] = useSynced('myGlobalConfigKey');
  return <input type="text" value={value} onChange={e => setValue(e.target.value)} disabled={!canSetValue} />;
}
```

#### useWatchable

A React hook for watching data in models.

##### Signature

```js
function (models: Watchable<Keys> | ReadonlyArray<Watchable<Keys> | null | undefined> | null | undefined, keys: Keys | ReadonlyArray<Keys | null> | null, callback?: function (model: Watchable<Keys>, keys: string, args: ...Array<any>) => unknown) => void
```

##### Examples

```js
import {useWatchable} from '@airtable/blocks/interface/ui';
function TableName({table}) {
  useWatchable(table, 'name');
  return <span>The table name is {table.name}</span>;
}
```

### Utilities

#### Colors

Airtable color names.

##### Properties

- `BLUE`: `"blue"`
- `BLUE_BRIGHT`: `"blueBright"`
- etc. (list all as in text)

#### ColorUtils

Utilities for working with Color names.

##### Methods

- `getHexForColor(colorString: Color): string` – Return hex value.
- `getRgbForColor(colorString: Color): RGB` – Return RGB object.
- `shouldUseLightTextOnColor(colorString: string): boolean` – Whether to use light text.

##### Examples

```js
import {colorUtils, colors} from '@airtable/blocks/interface/ui';
colorUtils.getHexForColor(colors.RED); // => '#ef3061'
```

### Functions

#### expandRecord

Expands the given record in the Airtable UI.

##### Signature

```js
function (record: Record) => void
```

##### Examples

```js
import {expandRecord} from '@airtable/blocks/interface/ui';
<button onClick={() => expandRecord(record)}>{record.name}</button>
```

#### initializeBlock

Takes the top-level React component and renders it.

##### Signature

```js
function (entryPoints: EntryPoints) => void
```

##### Examples

```js
import {initializeBlock} from '@airtable/blocks/interface/ui';
function App() {
  return <div>Hello world 🚀</div>;
}
initializeBlock({interface: () => <App />});
```

#### loadCSSFromString

Injects CSS from a string.

##### Signature

```js
function (css: string) => HTMLStyleElement
```

##### Examples

```js
import {loadCSSFromString} from '@airtable/blocks/interface/ui';
loadCSSFromString('body { background: red; }');
```

#### loadCSSFromURLAsync

Injects CSS from a remote URL.

##### Signature

```js
function (url: string) => Promise<HTMLLinkElement>
```

##### Examples

```js
import {loadCSSFromURLAsync} from '@airtable/blocks/interface/ui';
loadCSSFromURLAsync('https://example.com/style.css');
```

#### loadScriptFromURLAsync

Injects Javascript from a remote URL.

##### Signature

```js
function (url: string) => Promise<HTMLScriptElement>
```

##### Examples

```js
import {loadScriptFromURLAsync} from '@airtable/blocks/interface/ui';
loadScriptFromURLAsync('https://example.com/script.js');
```

### Payment Ledger Implementation

Grokcode, please update the `agents.md` file by appending a new subsection under "**Airtable Interface Extension Development**" titled "**Payment Ledger Implementation**". This subsection should incorporate knowledge from the analyzed Excel file "Nuevo Banco 2025 2.xlsx", which contains bank statements and cash logs for tracking payments, deposits, charges, and abonos (credits) across multiple accounts and distributors. Structure the content in Markdown, describing how to extend the existing Airtable database (based on prior structures like Marcas, Pedidos, Líneas de Pedido, Clientes, Pagos, Métodos de Pago Admin/Clientes) to handle a "libro de pagos" (payment ledger). Focus on new tables, fields, links, validations, and scripts for importing/reconciling data.

Analyze the current database structure from memories: It includes tables for brands (Marcas with validation on Nombre and Método de Pedido), orders (Pedidos with Fecha, Marca, Status, Total Precio Cliente, Costo de Devolución as rollup from Devoluciones, Tipo like "Admin" for non-client purchases, and validation requiring key fields), order lines (Líneas de Pedido with No. de Pedido, Estatus like "Confirmar y Monitorear" or "Solicitado", Costo/Precio Cliente), clients (Clientes with Deuda Pendiente rollup), payments (Pagos linked to Pedidos, with Monto, Método de Pago, Fecha Pago, Abono, Notas, Tipo de Pago for admin/client distinction), and separate methods tables (Métodos de Pago Admin for SPEI/Tarjeta Crédito/Efectivo/Vales/Transferencia, Métodos de Pago Clientes for Efectivo/Deposito OXXO). Scripts handle grouping lines, creating pedidos, updating statuses (e.g., "Pendiente de Pago", "Pago Incompleto", "Pagado" based on brand and payment completeness), input validation for dates/numbers, and using Costo for totals.

Detect possible additions:
- **New Tables**:
  - Cuentas Bancarias: Fields - Nombre (e.g., "BBVA-3056"), Banco (e.g., "BBVA", "Banorte"), Número de Cuenta (e.g., "1557520336"), Saldo Inicial (number), Distribuidora Principal (single select: "Mom", "Alma").
  - Transacciones: Fields - Fecha (date), Descripción (long text), Cargo (number, for debits), Abono (number, for credits), Saldo (formula: previous Saldo - Cargo + Abono), Cuenta Bancaria (link to Cuentas Bancarias), Cliente (link to Clientes), Distribuidora (single select: "Mom", "Alma"), Cotejado (checkbox for reconciliation), Tipo (single select: "SPEI Enviado", "SPEI Recibido", "Pago Cuenta Tercero", "Deposito Efectivo", "OXXO", etc.), Pedido Relacionado (link to Pedidos), Pago Relacionado (link to Pagos), Notas (long text).
  - Efectivo (or integrate into Transacciones with a "Efectivo" account): Fields - Forma Pago/Abono (single select: "Efectivo", "Abono"), Fecha, Descripción, Monto (number), Tipo (e.g., "Abonos"), Cliente/Proveedor (link to Clientes or new Proveedores table), Distribuidora, VS, Recibio/Pago (single select: "Chele", "Alma", etc.), Mom/Alma assignments (numbers for splits).

- **Field Additions to Existing Tables**:
  - Pagos: Add Transacción Relacionada (link to Transacciones), for linking bank/cash entries to payments.
  - Pedidos: Add Saldo Pagado (rollup from Pagos: sum(Monto)), Estatus Pago (formula: IF(Saldo Pagado >= Total Precio Cliente, "Pagado", IF(Saldo Pagado > 0, "Pago Incompleto", "Pendiente de Pago"))), considering brand-specific logic (e.g., from brandStatus constant for Belcorp, Price Shoes, etc.).
  - Clientes: Add Abonos Total (rollup from Transacciones or Efectivo: sum(Abono where linked)), Deuda Actualizada (formula: Deuda Pendiente - Abonos Total).
  - Marcas: Add Costos Adicionales por Marca (number or lookup), to handle varying fees like Costo envio, Guia devolucion.

- **Links and Relationships**:
  - Transacciones links to Cuentas Bancarias (many-to-one), Clientes (many-to-one), Pedidos (many-to-many), Pagos (many-to-many).
  - Efectivo links to Clientes, Pedidos, Pagos.
  - Use lookups/rollups for totals, e.g., in Pedidos: Rollup of Transacciones.Abono for payments received.
  - Validations: Formulas in Transacciones for balance consistency, required fields like Fecha/Descripción; in Pagos for matching Monto to linked Transacciones.

- **Scripts and Automations**:
  - Import script: Use Airtable Scripting to parse Excel, group by account/date, create Transacciones records, link to Clientes/Pedidos based on Descripción matches (e.g., regex for client names like "Kinela", "Better Sem").
  - Reconciliation: Script to update Cotejado, match to Pagos, handle splits (Mom/Alma columns for amount allocation).
  - Status updates: Extend existing scripts to set Estatus based on transaction data, offer payment method selection, handle partial payments.
  - Date/numeric validation: As before, parse dd/mm/yy, ensure non-negative.

- **Examples**:
  ```js
  const base = useBase();
  const transaccionesTable = base.getTable('Transacciones');
  // Create transaction from import
  await transaccionesTable.createRecordAsync({
    'Fecha': new Date('2025-09-17'),
    'Descripción': 'SPEI ENVIADO SANTANDER / 0062430077',
    'Cargo': 507.31,
    'Cliente': [{id: clientRecord.id}] // Link to Clientes
  });
  ```

### UX/UI – Importador de Estados de Cuenta y Conciliación de Pagos (react-spreadsheet)

#### Librería principal
```tsx
import Spreadsheet from "react-spreadsheet";
// Documentación oficial: https://iddan.github.io/react-spreadsheet/docs/
```

#### Experiencia de usuario final (una sola pantalla tipo Google Sheets dentro de Airtable)

> El usuario abre el bloque → arrastra el Excel → en 5 segundos ve una hoja de cálculo 100% editable con:
> - Colores automáticos por error/coincidencia
> - Autocompletado de clientes al escribir
> - Búsqueda de pedidos por monto
> - Fórmulas de saldo en tiempo real
> - Un solo botón: **"Importar y conciliar todo"**

#### Interfaz completa (código listo para usar)

```tsx
<Box className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
  {/* Header */}
  <Box className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-5 shadow-lg">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <div className="flex items-center gap-4">
        <FileSpreadsheet size={36} weight="fill" />
        <div>
          <Heading size="xl">Importador Inteligente de Estados de Cuenta</Heading>
          <Text className="opacity-90">BBVA • Banorte • HSBC • Efectivo • Abonos Miris (2020–2025)</Text>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Badge variant="secondary" size="lg">
          {data.length} transacciones • {errores.length} con alerta
        </Badge>
        <Button variant="secondary" onClick={autoDetectAll}>
          <Wand2 className="mr-2" /> Auto-detectar todo
        </Button>
        <Button 
          size="lg" 
          className="bg-green-500 hover:bg-green-600"
          onClick={importAndReconcile}
          disabled={errores.length > 0 || isImporting}
        >
          {isImporting ? <Loader2 className="mr-2 animate-spin" /> : <CheckCircle weight="fill" className="mr-2" />}
          Importar y conciliar ({data.length})
        </Button>
      </div>
    </div>
  </Box>

  {/* Spreadsheet */}
  <Box className="flex-1 overflow-hidden">
    <Spreadsheet
      data={data}
      onChange={setData}
      columnLabels={[
        "Fecha", "Descripción", "Cargo", "Abono", "Saldo",
        "Cuenta", "Cliente", "Distribuidora", "Pedido", "Cotejado", "Notas"
      ]}
      getCellClassName={getCellClassName}
      DataViewer={CustomDataViewer}
      DataEditor={CustomDataEditor}
    />
  </Box>

  {/* Banner de errores */}
  {errores.length > 0 && (
    <Box className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-4 shadow-2xl z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <AlertTriangle weight="fill" size={28} />
          <div>
            <strong>{errores.length} transacciones requieren atención</strong>
            <span className="ml-4 opacity-90">
              → {errores.filter(e => e.type === 'overpayment').length} abonos extras • 
              {errores.filter(e => e.type === 'underpayment').length} faltantes • 
              {errores.filter(e => e.type === 'unlinked_expense').length} gastos sin pedido
            </span>
          </div>
        </div>
        <Button variant="light" size="sm" onClick={() => scrollToRow(errores[0].row)}>
          Ir al primer error
        </Button>
      </div>
    </Box>
  )}
</Box>
```

#### Reglas de coloreado condicional (getCellClassName)

```ts
const getCellClassName = ({ row, column }) => {
  const t = transacciones[row];
  if (!t) return "";

  // Diferencia de monto
  if (column === 2 || column === 3) {
    const real = column === 3 ? t.abono : t.cargo;
    const expected = t.montoEsperadoPedido;
    if (expected && Math.abs(real - expected) > 0.01) {
      return real > expected 
        ? "bg-yellow-300 border-l-8 border-yellow-600 font-bold" 
        : "bg-red-300 border-l-8 border-red-600 font-bold";
    }
  }

  // Conciliado
  if (t.cotejado) return "bg-green-100 line-through opacity-70";

  // Auto-detectado
  if (t.auto) return "bg-blue-100 border-l-4 border-blue-500";

  // Gasto sin pedido
  if (t.cargo > 0 && !t.pedido) return "bg-orange-100 border-l-4 border-orange-600";

  // Abono sin cliente
  if (t.abono > 0 && !t.cliente) return "bg-purple-100 border-l-4 border-purple-600";

  return "";
};
```

#### Componentes personalizados para celdas

```tsx
const ClienteEditor = ({ value, onCommit }) => {
  const clientes = useRecords(clientesTable);
  const options = clientes.map(c => ({
    label: `${c.getCellValueAsString("Nombre")} ${c.getCellValueAsString("Apellido")}`,
    value: c.id
  }));

  return (
    <Autocomplete
      options={options}
      value={value}
      onValueChange={onCommit}
      placeholder="Escribe nombre..."
      className="w-full"
    />
  );
};

const PedidoPicker = ({ value, onCommit, row }) => {
  const clienteId = transacciones[row]?.clienteId;
  const monto = transacciones[row]?.abono || transacciones[row]?.cargo;

  return (
    <PedidoSearch 
      clienteId={clienteId}
      monto={monto}
      onSelect={(p) => onCommit(p.numero)}
    />
  );
};
```

#### Pasos para implementar esta interfaz (guía paso a paso)

```markdown
### Pasos de implementación (para desarrolladores)

1. **Instalar react-spreadsheet**
   ```bash
   npm install react-spreadsheet
   ```

2. **Parsear Excel con SheetJS**
   ```tsx
   import * as XLSX from 'xlsx';
   const workbook = XLSX.read(file, { type: 'array' });
   const sheet = workbook.Sheets[workbook.SheetNames[0]];
   const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
   ```

3. **Convertir a formato react-spreadsheet**
   ```ts
   const data = rawData.slice(3).map(row => [
     { value: parseDate(row[0]) },
     { value: row[1] },
     { value: parseFloat(row[2]) || 0 },
     { value: parseFloat(row[3]) || 0 },
     { value: 0 }, // Saldo calculado
     { value: detectarCuenta(row[1]) },
     { value: "" }, // Cliente (editable)
     { value: "" }, // Distribuidora
     { value: "" }, // Pedido
     { value: false }, // Cotejado
     { value: "" }
   ]);
   ```

4. **Auto-detección masiva**
   ```ts
   const autoDetectAll = () => {
     const updated = data.map((row, i) => {
       const desc = row[1].value?.toString() || "";
       const monto = row[3].value || row[2].value;

       // Detectar cliente
       const cliente = detectarClientePorDescripcion(desc);
       if (cliente) row[6] = { value: cliente.nombre, recordId: cliente.id, auto: true };

       // Detectar pedido
       const pedido = buscarPedido(monto, cliente?.id, desc);
       if (pedido) {
         row[8] = { value: pedido.numero, recordId: pedido.id };
         if (Math.abs(monto - pedido.total) < 0.01) row[9] = { value: true };
       }

       return row;
     });
     setData(updated);
   };
   ```

5. **Importar y conciliar**
   ```ts
   const importAndReconcile = async () => {
     setIsImporting(true);
     for (const [i, row] of data.entries()) {
       if (row[9].value) { // Cotejado
         const transaccion = await transaccionesTable.createRecordAsync({
           Fecha: row[0].value,
           Descripción: row[1].value,
           Cargo: row[2].value,
           Abono: row[3].value,
           Cliente: row[6].recordId ? [row[6].recordId] : [],
           Pedido: row[8].recordId ? [row[8].recordId] : [],
           Cotejado: true
         });

         if (row[8].recordId) {
           await pagosTable.createRecordAsync({
             Pedido: [row[8].recordId],
             Monto: row[3].value || row[2].value,
             'Transacción Relacionada': [transaccion.id]
           });
         }
       }
     }
     toast.success("Importación completada y conciliada");
   };
   };
   ```

**Commit message:**
```
feat(importador): implementar interfaz completa con react-spreadsheet + auto-detección + conciliación inteligente
```

¡Esta es la versión definitiva! Reemplaza todo el contenido anterior con este bloque exacto.
```

## Current Database Structure

This section will contain the current Airtable base structure (base metadata, tables, and fields) fetched via the Interface API. To populate this section:

1. Run the extension in Airtable.
2. Open the browser console.
3. The structure will be logged in Markdown format.
4. Copy the logged output and replace this placeholder.

**Placeholder - Structure will be logged here when extension runs.**</content>
<parameter name="filePath">/home/moicix/airtable-dev/pagos/AGENTS.md

- Color: yellow bundle.js:63760:15
- Max Records Per Table: 50000 bundle.js:63761:15
- Active Collaborators: bundle.js:63762:15
  - ALMA LETICIA CHAVEZ NAJERA (alma.chavez@acnegocios.mx) bundle.js:63764:17
- Current User: ALMA LETICIA CHAVEZ NAJERA bundle.js:63766:15
<empty string> bundle.js:63767:15
### Tables bundle.js:63768:15
Number of tables: 7 bundle.js:63769:15
- **Pagos** (ID: tbldGbswKlG8RqdLF) bundle.js:63771:17
  - Description: None bundle.js:63772:17
  - Primary Field: ID Pago (singleLineText) bundle.js:63773:17
  - Fields: bundle.js:63774:17
    - ID Pago (singleLineText) - No description bundle.js:63776:19
    - Pedido (multipleRecordLinks) - No description bundle.js:63776:19
    - Fecha Pago (date) - No description bundle.js:63776:19
    - Descripción (singleLineText) - No description bundle.js:63776:19
<empty string> bundle.js:63778:17
- **Líneas de Pedido** (ID: tblXSbASmS2wdyz7a) bundle.js:63771:17
  - Description: None bundle.js:63772:17
  - Primary Field: No. de Pedido (singleLineText) bundle.js:63773:17
  - Fields: bundle.js:63774:17
    - No. de Pedido (singleLineText) - No description bundle.js:63776:19
    - Línea (multipleRecordLinks) - No description bundle.js:63776:19
    - Estatus (singleSelect) - No description bundle.js:63776:19
    - Fecha Pedido (date) - No description bundle.js:63776:19
<empty string> bundle.js:63778:17
- **Pedidos** (ID: tblcTDYAQbjBDoSbi) bundle.js:63771:17
  - Description: None bundle.js:63772:17
  - Primary Field: No. de Pedido (singleLineText) bundle.js:63773:17
  - Fields: bundle.js:63774:17
    - No. de Pedido (singleLineText) - No description bundle.js:63776:19
    - MARCA (rollup) - No description bundle.js:63776:19
    - Fecha Pedido (date) - No description bundle.js:63776:19
    - Costos Adicionales (currency) - No description bundle.js:63776:19
<empty string> bundle.js:63778:17
- **Líneas de Producto** (ID: tbl1LCcwbdHdIJCtr) bundle.js:63771:17
  - Description: None bundle.js:63772:17
  - Primary Field: Nombre (singleLineText) bundle.js:63773:17
  - Fields: bundle.js:63774:17
    - Nombre (singleLineText) - No description bundle.js:63776:19
    - Multiplicador Precio Cliente (number) - No description bundle.js:63776:19
    - Pedidos (multipleRecordLinks) - No description bundle.js:63776:19
    - Copia de Líneas de Pedido (singleLineText) - No description bundle.js:63776:19
<empty string> bundle.js:63778:17
- **Vendedores** (ID: tblRQBl0pPYxKPrwY) bundle.js:63771:17
  - Description: None bundle.js:63772:17
  - Primary Field: Nombre (multilineText) bundle.js:63773:17
  - Fields: bundle.js:63774:17
    - Nombre (multilineText) - No description bundle.js:63776:19
    - Apellido (multilineText) - No description bundle.js:63776:19
    - Celular (multilineText) - No description bundle.js:63776:19
    - Correo Electrónico (multilineText) - No description bundle.js:63776:19
<empty string> bundle.js:63778:17
- **Clientes** (ID: tblVMNZvvy1qBNUHe) bundle.js:63771:17
  - Description: None bundle.js:63772:17
  - Primary Field: Nombre (multilineText) bundle.js:63773:17
  - Fields: bundle.js:63774:17
    - Nombre (multilineText) - No description bundle.js:63776:19
    - Apellido (multilineText) - No description bundle.js:63776:19
    - Vendedor Asociado (multipleRecordLinks) - No description bundle.js:63776:19
    - Celular (multilineText) - No description bundle.js:63776:19
<empty string> bundle.js:63778:17
- **Métodos de Pago Admin** (ID: tbljn87Dr7MUZWvlu) bundle.js:63771:17
  - Description: None bundle.js:63772:17
  - Primary Field: ID Método (formula) bundle.js:63773:17
  - Fields: bundle.js:63774:17
    - ID Método (formula) - No description bundle.js:63776:19
    - ID No (autoNumber) - No description bundle.js:63776:19
    - Método de Pago (singleLineText) - No description bundle.js:63776:19
    - Descripción (singleLineText) - No description bundle.js:63776:19
<empty string>