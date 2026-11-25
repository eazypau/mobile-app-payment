import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { isApiErrorCode, unwrap } from '@/services/api-error';
import { getAccount, getRecipients, lookupAccount, transfer } from '@/services/mock-api';
import type { TransferRequest } from '@/services/types';
import { isAccountNumberFormat } from '@/utils/recipient';

/**
 * One place for every server call. Screens that use the same hook share the
 * same cache entry, so Home and Send can never show different balances.
 */

export const queryKeys = {
  account: ['account'] as const,
  recipients: ['recipients'] as const,
  lookup: (bankId: string | null, accountNumber: string) => ['lookup', bankId, accountNumber] as const,
};

export function useAccount() {
  return useQuery({
    queryKey: queryKeys.account,
    queryFn: async () => unwrap(await getAccount()),
  });
}

export function useRecipients() {
  return useQuery({
    queryKey: queryKeys.recipients,
    queryFn: async () => unwrap(await getRecipients()),
  });
}

/** Runs only once a bank is chosen and the number has a plausible length. */
export function useAccountLookup(bankId: string | null, accountNumber: string) {
  return useQuery({
    queryKey: queryKeys.lookup(bankId, accountNumber),
    queryFn: async () => unwrap(await lookupAccount(bankId ?? '', accountNumber)),
    enabled: bankId !== null && isAccountNumberFormat(accountNumber),
    // "Not found" won't change on retry; a network blip might.
    retry: (failureCount, error) => isApiErrorCode(error, 'NETWORK') && failureCount < 1,
    // A name enquiry costs the bank money; reuse results for 5 minutes.
    staleTime: 5 * 60 * 1000,
  });
}

/** Moves money. The draft already carries its idempotency key. */
export function useSendTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: TransferRequest) => unwrap(await transfer(request)),
    // Never retry money movement automatically. The user retries on purpose,
    // with the same idempotency key, so a retry can't pay twice.
    retry: false,
    // Success or failure, the balance may have changed: refetch it from the server.
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.account }),
  });
}
