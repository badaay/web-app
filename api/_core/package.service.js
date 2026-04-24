/**
 * Re-export barrel for services — used by API handlers.
 * Vercel Edge Functions resolve imports relative to api/, so this bridge
 * allows handlers to import from '../_core/package.service.js' etc.
 */
export { listPackages, createPackage, updatePackage, deletePackage } from '../../src/core/services/package.service.js';
