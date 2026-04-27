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
  closeWorkOrder
} from '../../src/core/services/work-order.service.js';
