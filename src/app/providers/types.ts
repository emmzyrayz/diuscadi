import { ReactNode } from 'react';

export interface Provider {
  component: React.ComponentType<{ children: ReactNode }>;
  props?: Record<string, unknown>;
}

export interface ProviderConfig {
  id: string;
  provider: Provider;
  enabled?: boolean;
}