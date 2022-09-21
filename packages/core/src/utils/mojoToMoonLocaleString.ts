import BigNumber from 'bignumber.js';
import Unit from '../constants/Unit';
import moonFormatter from './moonFormatter';

export default function mojoToMoonLocaleString(mojo: string | number | BigNumber, locale?: string) {
  return moonFormatter(mojo, Unit.MOJO)
    .to(Unit.MOON)
    .toLocaleString(locale);
}
