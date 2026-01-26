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

La sección financiera aprovecha los estados de cuenta del Excel `Nuevo Banco 2025 2.xlsx` para consolidar un libro de pagos que controla cuentas bancarias, transacciones y efectivo, todo enlazado con las tablas ya vigentes (Marcas, Pedidos, Líneas de Pedido, Clientes, Pagos y los catálogos de Métodos de Pago). El objetivo es conciliar cada cargo/abono, actualizar estatus de pago y generar un dashboard que refleje el saldo real de cada distribuidora.

#### Nuevas tablas del libro de pagos

| Tabla | Propósito | Campos clave |
| --- | --- | --- |
| **Cuentas Bancarias** | Administra cada cuenta física (BBVA, Banorte, HSBC, efectivo) y asigna quién la opera | `Nombre`, `Banco`, `Número de Cuenta`, `Saldo` (fórmula), `Distribuidora Principal`, `Notas`, `Transacciones` (linked record) |
| **Transacciones** | Captura cargos y abonos, relacionándolos con clientes, pedidos y pagos | `Fecha`, `Descripción`, `Cargo`, `Abono`, `Saldo` (fórmula acumulada), `Cuenta Bancaria`, `Cliente`, `Distribuidora`, `Cotejado`, `Tipo`, `Pedido Relacionado`, `Pago Relacionado`, `Notas` |
| **Efectivo** | Lleva el control del efectivo físico y reparte montos entre Mom/Alma | `Forma Pago/Abono`, `Fecha`, `Descripción`, `Monto`, `Tipo`, `Cliente/Proveedor`, `Distribuidora`, `VS`, `Recibió/Pagó`, `Mom Assignment`, `Alma Assignment`, `Notas` |

Los campos siguen la lógica del extracto bancario: por ejemplo, `Saldo` en Transacciones se calcula con algo como `PREVIOUS({Saldo}) - {Cargo} + {Abono}`, mientras que Efectivo valida que `Mom Assignment + Alma Assignment === Monto` antes de cerrar la entrada.

#### Añadidos a las tablas existentes

- **Pagos** recibe `Transacción Relacionada` (link a Transacciones) para vincular los cobros físicos con el ledger bancario.
- **Pedidos** ahora tiene `Saldo Pagado` (rollup sobre `Pagos.Monto`) y `Estatus Pago` (fórmula que clasifica como `Pagado`, `Pago Incompleto` o `Pendiente de Pago` según el total y la marca, replicando la lógica de `brandStatus`).
- **Clientes** usa `Abonos Total` (rollup de `Transacciones.Abono`/`Efectivo.Monto`) y `Deuda Actualizada` (`Deuda Pendiente - Abonos Total`) para reflejar lo que aún debe cada cliente.
- **Marcas** suma `Costos Adicionales por Marca` (número o lookup) para contactos como Belcorp o Price Shoes que exigen cargos extras (envío, guía de devolución, etc.).

#### Relaciones y validaciones

El modelo liga Transacciones con Cuentas Bancarias, Clientes, Pedidos y Pagos; Efectivo también enlaza a Clientes/Pedidos/Pagos. Rollups y lookups mantienen:

- `Pedidos`: rollup de `Transacciones.Abono` y `Pagos.Monto` para calcular pagos acumulados, `Status` que considera marca y tipo de pedido, y un campo `Saldo Restante` que alimenta el dashboard.
- `Clientes`: campos como `Último Pago` y `Deuda Actualizada` que responden en tiempo real cuando se importan abonos.
- `Cuentas Bancarias`: `Saldo Actual` (basado en el `Saldo` más reciente de Transacciones) y un indicador de `Discrepancia` frente al saldo oficial.

Las validaciones verifican fechas (dd/mm/yyyy), montos no negativos y que campos obligatorios (Fecha, Descripción, Cuenta) estén presentes antes de crear registros.

#### Scripts y automatizaciones

1. **Importador**: un script (dentro del bloque o Airtable Scripting) lee `Nuevo Banco 2025 2.xlsx` con SheetJS, agrupa filas por cuenta/fecha y crea Transacciones. Usa heurísticas (regex en la descripción, montos, cliente sugerido) para asignar `Cliente`, `Distribuidora`, `Pedido` y `Tipo`.
2. **Conciliación**: por cada fila cotejada se marca `Cotejado`, se crea o vincula un `Pago` con `Transacción Relacionada`, y se reparten los montos entre Mom y Alma para las entradas de efectivo.
3. **Estatus de pago**: los scripts existentes que actualizan Pedidos se extienden para respetar los nuevos rollups (`Saldo Pagado`, `Deuda Actualizada`) y cambian el `Status` (e.g., `Pagado`, `Pago Incompleto`, `Pendiente de Pago`) en base a reglas de la marca y el tipo de método de pago.
4. **Validaciones de permisos**: antes de editar se revisan `table.hasPermissionToCreateRecords`/`hasPermissionToUpdateRecords`, y se limpian datos (convertir strings a números, formatear fechas) para evitar errores en los imports.

Ejemplo de creación de transacción desde el importador:

```js
const base = useBase();
const transaccionesTable = base.getTableByName('Transacciones');
await transaccionesTable.createRecordAsync({
  Fecha: new Date('2025-09-17'),
  Descripción: 'SPEI ENVIADO SANTANDER / 0062430077',
  Cargo: 507.31,
  Cliente: clientRecord ? [clientRecord.id] : [],
});
```

#### Interfaz y experiencia del importador (`react-spreadsheet`)

El panel principal (`frontend/index.js`) presenta una tarjeta con pestañas para `Cuentas Bancarias`, `Transacciones` y `Efectivo`. Cada vista consume datos reales con `useRecords`, y el botón **Importar Datos** abre `SpreadsheetPopup`, que:

- usa `react-spreadsheet` para mostrar una cuadrícula editable donde el usuario puede pegar filas del Excel o arrastrar el archivo completo.
- permite mapear columnas (Fecha, Cargo, Abono, Cuenta, Cliente, Pedido, Cotejado, Notas) sin duplicados y detecta automáticamente columnas nuevas al “patear” el encabezado.
- carga datos de muestra para cuentas como `BBVA-3056`, `Banorte`, `HSBC` o `Efectivo` (`ACCOUNT_DATA`), mantiene el ancho de columnas con `measureHeaderWidths` y aplica reglas de coloreado (`getCellClassName`) para mostrar discrepancias, gastos sin pedido y abonos sin cliente.
- ofrece acciones rápidas: limpiar, deshacer (Ctrl+Z), auto-detección (`autoDetectAll`) y `Importar y conciliar`, con estados de carga y notificaciones (toasts).

El proceso completo es:

1. Elegir la cuenta/método y pegar el extracto.
2. Mapear columnas y ajustar datos (cliente, pedido, distribuidora, cotejado).
3. Ejecutar `autoDetectAll` para sugerencias inteligentes (clientes, pedidos basados en monto y descripción).
4. Hacer clic en **Importar y conciliar** para escribir Transacciones, vincular Pagos y actualizar rollups.

#### Estado actual del sistema financiero

```
Excel (Estados de cuenta)
    ↓ (Importador react-spreadsheet)
Transacciones + Efectivo
    ↓ (Auto-conciliación)
Pedidos → Estatus: "Pagado"/"Pago Incompleto"/"Pendiente de Pago"
    ↓ (Rollups automáticos)
Clientes → Deuda actualizada y alertas
    ↓
Dashboard financiero en vivo (pestañas y conciliación)
```

Las tres vistas ahora muestran datos reales desde `Cuentas Bancarias`, `Transacciones` y `Efectivo`, y el libro de pagos se puede auditar en tiempo real gracias a las conciliaciones automáticas.


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
