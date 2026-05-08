/**
 * Point Service — Business logic for point distribution and payroll adjustments
 */
import * as pointRepo from '../repositories/point.repository.js';

/**
 * Distribute points from a completed Work Order to all assigned technicians
 */
export async function distributeWorkOrderPoints(dbClient, workOrderId, basePoint, technicians) {
  if (!technicians || technicians.length === 0) {
    return { success: true, message: 'No technicians assigned' };
  }

  // Mandatory Integer-based Math: Floor rounding
  const pointsPerPerson = Math.floor(basePoint / technicians.length);

  try {
    for (const techId of technicians) {
      const { error } = await pointRepo.updateAssignmentPoints(dbClient, workOrderId, techId, pointsPerPerson);
      if (error) throw error;
    }
    return { success: true, data: { points_per_person: pointsPerPerson } };
  } catch (error) {
    console.error('Error distributing points:', error);
    return { success: false, error, statusHint: 'server_error' };
  }
}

/**
 * Calculate all point-related salary adjustments for an employee's monthly payroll
 */
export async function calculateMonthlyAdjustments(dbClient, employeeId, month, year) {
  const adjustments = [];

  try {
    // 1. Calculate Late Deduction
    const { data: rules } = await pointRepo.findRulesByMetric(dbClient, 'minutes_late');
    const { data: totalLateMinutes } = await pointRepo.sumLateMinutes(dbClient, employeeId, month, year);

    if (rules && rules.length > 0 && totalLateMinutes > 0) {
      const rule = rules[0]; // Take the primary rule
      const units = Math.floor(totalLateMinutes / rule.trigger_unit);
      const amount = units * rule.amount_per_unit;

      if (amount > 0) {
        adjustments.push({
          type: 'late_deduction',
          amount,
          details: `${totalLateMinutes} mins late / ${rule.trigger_unit} units`
        });
      }
    }

    // 2. Calculate Performance Deduction (Under Target)
    const { data: perfRules } = await pointRepo.findRulesByMetric(dbClient, 'points_shortage');
    const { data: performance } = await pointRepo.getEmployeePerformance(dbClient, employeeId, month, year);

    if (perfRules && perfRules.length > 0 && performance) {
      const { target_points, actual_points } = performance;
      if (actual_points < target_points) {
        const shortage = target_points - actual_points;
        const rule = perfRules[0];
        const units = Math.floor(shortage / rule.trigger_unit);
        const amount = units * rule.amount_per_unit;

        if (amount > 0) {
          adjustments.push({
            type: 'performance_deduction',
            amount,
            details: `Shortage: ${shortage} pts (Target: ${target_points})`
          });
        }
      }
    }

    // 3. Calculate Performance Bonus (Over Target)
    const { data: bonusRules } = await pointRepo.findRulesByMetric(dbClient, 'points_earned');
    if (bonusRules && bonusRules.length > 0 && performance) {
      const { actual_points } = performance;
      const rule = bonusRules[0];
      if (actual_points >= rule.trigger_unit) {
        const units = Math.floor(actual_points / rule.trigger_unit);
        const amount = units * rule.amount_per_unit;

        if (amount > 0) {
          adjustments.push({
            type: 'performance_bonus',
            amount,
            details: `Performance Bonus: ${actual_points} pts / ${rule.trigger_unit} units`
          });
        }
      }
    }

    return { success: true, data: adjustments };
  } catch (error) {
    console.error('Error calculating adjustments:', error);
    return { success: false, error, statusHint: 'server_error' };
  }
}
