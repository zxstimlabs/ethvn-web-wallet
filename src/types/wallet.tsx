import type { Keystore } from 'ox';

export type WalletKeystore = Keystore.Keystore & {
  meta: {
    type: string;
    note: string;
    formatVersion?: string;
  };
  name: string;
  address: string;
};