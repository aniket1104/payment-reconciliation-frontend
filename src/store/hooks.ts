/**
 * Typed Redux Hooks
 *
 * Pre-typed versions of useDispatch and useSelector for TypeScript.
 * Use these throughout the app instead of plain `useDispatch` and `useSelector`.
 */

import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

/**
 * Typed dispatch hook
 * Use this instead of plain `useDispatch`
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

/**
 * Typed selector hook
 * Use this instead of plain `useSelector`
 */
export const useAppSelector = useSelector.withTypes<RootState>();
