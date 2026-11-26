import { sepolia } from "wagmi/chains";

/**
 * The one chain this wallet runs on: Sepolia. It is a testnet, so coins
 * have no value and learners can try everything without risk.
 * To move to another chain, change it here; every component reads CHAIN_ID.
 */
export const CHAIN = sepolia;
export const CHAIN_ID = CHAIN.id;

/** RPC used until the user picks a custom one in settings. */
export const DEFAULT_RPC_URL = "https://rpc.zxstim.com/rpc/sepolia";
