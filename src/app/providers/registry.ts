import { ProviderConfig } from './types';
import { NotFoundProvider } from '@/context/notFoundContext';

/**
 * Provider Registry
 * Order matters: providers are composed from top to bottom
 * Earlier providers wrap later ones
 */
export const providerRegistry: ProviderConfig[] = [
  // {
  //   id: 'auth',
  //   provider: {
  //     component: AuthProvider,
  //   },
  //   enabled: true,
  // },
  {
    id: 'notFound',
    provider: {
      component: NotFoundProvider,
    },
    enabled: true,
  },
];

/**
 * Get enabled providers
 */
export function getEnabledProviders(): ProviderConfig[] {
  return providerRegistry.filter((config) => config.enabled !== false);
}

/**
 * Get provider by ID
 */
export function getProviderById(id: string): ProviderConfig | undefined {
  return providerRegistry.find((config) => config.id === id);
}

/**
 * Check if provider is enabled
 */
export function isProviderEnabled(id: string): boolean {
  const provider = getProviderById(id);
  return provider?.enabled !== false;
}