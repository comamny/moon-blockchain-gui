import { useMemo } from 'react';
import type { Wallet } from '@moon/api';
import { WalletType } from '@moon/api';
import BigNumber from 'bignumber.js';
import { mojoToCATLocaleString, mojoToMoonLocaleString, useLocale } from '@moon/core';

export default function useWalletHumanValue(wallet: Wallet, value?: string | number | BigNumber, unit?: string): string {
  const [locale] = useLocale();

  return useMemo(() => {
    if (wallet && value !== undefined) {
      const localisedValue = wallet.type === WalletType.CAT
        ? mojoToCATLocaleString(value, locale)
        : mojoToMoonLocaleString(value, locale);

      return `${localisedValue} ${unit}`;
    }

    return '';
  }, [wallet, value, unit, locale]);
}
