import type { Bank } from '@/services/types';

/** Banks a typed account number can belong to. Static reference data shipped with the app. */
export const BANKS: Bank[] = [
  { id: 'maybank', name: 'Maybank' },
  { id: 'cimb', name: 'CIMB Bank' },
  { id: 'public', name: 'Public Bank' },
  { id: 'rhb', name: 'RHB Bank' },
  { id: 'hongleong', name: 'Hong Leong Bank' },
  { id: 'ambank', name: 'AmBank' },
  { id: 'bankislam', name: 'Bank Islam' },
];
