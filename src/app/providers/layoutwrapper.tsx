'use client';

import { ReactNode } from 'react';
import { getEnabledProviders } from './registry';
import { ProviderConfig } from './types';

interface LayoutWrapperProps {
  children: ReactNode;
}

/**
 * Compose providers recursively
 */
function composeProviders(
  providers: ProviderConfig[],
  children: ReactNode
): ReactNode {
  if (providers.length === 0) {
    return children;
  }

  const [firstProvider, ...restProviders] = providers;
  const { component: Component, props = {} } = firstProvider.provider;

  return (
    <Component {...props}>
      {composeProviders(restProviders, children)}
    </Component>
  );
}

/**
 * LayoutWrapper - Composes all enabled providers
 */
export function LayoutContextWrapper({ children }: LayoutWrapperProps) {
  const enabledProviders = getEnabledProviders();

  if (process.env.NODE_ENV === 'development') {
    console.log(
      '🔌 Enabled Providers:',
      enabledProviders.map((p) => p.id).join(' → ')
    );
  }

  return <>{composeProviders(enabledProviders, children)}</>;
}