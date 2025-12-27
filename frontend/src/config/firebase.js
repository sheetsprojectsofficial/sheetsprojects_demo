/**
 * DEPRECATED: This file is kept for backwards compatibility only.
 * Firebase is now initialized dynamically via TenantContext.
 *
 * For authentication, use:
 * - useAuth() hook from AuthContext
 * - useTenant() hook to get tenantAuth directly
 *
 * DO NOT import { auth } from this file in new code.
 */

// Export null - Firebase is initialized by TenantContext
export const auth = null;
export default null; 