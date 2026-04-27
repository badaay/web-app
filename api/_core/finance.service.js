/**
 * Re-export barrel for FinanceService — used by API handlers.
 */
export {
  listTransactions,
  createTransaction,
  getFinancialSummary
} from '../../src/core/services/finance.service.js';
