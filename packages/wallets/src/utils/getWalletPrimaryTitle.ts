import { WalletType } from '@moon/api';
import type { Wallet } from '@moon/api';

export default function getWalletPrimaryTitle(wallet: Wallet): string {
  switch (wallet.type) {
    case WalletType.STANDARD_WALLET:
      return 'Moon';
    default:
      return wallet.meta?.name ?? wallet.name;
  }
}
