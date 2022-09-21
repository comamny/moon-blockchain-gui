import BigNumber from 'bignumber.js';
import Unit from '../constants/Unit';
import moonFormatter from './moonFormatter';

export default function moonToMojo(moon: string | number | BigNumber): BigNumber {
  return moonFormatter(moon, Unit.MOON)
    .to(Unit.MOJO)
    .toBigNumber();
}
