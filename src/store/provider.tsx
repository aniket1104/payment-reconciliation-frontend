'use client';

/**
 * Redux Provider Component
 *
 * Client-side wrapper for Redux store in Next.js App Router.
 * Must be marked as 'use client' since Redux uses React context.
 */

import { Provider } from 'react-redux';
import { store } from './index';

interface ReduxProviderProps {
  children: React.ReactNode;
}

export function ReduxProvider({ children }: ReduxProviderProps) {
  return <Provider store={store}>{children}</Provider>;
}

export default ReduxProvider;
