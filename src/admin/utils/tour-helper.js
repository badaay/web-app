/**
 * Tour Helper — Reusable guided tour utilities
 * Uses Shepherd.js (dynamic import) to keep bundle light.
 * Manages first-time detection and progress persistence via localStorage.
 */

const STORAGE_KEY_PREFIX = 'sifatih_tour_';

/**
 * Check if a tour has been completed before.
 * @param {string} tourId - Unique tour identifier (e.g. 'payroll')
 * @returns {boolean}
 */
export function isTourCompleted(tourId) {
    return localStorage.getItem(STORAGE_KEY_PREFIX + tourId) === 'done';
}

/**
 * Mark a tour as completed.
 * @param {string} tourId
 */
export function markTourCompleted(tourId) {
    localStorage.setItem(STORAGE_KEY_PREFIX + tourId, 'done');
}

/**
 * Reset tour state (for re-triggering).
 * @param {string} tourId
 */
export function resetTour(tourId) {
    localStorage.removeItem(STORAGE_KEY_PREFIX + tourId);
}

/**
 * Start a Shepherd.js tour with the given steps.
 * Dynamically imports shepherd.js to keep initial bundle small.
 *
 * @param {string} tourId - Unique ID for persistence
 * @param {Array<{element: string, title: string, text: string, attachTo?: object}>} steps
 * @param {object} [options] - Shepherd tour options
 * @returns {Promise<void>}
 */
export async function startTour(tourId, steps, options = {}) {
    const shepherdModule = await import('shepherd.js');
    await import('shepherd.js/dist/css/shepherd.css');

    const Shepherd = shepherdModule.default || shepherdModule;

    const tour = new Shepherd.Tour({
        defaultStepOptions: {
            classes: 'shepherd-theme-hud',
            scrollTo: true,
            tippyOptions: {
                maxWidth: 320
            },
            ...options.defaultStepOptions
        },
        useModalOverlay: true,
        ...options
    });

    steps.forEach((step) => {
        const stepConfig = {
            title: step.title,
            text: step.text,
            attachTo: step.attachTo || undefined,
            buttons: [
                {
                    text: 'Lewati',
                    action: tour.cancel,
                    classes: 'shepherd-button-secondary'
                },
                {
                    text: 'Lanjut →',
                    action: tour.next
                }
            ]
        };

        if (step.element) {
            stepConfig.element = step.element;
        }

        tour.addStep(stepConfig);
    });

    // Last step gets a "Selesai" button instead of "Lanjut"
    const lastStep = tour.steps[tour.steps.length - 1];
    if (lastStep) {
        lastStep.options.buttons = [
            {
                text: 'Selesai ✓',
                action: tour.complete,
                classes: 'shepherd-button-primary'
            }
        ];
    }

    tour.on('complete', () => {
        markTourCompleted(tourId);
    });

    tour.on('cancel', () => {
        // User skipped — still mark as seen so it doesn't auto-trigger again
        markTourCompleted(tourId);
    });

    tour.start();
}

/**
 * Auto-start tour only if first-time (not completed before).
 * @param {string} tourId
 * @param {Array} steps
 * @param {object} [options]
 */
export async function autoStartTour(tourId, steps, options = {}) {
    if (!isTourCompleted(tourId)) {
        // Small delay to let the DOM render before attaching
        setTimeout(() => startTour(tourId, steps, options), 800);
    }
}
