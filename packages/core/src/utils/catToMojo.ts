import BigNumber from 'bignumber.js';
import Unit from '../constants/Unit';
import moonFormatter from './moonFormatter';

export default function catToMojo(cat: string | number | BigNumber): BigNumber {
  return moonFormatter(cat, Unit.CAT)
    .to(Unit.MOJO)
    .toBigNumber();
}
