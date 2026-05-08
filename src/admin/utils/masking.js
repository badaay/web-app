/**
 * Utility for currency masking and formatting
 * Provides Rp prefix and thousand separators for Indonesian Rupiah
 */

export function initCurrencyMask(inputOrSelector) {
    const inputs = typeof inputOrSelector === 'string' 
        ? document.querySelectorAll(inputOrSelector) 
        : (inputOrSelector instanceof HTMLElement ? [inputOrSelector] : []);

    inputs.forEach(input => {
        if (!input) return;

        // Force text type to allow masking characters
        if (input.type === 'number') {
            input.type = 'text';
            input.inputMode = 'numeric'; // Optimization for mobile keyboards
        }

        // Internal formatter
        const formatValue = (val) => {
            const numeric = val.toString().replace(/[^0-9]/g, '');
            if (!numeric) return '';
            return 'Rp ' + parseInt(numeric).toLocaleString('id-ID');
        };

        // Initial formatting
        if (input.value) {
            input.value = formatValue(input.value);
        }

        input.addEventListener('input', (e) => {
            let cursorPosition = e.target.selectionStart;
            const originalValue = e.target.value;
            const originalLength = originalValue.length;
            
            const formatted = formatValue(originalValue);
            e.target.value = formatted;
            
            // Adjust cursor position to handle characters added/removed
            const newLength = formatted.length;
            const diff = newLength - originalLength;
            
            // If we're at the very beginning (before "Rp "), move after "Rp "
            let newPos = cursorPosition + diff;
            if (newPos < 3 && formatted.length >= 3) newPos = 3;
            
            e.target.setSelectionRange(newPos, newPos);
        });

        // Handle focus to ensure "Rp " is present if typing starts
        input.addEventListener('focus', (e) => {
            if (!e.target.value) {
                // Optional: show placeholder or initial Rp
            }
        });

        // Add custom property to get raw numeric value easily
        Object.defineProperty(input, 'rawValue', {
            get: function() {
                return parseInt(this.value.replace(/[^0-9]/g, '') || 0);
            },
            configurable: true
        });
    });
}

/**
 * Format a number as IDR currency string
 */
export function formatIDR(amount) {
    return 'Rp ' + (parseInt(amount) || 0).toLocaleString('id-ID');
}
