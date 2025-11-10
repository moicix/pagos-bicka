# Airtable Interface Extension Development Context

This document summarizes key concepts and APIs for developing Airtable Interface Extensions, based on the provided API reference.

## Core Concepts & Hooks

Airtable Interface Extensions are built using React and leverage a set of hooks and APIs to interact with the Airtable base, its data, and the user interface.

*   **`initializeBlock`**: The entry point for your React component within an Airtable Block. It takes your top-level React component and renders it.
    ```javascript
    import {initializeBlock} from '@airtable/blocks/interface/ui';
    import React from 'react';

    function App() {
        return <div>Hello world!</div>;
    }

    initializeBlock({interface: () => <App />});
    ```

*   **`useBase`**: A React hook that connects your component to the base's schema. It returns a `Base` instance and re-renders your component whenever the base's schema changes (e.g., tables added/removed, fields renamed). It does *not* re-render on record changes.
    ```javascript
    import {useBase} from '@airtable/blocks/interface/ui';

    function TableList() {
        const base = useBase();
        // ... use base.tables, base.name, etc.
    }
    ```

*   **`useRecords`**: A hook for working with all records (including cell values) in a particular table. It automatically handles loading data and updating your component when records are added, removed, or cell values change.
    ```javascript
    import {useBase, useRecords} from '@airtable/blocks/interface/ui';

    function RecordList() {
        const base = useBase();
        const table = base.tables[0];
        const records = useRecords(table);
        // ... render records
    }
    ```

*   **`useGlobalConfig`**: Returns the extension's `GlobalConfig` and updates whenever any key in `GlobalConfig` changes. This is a key-value store for persisting configuration options across all users of the extension installation.
    ```javascript
    import {useGlobalConfig} from '@airtable/blocks/interface/ui';

    function MyConfigComponent() {
        const globalConfig = useGlobalConfig();
        const mySetting = globalConfig.get('mySetting');
        // ...
    }
    ```

*   **`useSession`**: A hook for connecting a React component to the current user's session. It returns a `Session` instance and re-renders your component when the user's permissions or name changes.
    ```javascript
    import {useSession} from '@airtable/blocks/interface/ui';

    function UserInfo() {
        const session = useSession();
        const userName = session.currentUser?.name;
        // ...
    }
    ```

*   **`useWatchable`**: A low-level React hook for watching data in Airtable models (like `Table` and `Record`). It allows for granular control over when your component re-renders based on specific keys changing. More convenient model-specific hooks (like `useBase`, `useRecords`) are generally preferred.

*   **`expandRecord`**: A function to expand a given record in the Airtable UI.
    ```javascript
    import {expandRecord} from '@airtable/blocks/interface/ui';

    // ... inside a component
    <button onClick={() => expandRecord(myRecord)}>{myRecord.name}</button>
    ```

## Models

Airtable Blocks expose several models to interact with the base's structure and data:

*   **`Base`**: Represents the Airtable base. Provides access to tables, collaborators, and base-level properties.
    *   `activeCollaborators`: Array of `CollaboratorData` for users with access.
    *   `color`: The color of the base (string).
    *   `id`: The ID for this model.
    *   `isDeleted`: Boolean indicating if the model has been deleted.
    *   `name`: The name of the base.
    *   `tables`: Array of `Table` objects in the base.
    *   `workspaceId`: The ID of the workspace.
    *   `getCollaboratorById`, `getCollaboratorByIdIfExists`, `getCollaboratorIfExists`: Methods to retrieve collaborator data.
    *   `getMaxRecordsPerTable`: Returns the maximum number of records allowed per table.
    *   `getTable`, `getTableById`, `getTableByIdIfExists`, `getTableByName`, `getTableByNameIfExists`, `getTableIfExists`: Methods to retrieve table data.

*   **`Field`**: Represents a field in a table.
    *   `config`: Configuration options for the field (`FieldConfig`).
    *   `description`: Description of the field.
    *   `id`: The ID for this model.
    *   `isComputed`: Boolean indicating if the field's value is computed.
    *   `isDeleted`: Boolean indicating if the model has been deleted.
    *   `isPrimaryField`: Boolean indicating if it's the primary field.
    *   `name`: The name of the field.
    *   `options`: Configuration options (`FieldOptions`).
    *   `type`: The `FieldType` of the field.
    *   `convertStringToCellValue`: Attempts to parse a string into a valid cell value.

*   **`GlobalConfig`**: A key-value store for persisting configuration options for an extension installation.
    *   `checkPermissionsForSet`, `checkPermissionsForSetPaths`: Checks user permissions to set global config keys/paths.
    *   `get`: Retrieves a value from global config.
    *   `hasPermissionToSet`, `hasPermissionToSetPaths`: Aliases for permission checks.
    *   `setAsync`, `setPathsAsync`: Asynchronously sets values in global config.

*   **`Record`**: Represents a record in a table.
    *   `createdTime`: Date when the record was created.
    *   `id`: The ID for this model.
    *   `isDeleted`: Boolean indicating if the model has been deleted.
    *   `name`: The primary cell value in this record, formatted as a string.
    *   `fetchForeignRecordsAsync`: Fetches foreign records for a field.
    *   `getCellValue`, `getCellValueAsString`: Retrieves cell values.
    *   `checkPermissionToExpandRecords`, `checkPermissionsForCreateRecord`, `checkPermissionsForCreateRecords`, `checkPermissionsForDeleteRecord`, `checkPermissionsForDeleteRecords`, `checkPermissionsForUpdateRecord`, `checkPermissionsForUpdateRecords`: Methods to check permissions for various record operations.
    *   `createRecordAsync`, `createRecordsAsync`: Asynchronously creates records.
    *   `deleteRecordAsync`, `deleteRecordsAsync`: Asynchronously deletes records.
    *   `updateRecordAsync`, `updateRecordsAsync`: Asynchronously updates records.

*   **`Session`**: Represents the current user's session.
    *   `currentUser`: `CollaboratorData` for the current user, or `null` if in a public share.
    *   `id`: The ID for this model.
    *   `isDeleted`: Boolean indicating if the model has been deleted.

*   **`Table`**: Represents a table in a base.
    *   `description`: Description of the table.
    *   `fields`: Array of `Field` objects in the table.
    *   `id`: The ID for this model.
    *   `isDeleted`: Boolean indicating if the model has been deleted.
    *   `name`: The name of the table.
    *   `primaryField`: The primary field of the table.
    *   `checkPermissionToExpandRecords`, `checkPermissionsForCreateRecord`, `checkPermissionsForCreateRecords`, `checkPermissionsForDeleteRecord`, `checkPermissionsForDeleteRecords`, `checkPermissionsForUpdateRecord`, `checkPermissionsForUpdateRecords`: Methods to check permissions for various table operations.
    *   `getField`, `getFieldById`, `getFieldByIdIfExists`, `getFieldByName`, `getFieldByNameIfExists`, `getFieldIfExists`: Methods to retrieve field data.

## Mutations

Mutations are emitted when the App creates, deletes, or modifies records or global config.

*   **`CreateMultipleRecordsMutation`**: Emitted when one or more records are created.
*   **`DeleteMultipleRecordsMutation`**: Emitted when one or more records are deleted.
*   **`SetMultipleGlobalConfigPathsMutation`**: Emitted when one or more values in `GlobalConfig` are modified.
*   **`SetMultipleRecordsCellValuesMutation`**: Emitted when one or more records' cell values are modified.

## Utilities

*   **`ColorUtils`**: Utilities for working with Airtable color names, including converting to HEX or RGB.
*   **`loadCSSFromString`**: Injects CSS from a string into the page.
*   **`loadCSSFromURLAsync`**: Injects CSS from a remote URL.
*   **`loadScriptFromURLAsync`**: Injects JavaScript from a remote URL.
