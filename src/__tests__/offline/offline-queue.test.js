// Offline Queue Tests
// Tests for offline action queuing and synchronization

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Set up DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;
global.navigator = dom.window.navigator;

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index) => Object.keys(store)[index] || null)
  };
})();
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = vi.fn();

// Import the module to test
import OfflineQueue from '../../components/offline/OfflineQueue.js';

describe('OfflineQueue', () => {
  let offlineQueue;
  let mockNotification;

  beforeEach(() => {
    // Reset localStorage
    localStorageMock.clear();
    
    // Mock Notification API
    mockNotification = {
      permission: 'granted',
      requestPermission: vi.fn().mockResolvedValue('granted')
    };
    global.Notification = mockNotification;

    // Reset fetch
    fetch.mockClear();
    fetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('Success')
    });

    offlineQueue = new OfflineQueue({
      maxQueueSize: 10,
      retryAttempts: 2,
      retryDelay: 100,
      autoSync: false // Disable auto sync for tests
    });
  });

  afterEach(() => {
    if (offlineQueue) {
      offlineQueue.destroy();
    }
  });

  describe('Queue Management', () => {
    it('should add actions to queue when offline', () => {
      offlineQueue.isOnline = false;
      
      const actionId = offlineQueue.addAction({
        type: 'work_order_update',
        url: '/api/work-orders/123',
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed' })
      });

      expect(actionId).toBeDefined();
      expect(offlineQueue.getPendingCount()).toBe(1);
      expect(offlineQueue.queue[0].type).toBe('work_order_update');
    });

    it('should limit queue size', () => {
      offlineQueue.isOnline = false;
      
      // Fill queue to max size
      for (let i = 0; i < 15; i++) {
        offlineQueue.addAction({
          type: 'test_action',
          url: `/api/test/${i}`,
          method: 'POST',
          body: JSON.stringify({ data: i })
        });
      }

      expect(offlineQueue.queue.length).toBeLessThanOrEqual(10);
    });

    it('should prioritize higher priority actions', () => {
      offlineQueue.isOnline = false;
      
      // Add low priority action first
      offlineQueue.addAction({
        type: 'low_priority',
        url: '/api/low',
        method: 'POST',
        priority: 1
      });

      // Add high priority action second
      offlineQueue.addAction({
        type: 'high_priority',
        url: '/api/high',
        method: 'POST',
        priority: 5
      });

      expect(offlineQueue.queue[0].priority).toBe(5);
      expect(offlineQueue.queue[1].priority).toBe(1);
    });

    it('should remove actions from queue', () => {
      offlineQueue.isOnline = false;
      
      const actionId = offlineQueue.addAction({
        type: 'test_action',
        url: '/api/test',
        method: 'POST'
      });

      expect(offlineQueue.getPendingCount()).toBe(1);

      const removed = offlineQueue.removeAction(actionId);
      
      expect(removed).toBeTruthy();
      expect(removed.id).toBe(actionId);
      expect(offlineQueue.getPendingCount()).toBe(0);
    });
  });

  describe('Synchronization', () => {
    it('should sync actions when online', async () => {
      offlineQueue.isOnline = true;
      
      // Add action to queue
      offlineQueue.addAction({
        type: 'work_order_update',
        url: '/api/work-orders/123',
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed' })
      });

      expect(offlineQueue.getPendingCount()).toBe(1);

      await offlineQueue.syncQueue();

      expect(fetch).toHaveBeenCalledWith(
        '/api/work-orders/123',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'completed' })
        }
      );

      expect(offlineQueue.getPendingCount()).toBe(0);
    });

    it('should not sync when offline', async () => {
      offlineQueue.isOnline = false;
      
      offlineQueue.addAction({
        type: 'test_action',
        url: '/api/test',
        method: 'POST'
      });

      await offlineQueue.syncQueue();

      expect(fetch).not.toHaveBeenCalled();
      expect(offlineQueue.getPendingCount()).toBe(1);
    });

    it('should handle sync failures with retry', async () => {
      offlineQueue.isOnline = true;
      
      // Mock fetch failure
      fetch.mockRejectedValueOnce(new Error('Network error'));

      offlineQueue.addAction({
        type: 'test_action',
        url: '/api/test',
        method: 'POST'
      });

      await offlineQueue.syncQueue();

      expect(offlineQueue.queue[0].retryCount).toBe(1);
      expect(offlineQueue.queue[0].lastError).toBe('Network error');
      expect(offlineQueue.getPendingCount()).toBe(1);
    });

    it('should mark actions as failed after max retries', async () => {
      offlineQueue.isOnline = true;
      
      // Mock persistent failure
      fetch.mockRejectedValue(new Error('Persistent error'));

      offlineQueue.addAction({
        type: 'test_action',
        url: '/api/test',
        method: 'POST'
      });

      // First retry
      await offlineQueue.syncQueue();
      expect(offlineQueue.queue[0].retryCount).toBe(1);

      // Second retry (max retries = 2)
      await offlineQueue.syncQueue();
      expect(offlineQueue.queue[0].retryCount).toBe(2);

      // Third attempt should mark as failed
      await offlineQueue.syncQueue();
      expect(offlineQueue.queue[0].failedAt).toBeDefined();
      expect(offlineQueue.getFailedCount()).toBe(1);
    });

    it('should sync in priority order', async () => {
      offlineQueue.isOnline = true;
      
      // Add actions with different priorities
      offlineQueue.addAction({
        type: 'low_priority',
        url: '/api/low',
        method: 'POST',
        priority: 1
      });

      offlineQueue.addAction({
        type: 'high_priority',
        url: '/api/high',
        method: 'POST',
        priority: 5
      });

      offlineQueue.addAction({
        type: 'medium_priority',
        url: '/api/medium',
        method: 'POST',
        priority: 3
      });

      await offlineQueue.syncQueue();

      // Should sync high priority first
      expect(fetch).toHaveBeenNthCalledWith(1, '/api/high', expect.any(Object));
      expect(fetch).toHaveBeenNthCalledWith(2, '/api/medium', expect.any(Object));
      expect(fetch).toHaveBeenNthCalledWith(3, '/api/low', expect.any(Object));
    });
  });

  describe('Connection Status Handling', () => {
    it('should update connection status on online event', () => {
      const mockEvent = new Event('online');
      window.dispatchEvent(mockEvent);

      expect(offlineQueue.isOnline).toBe(true);
    });

    it('should update connection status on offline event', () => {
      const mockEvent = new Event('offline');
      window.dispatchEvent(mockEvent);

      expect(offlineQueue.isOnline).toBe(false);
    });

    it('should auto-sync when connection restored', async () => {
      const autoSyncQueue = new OfflineQueue({
        autoSync: true,
        retryDelay: 100
      });

      autoSyncQueue.isOnline = false;
      
      // Add action while offline
      autoSyncQueue.addAction({
        type: 'test_action',
        url: '/api/test',
        method: 'POST'
      });

      expect(autoSyncQueue.getPendingCount()).toBe(1);

      // Simulate connection restored
      const mockEvent = new Event('online');
      window.dispatchEvent(mockEvent);

      // Wait for async sync
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(fetch).toHaveBeenCalled();
      autoSyncQueue.destroy();
    });
  });

  describe('Statistics and Status', () => {
    it('should provide accurate statistics', () => {
      // Add some actions
      offlineQueue.addAction({ type: 'test1', url: '/api/test1', method: 'POST' });
      offlineQueue.addAction({ type: 'test2', url: '/api/test2', method: 'POST' });
      
      const stats = offlineQueue.getStats();
      
      expect(stats.total).toBe(2);
      expect(stats.pending).toBe(2);
      expect(stats.synced).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.isOnline).toBe(true);
    });

    it('should update statistics after sync', async () => {
      offlineQueue.isOnline = true;
      
      offlineQueue.addAction({
        type: 'test_action',
        url: '/api/test',
        method: 'POST'
      });

      await offlineQueue.syncQueue();

      const stats = offlineQueue.getStats();
      expect(stats.synced).toBe(1);
      expect(stats.pending).toBe(0);
    });

    it('should track failed actions', async () => {
      offlineQueue.isOnline = true;
      fetch.mockRejectedValue(new Error('Persistent error'));

      offlineQueue.addAction({
        type: 'test_action',
        url: '/api/test',
        method: 'POST'
      });

      // Fail twice (max retries = 2)
      await offlineQueue.syncQueue();
      await offlineQueue.syncQueue();
      await offlineQueue.syncQueue();

      const stats = offlineQueue.getStats();
      expect(stats.failed).toBe(1);
    });
  });

  describe('Persistence', () => {
    it('should save queue to localStorage', () => {
      offlineQueue.addAction({
        type: 'test_action',
        url: '/api/test',
        method: 'POST'
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'offlineActionQueue',
        expect.any(String)
      );
    });

    it('should load queue from localStorage', () => {
      const savedQueue = [
        {
          id: 'test-id',
          type: 'test_action',
          url: '/api/test',
          method: 'POST',
          timestamp: Date.now(),
          retryCount: 0
        }
      ];

      localStorageMock.setItem('offlineActionQueue', JSON.stringify(savedQueue));

      const newQueue = new OfflineQueue({ autoSync: false });
      
      expect(newQueue.queue).toHaveLength(1);
      expect(newQueue.queue[0].id).toBe('test-id');
      
      newQueue.destroy();
    });

    it('should clean up old synced items', () => {
      const oldTimestamp = Date.now() - (8 * 24 * 60 * 60 * 1000); // 8 days ago
      const savedQueue = [
        {
          id: 'old-synced',
          type: 'test_action',
          url: '/api/test',
          method: 'POST',
          timestamp: oldTimestamp,
          syncedAt: oldTimestamp,
          retryCount: 0
        },
        {
          id: 'recent',
          type: 'test_action',
          url: '/api/test',
          method: 'POST',
          timestamp: Date.now(),
          retryCount: 0
        }
      ];

      localStorageMock.setItem('offlineActionQueue', JSON.stringify(savedQueue));

      const newQueue = new OfflineQueue({ autoSync: false });
      
      // Should only keep recent item
      expect(newQueue.queue).toHaveLength(1);
      expect(newQueue.queue[0].id).toBe('recent');
      
      newQueue.destroy();
    });
  });

  describe('Event System', () => {
    it('should emit events for queue operations', () => {
      let eventData = null;
      
      offlineQueue.on('actionQueued', (data) => {
        eventData = data;
      });

      const actionId = offlineQueue.addAction({
        type: 'test_action',
        url: '/api/test',
        method: 'POST'
      });

      expect(eventData).toBeDefined();
      expect(eventData.id).toBe(actionId);
      expect(eventData.type).toBe('test_action');
    });

    it('should emit events for sync operations', async () => {
      offlineQueue.isOnline = true;
      
      let syncStarted = false;
      let syncCompleted = false;
      
      offlineQueue.on('syncStarted', () => {
        syncStarted = true;
      });
      
      offlineQueue.on('syncCompleted', () => {
        syncCompleted = true;
      });

      offlineQueue.addAction({
        type: 'test_action',
        url: '/api/test',
        method: 'POST'
      });

      await offlineQueue.syncQueue();

      expect(syncStarted).toBe(true);
      expect(syncCompleted).toBe(true);
    });

    it('should emit events for failed actions', async () => {
      offlineQueue.isOnline = true;
      fetch.mockRejectedValue(new Error('Persistent error'));

      let failedData = null;
      
      offlineQueue.on('actionFailed', (data) => {
        failedData = data;
      });

      offlineQueue.addAction({
        type: 'test_action',
        url: '/api/test',
        method: 'POST'
      });

      // Fail twice to trigger failed event
      await offlineQueue.syncQueue();
      await offlineQueue.syncQueue();
      await offlineQueue.syncQueue();

      expect(failedData).toBeDefined();
      expect(failedData.action.type).toBe('test_action');
    });
  });

  describe('Notifications', () => {
    it('should show browser notifications when permission granted', () => {
      const showNotificationSpy = vi.spyOn(offlineQueue, 'showNotification');
      
      offlineQueue.addAction({
        type: 'test_action',
        url: '/api/test',
        method: 'POST'
      });

      expect(showNotificationSpy).toHaveBeenCalledWith('Action queued for sync', 'info');
    });

    it('should create toast notifications when no browser notification permission', () => {
      mockNotification.permission = 'denied';
      global.Notification = mockNotification;

      const newQueue = new OfflineQueue({ autoSync: false });
      
      newQueue.addAction({
        type: 'test_action',
        url: '/api/test',
        method: 'POST'
      });

      // Should create toast container and toast element
      expect(document.querySelector('.toast-container')).toBeTruthy();
      expect(document.querySelector('.toast')).toBeTruthy();
      
      newQueue.destroy();
    });
  });

  describe('Conflict Resolution', () => {
    it('should handle HTTP 409 conflicts', async () => {
      offlineQueue.isOnline = true;
      
      // Mock conflict response
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        text: () => Promise.resolve('Conflict detected')
      });

      offlineQueue.addAction({
        type: 'test_action',
        url: '/api/test',
        method: 'POST'
      });

      await offlineQueue.syncQueue();

      expect(offlineQueue.queue[0].lastError).toBe('HTTP 409: Conflict detected');
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      offlineQueue.addAction({
        type: 'test_action',
        url: '/api/test',
        method: 'POST'
      });

      expect(offlineQueue.queue.length).toBe(1);

      offlineQueue.destroy();

      expect(offlineQueue.queue.length).toBe(0);
    });
  });
});
