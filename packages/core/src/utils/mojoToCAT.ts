import BigNumber from 'bignumber.js';
import Unit from '../constants/Unit';
import moonFormatter from './moonFormatter';

export default function mojoToCAT(mojo: string | number | BigNumber): BigNumber {
  return moonFormatter(mojo, Unit.MOJO)
    .to(Unit.CAT)
    .toBigNumber();
}
