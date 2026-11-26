import { atomWithStorage } from "jotai/utils";
import type { WalletKeystore } from "@/types/wallet";

export const activeWalletAtom = atomWithStorage<WalletKeystore | null>("activeWallet", null);