import BigNumber from 'bignumber.js';
import Unit from '../constants/Unit';
import moonFormatter from './moonFormatter';

export default function mojoToMoon(mojo: string | number | BigNumber): BigNumber {
  return moonFormatter(mojo, Unit.MOJO)
    .to(Unit.MOON)
    .toBigNumber();
}
