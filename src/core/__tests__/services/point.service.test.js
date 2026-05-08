/**
 * Point Service — Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupServiceTest } from './setup.js';

// Mock dependencies
vi.mock('../../repositories/point.repository.js');
import * as pointRepo from '../../repositories/point.repository.js';

import { 
  distributeWorkOrderPoints,
  calculateMonthlyAdjustments
} from '../../services/point.service.js';

describe('PointService', () => {
  const { mockDb } = setupServiceTest();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('distributeWorkOrderPoints', () => {
    it('should divide base points equally among participants and round down', async () => {
      const workOrderId = 'wo-123';
      const basePoint = 100;
      const technicians = ['tech-1', 'tech-2', 'tech-3']; // 3 people

      // Expectation: 100 / 3 = 33.33 -> 33 each
      
      pointRepo.updateAssignmentPoints.mockResolvedValue({ error: null });

      const result = await distributeWorkOrderPoints(mockDb, workOrderId, basePoint, technicians);

      expect(result.success).toBe(true);
      expect(pointRepo.updateAssignmentPoints).toHaveBeenCalledTimes(3);
      
      // Check first call arguments
      const [db, woId, techId, points] = pointRepo.updateAssignmentPoints.mock.calls[0];
      expect(points).toBe(33);
    });

    it('should handle zero base points', async () => {
      const result = await distributeWorkOrderPoints(mockDb, 'wo-1', 0, ['t1']);
      expect(result.success).toBe(true);
      expect(pointRepo.updateAssignmentPoints).toHaveBeenCalledWith(mockDb, 'wo-1', 't1', 0);
    });
  });

  describe('calculateMonthlyAdjustments', () => {
    it('should calculate late deductions correctly using rules', async () => {
      const employeeId = 'emp-1';
      const month = 5;
      const year = 2026;

      // Mock rules: 15 mins = 5000 IDR
      pointRepo.findRulesByMetric.mockImplementation((db, metric) => {
        if (metric === 'minutes_late') {
          return Promise.resolve({
            data: [{
              rule_type: 'deduction',
              trigger_metric: 'minutes_late',
              trigger_unit: 15,
              amount_per_unit: 5000,
              is_multiplier: true
            }],
            error: null
          });
        }
        return Promise.resolve({ data: [], error: null });
      });

      // Mock attendance: 45 minutes late total
      pointRepo.sumLateMinutes.mockResolvedValue({ data: 45, error: null });
      
      // Mock performance (to avoid failure)
      pointRepo.getEmployeePerformance.mockResolvedValue({ data: null, error: null });

      const result = await calculateMonthlyAdjustments(mockDb, employeeId, month, year);

      expect(result.success).toBe(true);
      // 45 / 15 * 5000 = 15000
      const lateAdjustment = result.data.find(a => a.type === 'late_deduction');
      expect(lateAdjustment.amount).toBe(15000);
    });

    it('should calculate performance deduction for under target', async () => {
      const employeeId = 'emp-1';
      
      // Mock rules: 1 point shortage = 11600 IDR
      pointRepo.findRulesByMetric.mockImplementation((db, metric) => {
        if (metric === 'points_shortage') {
          return Promise.resolve({
            data: [{
              rule_type: 'deduction',
              trigger_metric: 'points_shortage',
              trigger_unit: 1,
              amount_per_unit: 11600,
              is_multiplier: true
            }],
            error: null
          });
        }
        return Promise.resolve({ data: [], error: null });
      });

      // Mock performance: Target 100, Actual 80 -> Shortage 20
      pointRepo.getEmployeePerformance.mockResolvedValue({
        data: { target_points: 100, actual_points: 80 },
        error: null
      });

      // Mock late minutes (to avoid failure)
      pointRepo.sumLateMinutes.mockResolvedValue({ data: 0, error: null });

      const result = await calculateMonthlyAdjustments(mockDb, employeeId, 5, 2026);

      expect(result.success).toBe(true);
      // 20 * 11600 = 232000
      const perfAdjustment = result.data.find(a => a.type === 'performance_deduction');
      expect(perfAdjustment.amount).toBe(232000);
    });

    it('should calculate performance bonus for exceeding unit threshold', async () => {
      const employeeId = 'emp-1';
      
      // Mock rules: 100 points = 10000 IDR bonus
      pointRepo.findRulesByMetric.mockImplementation((db, metric) => {
        if (metric === 'points_earned') {
          return Promise.resolve({
            data: [{
              rule_type: 'addition',
              trigger_metric: 'points_earned',
              trigger_unit: 100,
              amount_per_unit: 10000,
              is_multiplier: true
            }],
            error: null
          });
        }
        return Promise.resolve({ data: [], error: null });
      });

      // Mock performance: Actual 250 points -> 2 units of 100
      pointRepo.getEmployeePerformance.mockResolvedValue({
        data: { target_points: 100, actual_points: 250 },
        error: null
      });

      pointRepo.sumLateMinutes.mockResolvedValue({ data: 0, error: null });

      const result = await calculateMonthlyAdjustments(mockDb, employeeId, 5, 2026);

      expect(result.success).toBe(true);
      // 2 * 10000 = 20000
      const bonusAdjustment = result.data.find(a => a.type === 'performance_bonus');
      expect(bonusAdjustment.amount).toBe(20000);
    });
  });
});
