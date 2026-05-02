/**
 * Re-export barrel for WorkOrderService — used by API handlers.
 */
export {
  listWorkOrders,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  confirmWorkOrder,
  claimWorkOrder,
  completeWorkOrder,
  verifyWorkOrder,
  requestRevision,
  closeWorkOrder
} from '../../src/core/services/work-order.service.js';
