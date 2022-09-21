import React, { useMemo } from 'react';
import { Trans } from '@lingui/macro';
import { useCurrencyCode, mojoToMoonLocaleString, CardSimple, useLocale } from '@moon/core';
import { useGetFarmedAmountQuery } from '@moon/api-react';

export default function FarmCardTotalMoonFarmed() {
  const currencyCode = useCurrencyCode();
  const [locale] = useLocale();
  const { data, isLoading, error } = useGetFarmedAmountQuery();

  const farmedAmount = data?.farmedAmount;

  const totalMoonFarmed = useMemo(() => {
    if (farmedAmount !== undefined) {
      return (
        <>
          {mojoToMoonLocaleString(farmedAmount, locale)}
          &nbsp;
          {currencyCode}
        </>
      );
    }
  }, [farmedAmount, locale, currencyCode]);

  return (
    <CardSimple
      title={<Trans>Total Moon Farmed</Trans>}
      value={totalMoonFarmed}
      loading={isLoading}
      error={error}
    />
  );
}
