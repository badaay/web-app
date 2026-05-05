/**
 * Inventory Service — Business Logic Layer
 * Validates input and delegates to inventory repository.
 */
import * as inventoryRepo from '../repositories/inventory.repository.js';
import { ok, created, badRequest, notFound, serverError } from '../utils/http-mapper.js';
import { ALLOWED_INVENTORY_FIELDS } from '../utils/constants.js';
import { whitelist } from '../utils/validators.js';

export async function listInventory(dbClient) {
  const { data, error } = await inventoryRepo.findAll(dbClient);
  if (error) return serverError(`Database error: ${error.message}`);
  return ok(data);
}

export async function createItem(dbClient, body) {
  if (!body.name) return badRequest('name is required');

  const payload = {
    name: body.name,
    stock: body.stock ?? 0,
    unit: body.unit || null,
    category: body.category || null,
    unit_cost: body.unit_cost ?? 0.00,
  };

  const { data, error } = await inventoryRepo.create(dbClient, payload);
  if (error) return serverError(`Database error: ${error.message}`);
  return created(data);
}

export async function updateItem(dbClient, id, body) {
  if (!id) return badRequest('Item id is required');

  const updates = whitelist(body, ALLOWED_INVENTORY_FIELDS);
  if (Object.keys(updates).length === 0) return badRequest('No valid fields to update');

  const { data, error } = await inventoryRepo.updateById(dbClient, id, updates);
  if (error) return serverError(`Database error: ${error.message}`);
  if (!data) return notFound('Inventory item not found');
  return ok(data);
}

export async function deleteItem(dbClient, id) {
  if (!id) return badRequest('Item id is required');

  const { error } = await inventoryRepo.deleteById(dbClient, id);
  if (error) return serverError(`Delete failed: ${error.message}`);
  return ok({ message: 'Item deleted' });
}

/**
 * processWorkOrderInventory (Story 2.3)
 * Calculates costs, generates snapshot, and decrements stock.
 */
export async function processWorkOrderInventory(dbClient, inventory_used = []) {
  let totalMaterialCost = 0;
  const inventorySnapshot = [];

  if (!inventory_used || inventory_used.length === 0) {
    return { totalMaterialCost, inventorySnapshot };
  }

  const itemIds = inventory_used.map(u => u.item_id);
  const { data: items, error: fetchErr } = await inventoryRepo.findManyByIds(dbClient, itemIds);

  if (fetchErr) {
    console.error('[INV-PROCESS] Failed to fetch items:', fetchErr.message);
    return { totalMaterialCost, inventorySnapshot };
  }

  if (items) {
    for (const usage of inventory_used) {
      const item = items.find(i => i.id === usage.item_id);
      if (item) {
        const qty = parseInt(usage.quantity) || 0;
        const cost = parseFloat(item.unit_cost) || 0;
        const subtotal = qty * cost;
        totalMaterialCost += subtotal;
        
        inventorySnapshot.push({
          item_id: item.id,
          name: item.name,
          unit: item.unit,
          quantity: qty,
          unit_cost: cost,
          subtotal: subtotal
        });

        // Deduct stock safely via RPC
        await inventoryRepo.decrementStock(dbClient, item.id, qty).catch(err => {
          console.error(`[INV-STOCK] Failed to decrement stock for ${item.id}:`, err.message);
        });
      }
    }
  }

  return { totalMaterialCost, inventorySnapshot };
}

