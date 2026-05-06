/**
 * Re-export barrel for FinanceService — used by API handlers.
 */
export {
  listTransactions,
  createTransaction,
  getFinancialSummary,
  listPayrollPeriods,
  getPayrollRekap,
  markPayrollPaid
} from '../../src/core/services/finance.service.js';
