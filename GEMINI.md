# Project Overview

This is an [Airtable Block](https://airtable.com/developers/blocks) project. It's built using [React](https://reactjs.org/) and styled with [Tailwind CSS](https://tailwindcss.com/). The main entry point for the application is `frontend/index.js`.

The block currently displays a "Hello world" message.

# Building and Running

There are no explicit build or run commands in `package.json`. Airtable Blocks are typically run within the Airtable UI.

To check for code quality, run the linter:

```bash
npm run lint
```

# Development Conventions

*   **Linting:** The project uses ESLint for linting JavaScript files. The configuration can be found in `eslint.config.mjs`.
*   **Styling:** The project uses Tailwind CSS. The configuration is in `tailwind.config.js` and the main stylesheet is `frontend/style.css`.
*   **Dependencies:** Project dependencies are managed with `npm`.
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

# Data Schema

- **Pedidos** (ID: tblcTDYAQbjBDoSbi)
  - Description: None
  - Primary Field: No. de Pedido (singleLineText)
  - Fields:
    - No. de Pedido (singleLineText) - No description
    - MARCA (rollup) - No description
    - Fecha Pedido (date) - No description
    - Costos Adicionales (currency) - No description

- **Líneas de Producto** (ID: tbl1LCcwbdHdIJCtr)
  - Description: None
  - Primary Field: Nombre (singleLineText)
  - Fields:
    - Nombre (singleLineText) - No description
    - Multiplicador Precio Cliente (number) - No description
    - Pedidos (multipleRecordLinks) - No description
    - Copia de Líneas de Pedido (singleLineText) - No description

- **Vendedores** (ID: tblRQBl0pPYxKPrwY)
  - Description: None
  - Primary Field: Nombre (multilineText)
  - Fields:
    - Nombre (multilineText) - No description
    - Apellido (multilineText) - No description
    - Celular (multilineText) - No description
    - Correo Electrónico (multilineText) - No description

- **Clientes** (ID: tblVMNZvvy1qBNUHe)
  - Description: None
  - Primary Field: Nombre (multilineText)
  - Fields:
    - Nombre (multilineText) - No description
    - Apellido (multilineText) - No description
    - Vendedor Asociado (multipleRecordLinks) - No description
    - Celular (multilineText) - No description

- **Métodos de Pago Admin** (ID: tbljn87Dr7MUZWvlu)
  - Description: None
  - Primary Field: ID Método (formula)
  - Fields:
    - ID Método (formula) - No description
    - ID No (autoNumber) - No description
    - Método de Pago (singleLineText) - No description
    - Descripción (singleLineText) - No description
