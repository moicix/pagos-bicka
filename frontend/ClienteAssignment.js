import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  useBase,
  useRecords,
  useGlobalConfig,
} from '@airtable/blocks/interface/ui';
import { FieldType } from '@airtable/blocks/interface/models';
import ConfigurationNotice from './ConfigurationNotice';

const REQUIRED_FIELDS = [
  { key: 'transClienteField', label: 'Cliente (Transacciones)' },
  { key: 'transCuentaField', label: 'Cuenta Bancaria (Transacciones)' },
  { key: 'clientesBancoField', label: 'BANCO (Clientes)' },
  { key: 'clientesNumCuentaField', label: 'Num Cuenta (Clientes)' },
];

const DEFAULT_FILTERS = {
  showOnlyMissing: true,
  onlyToday: false,
  selectedAccountId: '',
  activeAccountId: '',
  searchTerm: '',
  bankFilter: '',
  clientFilterId: '',
};

const CLIENTE_INITIAL_VISIBLE = 100;
const CLIENTE_VISIBLE_INCREMENT = 100;

const normalizeBank = (value) => {
  const raw = `${value || ''}`.trim();
  return raw ? raw.toUpperCase() : '';
};

const normalizeAccount = (value) => `${value || ''}`.replace(/[^0-9]/g, '');

const parseDigitsFromText = (text) => {
  if (!text) {
    return '';
  }
  const matches = text.match(/\d{4,12}/g);
  if (!matches?.length) {
    return '';
  }
  return matches[matches.length - 1];
};

const formatAccountMasked = (value) => {
  if (!value) {
    return '';
  }
  if (value.length <= 4) {
    return value;
  }
  return `****${value.slice(-4)}`;
};

const toNumericValue = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  const stringValue = `${value}`.trim();
  if (stringValue === '') {
    return undefined;
  }
  const sanitized = stringValue.replace(/[^0-9.-]+/g, '');
  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const BANK_KEYWORDS = [
  'BBVA',
  'BANCO AZTECA',
  'BANCOMER',
  'SCOTIABANK',
  'BANORTE',
  'SANTANDER',
  'INBURSA',
  'HSBC',
  'BANAMEX',
  'BANREGIO',
  'NU',
  'BANCOPPEL',
  'OTRO',
  'EFECTIVO',
  'MERCADO PAGO',
  'SPIN OXXO',
  'BAJIO',
  'BANJERCITO',
  'CI BANCO',
];

const BANK_CODE_MAP = {
  '002': 'BANAMEX',
  '012': 'BBVA',
  '014': 'SANTANDER',
  '021': 'HSBC',
  '044': 'SCOTIABANK',
  '072': 'BANORTE',
  '127': 'BANCO AZTECA',
  '137': 'BANCOPPEL',
  '846': 'STP',
};

const BANK_ALIASES = {
  BANCOMER: 'BBVA',
  BBVABANCOMER: 'BBVA',
  BBVA: 'BBVA',
  BANAMEX: 'BANAMEX',
  CITIBANAMEX: 'BANAMEX',
  STP: 'STP',
  BNET: 'BANORTE',
};

const BANK_SEPARATORS = /[\s/\\]+/;

const extractBankFromDescription = (
  description,
  { extraBankNames = [], accountEntries = [] } = {}
) => {
  if (!description) {
    return '';
  }
  const normalizedDescription = `${description}`.toUpperCase();
  const collapsed = normalizedDescription.replace(/[^A-Z0-9]/g, '');
  const normalizedExtras = extraBankNames
    .map((value) => normalizeBank(value))
    .filter(Boolean);
  const candidateBanks = Array.from(
    new Set([...BANK_KEYWORDS, ...normalizedExtras])
  );
  for (const bank of candidateBanks) {
    if (!bank) {
      continue;
    }
    const compactBank = bank.replace(/\s+/g, '');
    const pattern = new RegExp(`\\b${bank.replace(/\s+/g, '\\\\s+')}\\b`, 'i');
    if (pattern.test(normalizedDescription) || collapsed.includes(compactBank)) {
      return bank;
    }
  }
  const tokens = normalizedDescription.split(BANK_SEPARATORS);
  for (const token of tokens) {
    if (BANK_KEYWORDS.includes(token)) {
      return token;
    }
  }
  for (const [alias, canonical] of Object.entries(BANK_ALIASES)) {
    const compactAlias = alias.replace(/\s+/g, '');
    if (collapsed.includes(compactAlias)) {
      return canonical;
    }
  }
  const clabePattern = new RegExp(`\\b(${Object.keys(BANK_CODE_MAP).join('|')})\\b`);
  const clabeMatch = normalizedDescription.match(clabePattern);
  if (clabeMatch && BANK_CODE_MAP[clabeMatch[1]]) {
    return BANK_CODE_MAP[clabeMatch[1]];
  }
  if (accountEntries.length > 0) {
    const digits = parseDigitsFromText(description);
    if (digits) {
      const match = accountEntries.find((entry) =>
        entry.account.endsWith(digits)
      );
      if (match?.bank) {
        return match.bank;
      }
    }
  }
  return '';
};

const isSameDay = (value) => {
  if (!value) {
    return false;
  }
  const dateValue = value instanceof Date ? value : new Date(value);
  const now = new Date();
  return (
    dateValue.getUTCFullYear() === now.getUTCFullYear() &&
    dateValue.getUTCMonth() === now.getUTCMonth() &&
    dateValue.getUTCDate() === now.getUTCDate()
  );
};

const getConfidenceClasses = (confidence) => {
  if (confidence >= 0.9) {
    return 'bg-emerald-100 text-emerald-700';
  }
  if (confidence >= 0.6) {
    return 'bg-amber-100 text-amber-800';
  }
  return 'bg-slate-100 text-slate-700';
};

const createClientsIndex = (clientRecords, props) => {
  const exactMap = new Map();
  const bankMap = new Map();
  const allClients = [];

  clientRecords.forEach((record) => {
    const bancoValue = props.clientesBancoField
      ? record.getCellValueAsString(props.clientesBancoField)
      : '';
    const cuentaValue = props.clientesNumCuentaField
      ? record.getCellValueAsString(props.clientesNumCuentaField)
      : '';
    const normalizedBanco = normalizeBank(bancoValue);
    const normalizedAccount = normalizeAccount(cuentaValue);
    if (!normalizedBanco) {
      return;
    }
    const clienteName = props.clientesNombreField
      ? record.getCellValueAsString(props.clientesNombreField) || record.name
      : record.name;
    const codCliente = props.clientesCodField
      ? record.getCellValueAsString(props.clientesCodField) || ''
      : '';
    const displayLabel = codCliente ? `${clienteName} · ${codCliente}` : clienteName;
    const entry = {
      clienteId: record.id,
      clienteName,
      codCliente,
      banco: normalizedBanco,
      account: normalizedAccount,
      rawBanco: bancoValue,
      rawAccount: cuentaValue,
      displayLabel,
      searchText: displayLabel.toLowerCase(),
    };
    allClients.push(entry);
    const bankBucket = bankMap.get(normalizedBanco) ?? [];
    bankBucket.push(entry);
    bankMap.set(normalizedBanco, bankBucket);
    if (normalizedAccount.length >= 4) {
      const key = `${normalizedBanco}|${normalizedAccount}`;
      const bucket = exactMap.get(key) ?? [];
      bucket.push(entry);
      exactMap.set(key, bucket);
    }
  });

  return {
    exactMap,
    bankMap,
    allClients,
  };
};

const ClienteAssignment = ({ customPropertyValueByKey, errorState }) => {
  const base = useBase();
  const globalConfig = useGlobalConfig();
  const props = customPropertyValueByKey ?? {};
  const transTable = props.transaccionesTable;
  const fallbackTable = base.tables[0];
  const transRecords = useRecords(transTable ?? fallbackTable);
  const clientesTable = props.clientesTable ?? fallbackTable;
  const clientesRecords = useRecords(clientesTable);
  const cuentasTable = props.cuentasTable ?? fallbackTable;
  const cuentasRecords = useRecords(cuentasTable);

  const missingFields = REQUIRED_FIELDS.filter((field) => !props[field.key]);
  const needsConfig = !transTable || !clientesTable || missingFields.length > 0;

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [skippedRecordIds, setSkippedRecordIds] = useState(() => new Set());
  const [selectionByRecord, setSelectionByRecord] = useState({});
  const [manualQueries, setManualQueries] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const [loadingRecordId, setLoadingRecordId] = useState(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [visibleRowLimit, setVisibleRowLimit] = useState(CLIENTE_INITIAL_VISIBLE);

  useEffect(() => {
    if (filtersLoaded || !globalConfig) {
      return;
    }
    const persisted = globalConfig.get('clienteAssignmentFilters');
    if (persisted) {
      setFilters((prev) => ({ ...prev, ...persisted }));
    }
    setFiltersLoaded(true);
  }, [globalConfig, filtersLoaded]);

  const canPersistFilters = Boolean(
    globalConfig?.hasPermissionToSet('clienteAssignmentFilters')
  );
  useEffect(() => {
    if (!canPersistFilters || !globalConfig) {
      return;
    }
    globalConfig.setAsync('clienteAssignmentFilters', filters).catch(() => {});
  }, [filters, globalConfig, canPersistFilters]);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setStatusMessage('');
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    setVisibleRowLimit(CLIENTE_INITIAL_VISIBLE);
  }, [filters]);

  const autoNumberField =
    props.transAutoNumberField ??
    transTable.fields.find((field) => field.config?.type === FieldType.AUTO_NUMBER);
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
      }),
    []
  );

  const formatAccountLabel = useCallback(
    (accountRecord) => {
      if (!accountRecord) {
        return 'Cuenta sin asignar';
      }
      if (props.cuentasNombreField) {
        const label = accountRecord.getCellValueAsString(props.cuentasNombreField);
        if (label) {
          return label;
        }
      }
      return accountRecord.name;
    },
    [props.cuentasNombreField]
  );

  const cuentasById = useMemo(() => {
    if (needsConfig) {
      return new Map();
    }
    const map = new Map();
    cuentasRecords.forEach((record) => map.set(record.id, record));
    return map;
  }, [cuentasRecords, needsConfig]);

  const clientsIndex = useMemo(() => {
    if (needsConfig) {
      return {
        exactMap: new Map(),
        bankMap: new Map(),
        allClients: [],
      };
    }
    return createClientsIndex(clientesRecords, {
      clientesBancoField: props.clientesBancoField,
      clientesNumCuentaField: props.clientesNumCuentaField,
      clientesNombreField: props.clientesNombreField,
      clientesCodField: props.clientesCodField,
    });
  }, [
    clientesRecords,
    props.clientesBancoField,
    props.clientesNumCuentaField,
    props.clientesNombreField,
    props.clientesCodField,
    needsConfig,
  ]);

  const bankFilterOptions = useMemo(() => {
    if (needsConfig) {
      return [];
    }
    const seen = new Map();
    cuentasRecords.forEach((accountRecord) => {
      const rawBankName = props.cuentasBancoField
        ? accountRecord.getCellValueAsString(props.cuentasBancoField)
        : '';
      const normalizedBank = normalizeBank(rawBankName);
      if (!normalizedBank) {
        return;
      }
      if (!seen.has(normalizedBank)) {
        seen.set(normalizedBank, rawBankName || normalizedBank);
      }
    });
    clientsIndex.bankMap.forEach((entries, normalizedBank) => {
      if (!normalizedBank || seen.has(normalizedBank) || !entries.length) {
        return;
      }
      seen.set(normalizedBank, entries[0].banco);
    });
    if (props.transBancoField) {
      transRecords.forEach((record) => {
        const rawBankValue = record.getCellValueAsString(props.transBancoField) ?? '';
        const normalizedBank = normalizeBank(rawBankValue);
        if (normalizedBank && !seen.has(normalizedBank)) {
          seen.set(normalizedBank, rawBankValue || normalizedBank);
        }
      });
    }

    return Array.from(seen.entries())
      .sort((a, b) =>
        a[1].toLowerCase().localeCompare(b[1].toLowerCase(), 'es', {
          sensitivity: 'base',
        })
      )
      .map(([value, label]) => ({
        value,
        label: label || value,
      }));
  }, [
    needsConfig,
    cuentasRecords,
    props.cuentasBancoField,
    props.transBancoField,
    clientsIndex.bankMap,
    transRecords,
  ]);

  const bankFilterLabels = useMemo(
    () => bankFilterOptions.map((option) => option.label || option.value),
    [bankFilterOptions]
  );

  const clientFilterOptions = useMemo(() => {
    if (needsConfig) {
      return [];
    }
    const seen = new Map();
    clientsIndex.allClients.forEach((entry) => {
      if (!seen.has(entry.clienteId)) {
        seen.set(entry.clienteId, entry.displayLabel);
      }
    });
    return Array.from(seen.entries())
      .sort((a, b) =>
        a[1].toLowerCase().localeCompare(b[1].toLowerCase(), 'es', {
          sensitivity: 'base',
        })
      )
      .map(([value, label]) => ({ value, label }));
  }, [clientsIndex.allClients, needsConfig]);

  const accountBankEntries = useMemo(() => {
    if (needsConfig) {
      return [];
    }
    return cuentasRecords
      .map((accountRecord) => {
        const bankValue = props.cuentasBancoField
          ? accountRecord.getCellValueAsString(props.cuentasBancoField)
          : '';
        const accountValue = props.cuentasNumeroField
          ? accountRecord.getCellValueAsString(props.cuentasNumeroField)
          : '';
        const normalizedBank = normalizeBank(bankValue);
        const normalizedAccount = normalizeAccount(accountValue);
        if (!normalizedBank || !normalizedAccount) {
          return null;
        }
        return {
          bank: normalizedBank,
          account: normalizedAccount,
        };
      })
      .filter(Boolean);
  }, [
    cuentasRecords,
    props.cuentasBancoField,
    props.cuentasNumeroField,
    needsConfig,
  ]);

  const computeCandidates = useCallback(
    ({ candidateBank, candidateAccount }) => {
      if (needsConfig) {
        return [];
      }
      const { exactMap, bankMap, allClients } = clientsIndex;
      const collector = new Map();

      const addCandidate = (entry, confidence, reason) => {
        const existing = collector.get(entry.clienteId);
        if (!existing || confidence > existing.confidence) {
          collector.set(entry.clienteId, {
            ...entry,
            confidence,
            reason,
          });
        }
      };

      if (candidateBank && candidateAccount) {
        const key = `${candidateBank}|${candidateAccount}`;
        const entries = exactMap.get(key) ?? [];
        entries.forEach((entry) => {
          const matchReason = `Banco ${candidateBank} · ${formatAccountMasked(candidateAccount)}`;
          const confidence = entries.length === 1 ? 1 : 0.65;
          addCandidate(entry, confidence, matchReason);
        });
      }

      if (candidateBank) {
        const bankBucket = bankMap.get(candidateBank) ?? [];
        bankBucket.forEach((entry) => {
          if (
            candidateAccount &&
            entry.account &&
            candidateAccount.length >= 4 &&
            entry.account.endsWith(candidateAccount.slice(-4))
          ) {
            const matchReason = `Banco ${candidateBank} · últimos dígitos ${candidateAccount.slice(-4)}`;
            addCandidate(entry, 0.6, matchReason);
          } else {
            const matchReason = `Banco ${candidateBank}`;
            addCandidate(entry, 0.3, matchReason);
          }
        });
      } else if (candidateAccount) {
        const suffix = candidateAccount.slice(-4);
        allClients.forEach((entry) => {
          if (entry.account && suffix && entry.account.endsWith(suffix)) {
            const matchReason = `Últimos dígitos ${suffix}`;
            addCandidate(entry, 0.5, matchReason);
          }
        });
      }

      return Array.from(collector.values()).sort((a, b) => b.confidence - a.confidence);
    },
    [clientsIndex, needsConfig]
  );

  const sortedRecords = useMemo(() => {
    if (needsConfig) {
      return [];
    }
    const hasDateField = Boolean(props.transFechaField);
    const hasAutoNumberField = Boolean(autoNumberField);
    if (!hasDateField && !hasAutoNumberField) {
      return [...transRecords];
    }
    const normalizeDate = (value) => {
      if (value instanceof Date) {
        return value.getTime();
      }
      if (typeof value === 'string') {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? 0 : parsed;
      }
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
      }
      return 0;
    };
    const normalizeAuto = (value) => {
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
      }
      if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };

    return [...transRecords].sort((a, b) => {
      const aDate = hasDateField
        ? normalizeDate(a.getCellValue(props.transFechaField))
        : 0;
      const bDate = hasDateField
        ? normalizeDate(b.getCellValue(props.transFechaField))
        : 0;
      if (aDate !== bDate) {
        return bDate - aDate;
      }
      if (hasAutoNumberField) {
        const aAuto = normalizeAuto(a.getCellValue(autoNumberField));
        const bAuto = normalizeAuto(b.getCellValue(autoNumberField));
        if (aAuto !== bAuto) {
          return aAuto - bAuto;
        }
      }
      return 0;
    });
  }, [transRecords, props.transFechaField, autoNumberField, needsConfig]);

  const suggestionRows = useMemo(() => {
    if (needsConfig) {
      return [];
    }
    return sortedRecords.map((record) => {
      const assigned = record.getCellValue(props.transClienteField);
      const assignedClientIds = Array.isArray(assigned)
        ? assigned.map((entry) => entry?.id).filter(Boolean)
        : assigned?.id
        ? [assigned.id]
        : [];
      const isAssigned = assignedClientIds.length > 0;
      const accountLink = record.getCellValue(props.transCuentaField);
      const firstAccount = Array.isArray(accountLink) ? accountLink[0] : accountLink;
      const accountId = firstAccount?.id ?? null;
      const linkedAccount = accountId ? cuentasById.get(accountId) : undefined;
      const accountLabel = linkedAccount
        ? formatAccountLabel(linkedAccount)
        : 'Cuenta sin registrar';
      const bankValue = linkedAccount && props.cuentasBancoField
        ? linkedAccount.getCellValueAsString(props.cuentasBancoField)
        : '';
    const accountNumber = linkedAccount && props.cuentasNumeroField
        ? linkedAccount.getCellValueAsString(props.cuentasNumeroField)
        : '';
    const normalizedBank = normalizeBank(bankValue);
    const normalizedAccount = normalizeAccount(accountNumber);
    const description = props.transDescripcionField
      ? record.getCellValueAsString(props.transDescripcionField) || record.name
      : record.name;
    const normalizedDescription = (description || '').trim();
    const digitsFromDescription = parseDigitsFromText(normalizedDescription);
    const bbvaExtracted = props.transCuentaExtraidaField
      ? record.getCellValueAsString(props.transCuentaExtraidaField) ?? ''
      : '';
    const candidateAccountRaw =
      normalizeAccount(bbvaExtracted) ||
      normalizeAccount(digitsFromDescription) ||
      normalizedAccount;
    const descriptionBank = extractBankFromDescription(normalizedDescription, {
      extraBankNames: bankFilterLabels,
      accountEntries: accountBankEntries,
    });
    const rawPreAnalyzedBank = props.transBancoField
      ? record.getCellValueAsString(props.transBancoField) ?? ''
      : '';
    const normalizedPreAnalyzedBank = normalizeBank(rawPreAnalyzedBank);
    const candidateBank =
      normalizedPreAnalyzedBank || normalizedBank || descriptionBank;
    const candidateAccount = candidateBank === 'BBVA' ? candidateAccountRaw : '';
      const suggestions = computeCandidates({
        candidateBank,
        candidateAccount,
      });
      const bestCandidate = suggestions[0];
      const cargoValue = toNumericValue(record.getCellValue(props.transCargoField));
      const abonoValue = toNumericValue(record.getCellValue(props.transAbonoField));
      const amountLabel = cargoValue !== undefined
        ? `Cargo ${currencyFormatter.format(Math.abs(cargoValue))}`
        : abonoValue !== undefined
        ? `Abono ${currencyFormatter.format(Math.abs(abonoValue))}`
        : 'Sin monto';
      const typeLabel = props.transTipoField
        ? record.getCellValueAsString(props.transTipoField)
        : 'Tipo desconocido';
      return {
        record,
        accountId,
        accountLabel,
        isAssigned,
        suggestions,
        bestCandidate,
        matchReason: bestCandidate?.reason ?? '',
        amountLabel,
        typeLabel,
        description: normalizedDescription,
        descriptionShort:
          normalizedDescription.length > 140
            ? `${normalizedDescription.slice(0, 140)}…`
            : normalizedDescription,
        candidateBank,
        candidateAccount,
        assignedClientIds,
        preAnalyzedBank: normalizedPreAnalyzedBank,
        preAnalyzedBankLabel: rawPreAnalyzedBank,
      };
    });
  }, [
    sortedRecords,
    computeCandidates,
    props.transClienteField,
    props.transCuentaField,
    props.transDescripcionField,
    props.transCargoField,
    props.transAbonoField,
    props.transTipoField,
    props.cuentasBancoField,
    props.cuentasNumeroField,
    props.transCuentaExtraidaField,
    props.transBancoField,
    cuentasById,
    formatAccountLabel,
    currencyFormatter,
    accountBankEntries,
    bankFilterLabels,
    needsConfig,
  ]);

  const filteredRows = useMemo(() => {
    if (needsConfig) {
      return [];
    }
    const searchTerm = filters.searchTerm.trim().toLowerCase();
    return suggestionRows.filter((row) => {
      if (filters.showOnlyMissing && row.isAssigned) {
        return false;
      }
      if (filters.onlyToday && props.transFechaField) {
        const fecha = row.record.getCellValue(props.transFechaField);
        if (!isSameDay(fecha)) {
          return false;
        }
      }
      if (filters.selectedAccountId && row.accountId !== filters.selectedAccountId) {
        return false;
      }
      if (skippedRecordIds.has(row.record.id)) {
        return false;
      }
      if (searchTerm) {
        const haystack = `${row.description} ${row.bestCandidate?.searchText ?? ''}`.toLowerCase();
        if (!haystack.includes(searchTerm)) {
          return false;
        }
      }
      if (filters.bankFilter) {
        const matchesBank =
          row.preAnalyzedBank === filters.bankFilter ||
          row.candidateBank === filters.bankFilter ||
          row.bestCandidate?.banco === filters.bankFilter ||
          row.suggestions.some((candidate) => candidate.banco === filters.bankFilter);
        if (!matchesBank) {
          return false;
        }
      }
      if (filters.clientFilterId) {
        const matchesClient =
          row.assignedClientIds.includes(filters.clientFilterId) ||
          row.bestCandidate?.clienteId === filters.clientFilterId ||
          row.suggestions.some((candidate) => candidate.clienteId === filters.clientFilterId);
        if (!matchesClient) {
          return false;
        }
      }
      return true;
    });
  }, [suggestionRows, filters, props.transFechaField, skippedRecordIds, needsConfig]);

  const visibleRows = useMemo(
    () =>
      filteredRows.slice(
        0,
        Math.min(filteredRows.length, visibleRowLimit)
      ),
    [filteredRows, visibleRowLimit]
  );

  const canShowMoreRows = visibleRows.length < filteredRows.length;
  const remainingRows = filteredRows.length - visibleRows.length;
  const nextRowsToShow = Math.min(CLIENTE_VISIBLE_INCREMENT, remainingRows);
  const handleShowMoreRows = useCallback(() => {
    setVisibleRowLimit((prev) => Math.min(filteredRows.length, prev + CLIENTE_VISIBLE_INCREMENT));
  }, [filteredRows.length]);
  const handleResetVisibleRows = useCallback(() => {
    setVisibleRowLimit(CLIENTE_INITIAL_VISIBLE);
  }, []);

  const accountOptions = useMemo(() => {
    if (needsConfig) {
      return [];
    }
    return cuentasRecords.map((accountRecord) => ({
      value: accountRecord.id,
      label: formatAccountLabel(accountRecord),
    }));
  }, [cuentasRecords, formatAccountLabel, needsConfig]);

  const highConfidenceRows = filteredRows.filter(
    (row) =>
      !row.isAssigned &&
      row.bestCandidate?.confidence >= 0.95 &&
      row.suggestions.length === 1
  );

  const handleLink = useCallback(
    async (row, candidate) => {
      if (needsConfig) {
        setStatusMessage('Configura los campos necesarios para vincular.');
        return false;
      }
      if (!candidate?.clienteId) {
        setStatusMessage('Selecciona un cliente antes de vincular.');
        return false;
      }
      setLoadingRecordId(row.record.id);
      try {
        const linkValue = [{ id: candidate.clienteId }];
        const permission = transTable.checkPermissionsForUpdateRecord(row.record, {
          [props.transClienteField.id]: linkValue,
        });
        if (!permission.hasPermission) {
          setStatusMessage('No tienes permiso para vincular este cliente.');
          return false;
        }
        await transTable.updateRecordAsync(row.record, {
          [props.transClienteField.id]: linkValue,
        });
        setSkippedRecordIds((prev) => {
          if (!prev.has(row.record.id)) {
            return prev;
          }
          const next = new Set(prev);
          next.delete(row.record.id);
          return next;
        });
        setStatusMessage(`Cliente vinculado: ${candidate.displayLabel}`);
        return true;
      } catch (error) {
        setStatusMessage(`Error al vincular: ${error?.message ?? 'desconocido'}`);
        return false;
      } finally {
        setLoadingRecordId(null);
      }
    },
    [transTable, props.transClienteField, needsConfig]
  );

  const handleBulkLink = useCallback(async () => {
    if (needsConfig) {
      return;
    }
    if (!highConfidenceRows.length) {
      return;
    }
    const combos = new Set(
      highConfidenceRows.map((row) => row.bestCandidate?.reason ?? row.accountLabel)
    );
    const summary = Array.from(combos).slice(0, 3).join(', ');
    const message = `Se vincularán ${highConfidenceRows.length} registros (${summary}). ¿Deseas continuar?`;
    if (!window.confirm(message)) {
      return;
    }
    setBulkSaving(true);
    let successes = 0;
    for (const row of highConfidenceRows) {
      if (!row.bestCandidate) {
        continue;
      }
      const success = await handleLink(row, row.bestCandidate);
      if (success) {
        successes += 1;
      }
    }
    setBulkSaving(false);
    if (successes > 0) {
      setStatusMessage(`Se vincularon ${successes} ${successes === 1 ? 'registro' : 'registros'}.`);
    }
  }, [handleLink, highConfidenceRows, needsConfig]);

  const handleCuentaChip = useCallback(() => {
    if (!filters.activeAccountId) {
      return;
    }
    setFilters((prev) => ({
      ...prev,
      selectedAccountId:
        prev.selectedAccountId === prev.activeAccountId ? '' : prev.activeAccountId,
    }));
  }, [filters.activeAccountId]);

  const handleSkip = useCallback((recordId) => {
    setSkippedRecordIds((prev) => {
      const next = new Set(prev);
      next.add(recordId);
      return next;
    });
  }, []);

  const filteredCount = filteredRows.length;
  const missingCount = suggestionRows.filter((row) => !row.isAssigned).length;

  const renderFilters = () => (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 items-center">
        <label htmlFor="cliente-search" className="sr-only">
          Buscar transacciones
        </label>
        <input
          id="cliente-search"
          type="search"
          value={filters.searchTerm}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, searchTerm: event.target.value }))
          }
          placeholder="Buscar por descripción o cliente"
          className="w-full sm:w-64 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
        <select
          value={filters.selectedAccountId}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              selectedAccountId: event.target.value,
              activeAccountId: event.target.value || prev.activeAccountId,
            }))
          }
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="">Todas las cuentas</option>
          {accountOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() =>
            setFilters((prev) => ({
              ...prev,
              showOnlyMissing: !prev.showOnlyMissing,
            }))
          }
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            filters.showOnlyMissing
              ? 'border-blue-500 bg-blue-50 text-blue-600'
              : 'border-gray-300 bg-white text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
          }`}
        >
          {filters.showOnlyMissing ? 'Solo sin Cliente' : 'Mostrar asignados'}
        </button>
        <button
          type="button"
          onClick={() =>
            setFilters((prev) => ({ ...prev, onlyToday: !prev.onlyToday }))
          }
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            filters.onlyToday
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
              : 'border-gray-300 bg-white text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
          }`}
        >
          {filters.onlyToday ? 'Solo hoy' : 'Fecha completa'}
        </button>
        <button
          type="button"
          onClick={handleCuentaChip}
          disabled={!filters.activeAccountId}
          className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 disabled:opacity-40 dark:border-gray-600 dark:text-gray-200"
        >
          Cuenta bancaria actual
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1 w-full max-w-xs">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
            Banco sugerido
          </span>
          <select
            value={filters.bankFilter}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, bankFilter: event.target.value }))
            }
            disabled={needsConfig}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">Todos los bancos</option>
            {bankFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 w-full max-w-xs">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
            Cliente sugerido
          </span>
          <select
            value={filters.clientFilterId}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, clientFilterId: event.target.value }))
            }
            disabled={needsConfig}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">Todos los clientes</option>
            {clientFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-200">
        <span>
          {filteredCount} registros listos · {missingCount} sin cliente
        </span>
        <button
          type="button"
          onClick={handleBulkLink}
          disabled={!highConfidenceRows.length || bulkSaving}
          className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
        >
          {bulkSaving ? 'Aplicando...' : `Vincular sugerencias (≥0.95) · ${highConfidenceRows.length}`}
        </button>
        {statusMessage && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {statusMessage}
          </span>
        )}
      </div>
    </div>
  );

  if (needsConfig) {
    return (
      <ConfigurationNotice
        title="Asignar Cliente"
        tableMissing={!transTable || !clientesTable}
        missingFields={missingFields}
        errorState={errorState}
      />
    );
  }

  return (
    <div className="space-y-4">
      {errorState?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700 dark:border-red-500 dark:bg-red-900/40 dark:text-red-100">
          {errorState.error.message}
        </div>
      )}
      {renderFilters()}
      {filteredRows.length > 0 && (
        <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Mostrando {visibleRows.length} / {filteredRows.length} registros listos
          </span>
          <div className="flex flex-wrap gap-2">
            {canShowMoreRows && (
              <button
                type="button"
                onClick={handleShowMoreRows}
                className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 dark:border-gray-600 dark:text-gray-200"
              >
                Mostrar {nextRowsToShow} más
              </button>
            )}
            {!canShowMoreRows && filteredRows.length > CLIENTE_INITIAL_VISIBLE && (
              <button
                type="button"
                onClick={handleResetVisibleRows}
                className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 dark:border-gray-600 dark:text-gray-200"
              >
                Volver a {CLIENTE_INITIAL_VISIBLE}
              </button>
            )}
          </div>
        </div>
      )}
      {filteredRows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600 dark:border-gray-600 dark:text-gray-200">
          No hay transacciones pendientes de asignar.
        </div>
      ) : (
        <div className="space-y-4">
          {visibleRows.map((row) => {
            const manualQuery = manualQueries[row.record.id] ?? '';
            const manualQueryLower = manualQuery.trim().toLowerCase();
            const matchesRowConstraints = (candidate) => {
              const matchesBank =
                !row.candidateBank ||
                candidate.banco === row.candidateBank ||
                candidate.rawBanco === row.candidateBank;
              const needsAccountMatch =
                row.candidateBank === 'BBVA' && row.candidateAccount?.length >= 4;
              const matchesAccount = needsAccountMatch
                ? candidate.account?.endsWith(row.candidateAccount.slice(-4)) ||
                  candidate.rawAccount?.endsWith(row.candidateAccount.slice(-4))
                : true;
              return matchesBank && matchesAccount;
            };
            const manualCandidatesBase = clientsIndex.allClients.filter(matchesRowConstraints);
            const manualCandidates =
              manualQueryLower.length > 0
                ? manualCandidatesBase.filter((candidate) =>
                    candidate.searchText.includes(manualQueryLower)
                  )
                : manualCandidatesBase;
            const selectedCandidateId =
              selectionByRecord[row.record.id] ?? row.bestCandidate?.clienteId ?? '';
            const selectedCandidate =
              row.suggestions.find((candidate) => candidate.clienteId === selectedCandidateId) ||
              row.bestCandidate;
            const clientBankLabel =
              selectedCandidate?.rawBanco ||
              selectedCandidate?.banco ||
              row.preAnalyzedBankLabel ||
              row.candidateBank;
            const clientAccountLabel =
              selectedCandidate?.rawAccount ||
              (selectedCandidate?.account ? formatAccountMasked(selectedCandidate.account) : '');
            return (
              <div
                key={row.record.id}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && selectedCandidate) {
                    event.preventDefault();
                    handleLink(row, selectedCandidate);
                  }
                  if (event.key === 'Escape') {
                    handleSkip(row.record.id);
                  }
                }}
                className="rounded-xl border border-gray-200 bg-white p-5 text-sm shadow-sm outline-none transition hover:border-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[0.7rem] uppercase tracking-wide text-gray-500 dark:text-gray-300">
                      {row.accountLabel}
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                      {row.descriptionShort}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      {row.amountLabel} · {row.typeLabel}
                    </p>
                    {row.matchReason && (
                      <p className="mt-1 text-sm text-gray-400 dark:text-gray-300">
                        {row.matchReason}
                      </p>
                    )}
                    {(clientBankLabel || clientAccountLabel) && (
                      <div className="mt-3 space-y-2 rounded-lg bg-gray-50/60 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800/60 dark:text-gray-200">
                        {clientBankLabel && (
                          <div className="flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-200">
                            <span>Cliente Banco</span>
                            <span>{clientBankLabel}</span>
                          </div>
                        )}
                        {clientAccountLabel && (
                          <div className="flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-200">
                            <span>Número de cuenta cliente</span>
                            <span>{clientAccountLabel}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {row.bestCandidate && (
                    <span
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getConfidenceClasses(
                        row.bestCandidate.confidence
                      )}`}
                    >
                      <span>Confianza</span>
                      <span>{Math.round(row.bestCandidate.confidence * 100)}%</span>
                    </span>
                  )}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                      Cliente sugerido
                    </label>
                    <select
                      value={selectedCandidateId}
                      onChange={(event) => {
                        const candidateId = event.target.value;
                        setSelectionByRecord((prev) => ({
                          ...prev,
                          [row.record.id]: candidateId,
                        }));
                      }}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="">Selecciona</option>
                      {[...row.suggestions]
                        .sort((a, b) => b.confidence - a.confidence)
                        .map((candidate) => (
                          <option key={candidate.clienteId} value={candidate.clienteId}>
                            {candidate.displayLabel}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                      Acciones rápidas
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleLink(row, selectedCandidate)}
                        disabled={
                          !selectedCandidate ||
                          row.isAssigned ||
                          loadingRecordId === row.record.id
                        }
                        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                      >
                        {loadingRecordId === row.record.id ? 'Guardando...' : 'Vincular'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSkip(row.record.id)}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-600 dark:border-gray-600 dark:text-gray-200"
                      >
                        Pendiente
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                    Búsqueda manual (nombre o COD)
                  </label>
                  <div className="relative">
                    <input
                      type="search"
                      value={manualQuery}
                      onChange={(event) => {
                        const value = event.target.value;
                        setManualQueries((prev) => ({
                          ...prev,
                          [row.record.id]: value,
                        }));
                      }}
                      placeholder="Escribe para filtrar y presiona Enter"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && manualCandidates[0]) {
                          event.preventDefault();
                          handleLink(row, manualCandidates[0]);
                        }
                      }}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                    <div className="mt-2 rounded-lg border border-gray-200 bg-white/80 text-sm shadow-lg dark:border-gray-600 dark:bg-gray-800/80">
                      <div className="max-h-48 overflow-y-auto">
                        {manualCandidates.map((candidate) => {
                          const candidateBank =
                            candidate.rawBanco || candidate.banco || 'Sin banco';
                          const candidateAccount =
                            candidate.rawAccount ||
                            (candidate.account ? formatAccountMasked(candidate.account) : 'Sin cuenta');
                          return (
                            <button
                              key={candidate.clienteId}
                              type="button"
                              onClick={() => {
                                setManualQueries((prev) => ({
                                  ...prev,
                                  [row.record.id]: candidate.displayLabel,
                                }));
                                setSelectionByRecord((prev) => ({
                                  ...prev,
                                  [row.record.id]: candidate.clienteId,
                                }));
                                handleLink(row, candidate);
                              }}
                              className={`flex w-full flex-col gap-1 border-b border-gray-100 px-3 py-2 text-left transition hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-gray-700 ${
                                selectedCandidateId === candidate.clienteId
                                  ? 'bg-blue-500/10 dark:bg-blue-400/20'
                                  : ''
                              }`}
                            >
                              <span className="text-xs font-semibold text-gray-900 dark:text-gray-50">
                                {candidate.displayLabel}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-300">
                                Banco: {candidateBank} · Cuenta: {candidateAccount}
                              </span>
                            </button>
                          );
                        })}
                        {manualCandidates.length === 0 && (
                          <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                            No se encontraron clientes
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClienteAssignment;
