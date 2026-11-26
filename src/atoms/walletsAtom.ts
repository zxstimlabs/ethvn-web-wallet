import { atomWithStorage } from "jotai/utils";
import type { WalletKeystore } from "@/types/wallet";

export const walletsAtom = atomWithStorage<Array<WalletKeystore>>("wallets", []);