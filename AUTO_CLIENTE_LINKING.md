# Auto-link `Cliente` in Transacciones

Goal: Automatically populate the `Cliente` link field (`fldlumAo7cRtdfLei`) in **Transacciones** (`tblyxblJB7wMDP8wB`) by matching incoming transactions against **Clientes** using bank and account metadata.

## Tables and fields
- **Transacciones** (`tblyxblJB7wMDP8wB`)
  - `Cliente` (`fldlumAo7cRtdfLei`, link to Clientes) — target to auto-populate.
  - `Descripción` (`fldkBRYMbc8eAYiX0`, text), `Cuenta Bancaria` (`fldPEDmYzYxtqBIMO`, link), `Fecha` (`fldKzCstESUAO2nxb`), `Cargo` (`fldIsrIgZRLp5IdUf`), `Abono` (`fldq00ALeLGTYg0O3`), `Notas` (`fldwFwDiflZqlJmaG`), `Tipo` (`fldmefeFzPmBcbjJO`), `Auto Increment` (`fldeO1OFtYh8mfTdK`).
- **Clientes** (`tblVMNZvvy1qBNUHe`)
  - `BANCO` (`fldWsCtcMkE42SKdF`, single select; values: BBVA, BANCO AZTECA, SCOTIABANK, BANORTE, SANTANDER, INBURSA, HSBC, BANAMEX, BANREGIO, NU, BANCOPPEL, OTRO, EFECTIVO, Mercado Pago, SPIN OXXO, BAJIO).
  - `Num Cuenta` (`fldnrDQwmMlAFE4mN`, text; account number as digits/strings).
  - `Nombre` (`fldzTNxuZPEtgNUkG`), `COD Cliente` (`fldNrdCgroltJYbpN`), `Vendedor Asociado` (`fldgsmnN32H8gEkD1`), `Pedidos` (`fldYgad9ZiqMcd0sz`), `Transacciones` (`fldZhA2R7XL1ltoLa`), `Efectivo` (`fld4GWwYCvQCFXsdz`), plus additional metadata noted in `AGENTS.md`.
- **Cuentas Bancarias** (custom property-backed table) — use to derive the bank context of a transaction when available (e.g., bank name or last digits).

## Matching heuristics
1. Build a client index keyed by sanitized bank + account number:
   - Normalize bank: `upper(trim(bankValue))`.
   - Normalize account: keep digits only (`accountDigits`). Skip records without both fields.
   - Index shape: `Map<bank|accountDigits, Array<{clienteId, nombre, codCliente, vendedores}>>`.
2. Extract transaction bank/account clues:
   - From linked `Cuenta Bancaria` record (preferred): bank select + number field (custom properties) cleaned to digits.
   - From `Descripción`: regex for 6–12 digit spans; keep rightmost 4–8 digits as `candidateDigits`.
3. Scoring:
   - Exact bank + exact account match and only one client → confidence 1.0.
   - Bank match + account substring match (last 4–6 digits) → confidence 0.6.
   - Bank match only → confidence 0.3 (suggest only; do not auto-write).
4. Ambiguity handling:
   - If multiple clients share the same bank+account key, surface them as suggestions; do not auto-link.
   - If no match is found, leave `Cliente` empty and log a note for manual review.

## Workflow (importer or background assignment)
1. **Load schema via custom properties**  
   - Resolve tables/fields with `useCustomProperties` + `getFieldIfExists` to avoid hard-coded names. Validate field types with `FieldType` (e.g., ensure `Cliente` field is `FieldType.MULTIPLE_RECORD_LINKS`).
2. **Fetch source data**  
   - Use `useRecords` on **Clientes** to build the bank+account index (watch `BANCO`, `Num Cuenta`, `Nombre`, `COD Cliente` for changes). Skip deleted records.
3. **Prepare transaction context**  
   - For each new or edited **Transacciones** record (during import or after save), read `Descripción`, `Cuenta Bancaria`, and `Tipo`. Normalize numeric fields and trim blanks.
4. **Generate suggestions**  
   - Run the heuristics to produce `{clienteId, confidence, reason}` candidates. Attach them to local UI state and add a human-readable note (e.g., `BANORTE + ****6299 matched COD AC- ALBA RAMIREZ`).
5. **Apply auto-link**  
   - If top candidate has confidence ≥ 0.9 and there is exactly one match:
     - Check permissions: `table.checkPermissionsForUpdateRecord(record, {[clienteFieldId]: [candidateId]})`.
     - If allowed, call `updateRecordAsync(record, {[clienteFieldId]: [candidateId]})`.
     - Append to `Notas` with the match source (`Notas += "\nCliente sugerido por BANCO+Num Cuenta"`), if permissions allow updating notes.
6. **Surface manual resolution**  
   - For confidence < 0.9 or multiple candidates, show a dropdown in the import review modal populated from the suggestion list; let the user confirm and then update the record.
7. **Re-run on edits**  
   - Watch `BANCO`/`Num Cuenta` changes in **Clientes** to recompute the index; re-run matching on unassigned **Transacciones** created in the last N days or with empty `Cliente`.

## Edge cases and safeguards
- Skip auto-linking when `Cuenta Bancaria` is empty, `Tipo` is `Deposito Efectivo`, or `BANCO` is `EFECTIVO` (prompt manual assignment instead).
- Sanitize `Num Cuenta` to digits; ignore values shorter than 4 digits.
- Respect existing links: if `Cliente` already has a value, do not overwrite automatically—only add a suggestion.
- Log ambiguous cases for follow-up (optional: write to a `Notas` suffix or a `GlobalConfig` debug log).
- Keep updates within rate limits and batch via `updateRecordsAsync` where possible after permission checks.

## Pseudocode sketch (Interface SDK)
```js
import {useBase, useRecords, FieldType} from '@airtable/blocks/interface/ui';

const TRANS_TABLE_ID = 'tblyxblJB7wMDP8wB';
const CLIENTE_FIELD_ID = 'fldlumAo7cRtdfLei';
const CLIENTES_TABLE_ID = 'tblVMNZvvy1qBNUHe';
const BANCO_FIELD_ID = 'fldWsCtcMkE42SKdF';
const NUM_CUENTA_FIELD_ID = 'fldnrDQwmMlAFE4mN';

function buildClienteIndex(clientRecords) {
  const index = new Map();
  clientRecords.forEach(record => {
    const banco = (record.getCellValueAsString(BANCO_FIELD_ID) || '').trim().toUpperCase();
    const account = (record.getCellValueAsString(NUM_CUENTA_FIELD_ID) || '').replace(/\\D/g, '');
    if (!banco || account.length < 4) return;
    const key = `${banco}|${account}`;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push({clienteId: record.id, nombre: record.name});
  });
  return index;
}

async function maybeLinkCliente(transRecord, index, {bankGuess, accountGuess}) {
  const table = base.getTableById(TRANS_TABLE_ID);
  const clienteField = table.getFieldIfExists(CLIENTE_FIELD_ID);
  if (!clienteField || clienteField.type !== FieldType.MULTIPLE_RECORD_LINKS) return;
  if ((transRecord.getCellValue(CLIENTE_FIELD_ID) || []).length) return; // respect existing link

  const key = `${bankGuess}|${accountGuess}`;
  const candidates = index.get(key) || [];
  if (candidates.length === 1) {
    const candidateId = candidates[0].clienteId;
    const canUpdate = table.checkPermissionsForUpdateRecord(transRecord, {[CLIENTE_FIELD_ID]: [candidateId]});
    if (canUpdate.hasPermission) {
      await table.updateRecordAsync(transRecord, {[CLIENTE_FIELD_ID]: [candidateId]});
    }
  }
}
```

## UI for fastest assignment (new tab or popup)
- **Entry point**: Add a new tab “Asignar Cliente” (or reuse the importer popup with a second pane) that auto-filters `Transacciones` with empty `Cliente` and shows the highest-confidence suggestion inline.
- **Default action in 1 click**: Preselect the top suggestion in a dropdown and surface a single primary button `Vincular` per row (Enter/Space also confirms). Clicking it writes the link and jumps to the next row.
- **Bulk accept**: At the top, show a “Vincular sugerencias (≥0.9)” button that applies all high-confidence matches in one batch (after permission checks) and shows a toast summary.
- **Keyboard-first**: Arrow keys to move between rows, `Enter` to accept, `Esc` to skip, `/` to focus quick search; keep focus visible for accessibility.
- **Inline triage**: Each row shows `Descripción` (trimmed), parsed bank/account clue, confidence chip, and optional dropdown to override. A `Skip`/`Pendiente` link leaves it unassigned without closing the view.
- **Zero-scroll filters**: Chips for `Solo sin Cliente`, `Solo hoy`, `Cuenta bancaria actual`; keep the list paginated or virtualized to avoid lag.
- **Batch safeguards**: Before applying bulk updates, show a lightweight confirmation listing how many writes will occur and the bank+last4 used for matching.
- **Status feedback**: After each accept, show a compact toast (`Cliente vinculado: AC- ALBA RAMIREZ`) and decrement a counter of remaining unassigned rows.
- **Manual override shortcut**: Typing in the dropdown filters `Clientes` by `Nombre`/`COD Cliente`; selecting immediately triggers `updateRecordAsync` without extra confirmation.
- **Persistence**: Cache user filter/sort choice in `GlobalConfig` so the tab re-opens with the same view, reducing setup clicks.

## Definition of done
- New transactions with clear bank+account matches get `Cliente` auto-filled without user input.
- Ambiguous or missing matches are surfaced for manual selection; no silent overwrites occur.
- Permission checks wrap every write; field/table references come from custom properties or field IDs to survive renames.
- Matching behavior is documented here and can be iterated without altering business logic elsewhere.
