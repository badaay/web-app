/**
 * Toast Notification System - Usage Examples
 * 
 * This file demonstrates all available features of the enhanced toast system.
 * Reference this file when implementing toast notifications in modules.
 */

import { showToast, clearAllToasts, getQueueSize } from './toast.js';

// ═══════════════════════════════════════════════════════════════════════════
// BASIC USAGE (Backward Compatible)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Simple notifications - works exactly like before
 */
export function basicExamples() {
    // Success notification
    showToast('success', 'Data berhasil disimpan!');
    
    // Error notification
    showToast('error', 'Gagal menyimpan data');
    
    // Warning notification
    showToast('warning', 'Silakan periksa input');
    
    // Info notification
    showToast('info', 'Proses sedang berjalan...');
    
    // Custom duration (in milliseconds)
    showToast('error', 'Server error', 8000);
}

// ═══════════════════════════════════════════════════════════════════════════
// PLACEMENT OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Display toasts at different screen positions
 */
export function placementExamples() {
    // Top right (default)
    showToast('info', 'Top right position', {
        placement: 'top-right'
    });
    
    // Top left
    showToast('info', 'Top left position', {
        placement: 'top-left'
    });
    
    // Bottom right
    showToast('info', 'Bottom right position', {
        placement: 'bottom-right'
    });
    
    // Bottom left
    showToast('info', 'Bottom left position', {
        placement: 'bottom-left'
    });
    
    // Center (modal-like)
    showToast('warning', 'Centered notification - very important!', {
        placement: 'center',
        duration: 10000  // Longer duration for center
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOM STYLING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Customize appearance with custom icons, titles, and CSS classes
 */
export function customStylingExamples() {
    // Custom icon and title
    showToast('success', 'Customer registered successfully', {
        customIcon: 'bi-person-plus-fill',
        customTitle: 'Pelanggan Baru',
        customClass: 'shadow-xl'
    });
    
    // Override everything
    showToast('error', 'Database connection lost', {
        customIcon: 'bi-database-x',
        customTitle: 'Koneksi Error',
        customClass: 'fs-6'
    });
    
    // Work order specific notification
    showToast('info', 'WO-2603001 assigned to Ahmad', {
        customIcon: 'bi-clipboard-check',
        customTitle: 'Pekerjaan Ditugaskan'
    });
    
    // System maintenance
    showToast('warning', 'Maintenance window starts in 1 hour', {
        customIcon: 'bi-wrench',
        customTitle: 'Maintenance Notice',
        duration: 15000
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// QUEUE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Multiple toasts are automatically queued and displayed sequentially
 */
export function queueExamples() {
    // These will appear one after another
    showToast('success', 'First notification');
    showToast('info', 'Second notification');
    showToast('warning', 'Third notification');
    
    // Check queue size
    console.log(`Queue contains ${getQueueSize()} items`);
}

/**
 * Bypass queue for simultaneous display from different positions
 */
export function bypassQueueExample() {
    // These appear simultaneously because queue is disabled and they're in different positions
    showToast('info', 'Top right', {
        placement: 'top-right',
        queue: false
    });
    
    showToast('success', 'Bottom left', {
        placement: 'bottom-left',
        queue: false
    });
    
    showToast('warning', 'Center position', {
        placement: 'center',
        queue: false
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// ADVANCED OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Advanced features: callbacks, dismissibility, accessibility
 */
export function advancedExamples() {
    // Non-dismissible notification (auto-hide only)
    showToast('info', 'Processing... Please wait', {
        duration: 3000,
        dismissible: false,
        ariaLive: 'polite'
    });
    
    // Notification with callback (when dismissed)
    showToast('success', 'Saved!', {
        callback: () => {
            console.log('Toast was dismissed');
            // Perform action after dismissal
            refreshDataTable();
        }
    });
    
    // Polite announcement (less intrusive for screen readers)
    showToast('info', 'New data available', {
        ariaLive: 'polite'
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// PRACTICAL USE CASES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Form validation feedback
 */
export function formValidationExample() {
    const errors = {
        name: 'Nama wajib diisi',
        email: 'Email tidak valid',
        phone: 'Nomor HP wajib diisi'
    };
    
    for (const [field, error] of Object.entries(errors)) {
        showToast('warning', `${field}: ${error}`, {
            customIcon: 'bi-exclamation-circle',
            placement: 'top-left',
            duration: 4000
        });
    }
}

/**
 * Async operation feedback (e.g., API call)
 */
export async function asyncOperationExample() {
    try {
        // Show loading state
        showToast('info', 'Menyimpan data...', {
            dismissible: false,
            duration: 30000  // Won't auto-hide if callback doesn't end it
        });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Replace with success
        clearAllToasts();
        showToast('success', 'Data berhasil disimpan!', {
            callback: () => console.log('Operation complete')
        });
        
    } catch (error) {
        clearAllToasts();
        showToast('error', `Error: ${error.message}`, {
            duration: 7000,
            placement: 'bottom-left'
        });
    }
}

/**
 * Multi-step process feedback
 */
export function multiStepExample() {
    const steps = [
        'Validasi data...',
        'Upload ke server...',
        'Proses di database...',
        'Selesai!'
    ];
    
    steps.forEach((step, index) => {
        setTimeout(() => {
            showToast('info', step, {
                customTitle: `Langkah ${index + 1}/${steps.length}`,
                customIcon: 'bi-hourglass-split',
                duration: 3000
            });
        }, index * 2000);
    });
}

/**
 * Work order notifications
 */
export function workOrderExample() {
    // New WO created
    showToast('success', 'WO-2603001 berhasil dibuat', {
        customIcon: 'bi-file-earmark-check',
        customTitle: 'Antrian Baru',
        placement: 'bottom-right'
    });
    
    // WO status changed
    setTimeout(() => {
        showToast('info', 'Status berubah menjadi OPEN', {
            customIcon: 'bi-arrow-repeat',
            customTitle: 'WO-2603001 Updated',
            placement: 'bottom-right'
        });
    }, 2000);
}

/**
 * Clear all toasts at once
 */
export function clearExample() {
    // Add many toasts
    for (let i = 1; i <= 5; i++) {
        showToast('info', `Notification ${i}`, { queue: false });
    }
    
    // Clear all after 3 seconds
    setTimeout(() => {
        clearAllToasts();
    }, 3000);
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS (Utility functions for common patterns)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Show supabase error in user-friendly format
 */
export function showSupabaseError(error, context = 'Operation') {
    if (error?.message?.includes('unique')) {
        showToast('warning', 'Data sudah terdaftar di sistem', {
            customIcon: 'bi-exclamation-triangle'
        });
    } else if (error?.message?.includes('permission')) {
        showToast('error', 'Anda tidak memiliki akses untuk aksi ini', {
            customIcon: 'bi-lock-fill'
        });
    } else {
        showToast('error', `${context} gagal: ${error?.message || 'Unknown error'}`, {
            duration: 7000
        });
    }
}

/**
 * Confirm action with toast (alternative to alert)
 */
export function confirmWithToast(message, onConfirm) {
    showToast('warning', message, {
        customTitle: 'Konfirmasi',
        customIcon: 'bi-question-circle',
        placement: 'center',
        dismissible: true,
        callback: onConfirm
    });
}

/**
 * Placeholder function (replace with actual implementation)
 */
function refreshDataTable() {
    console.log('Data table refreshed');
}
