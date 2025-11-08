// Contract addresses for different networks

export type ContractAddresses = {
  predictionMarket: `0x${string}`
  liquidityMarket: `0x${string}`
}

// BNB Testnet addresses
export const BNB_TESTNET_ADDRESSES: ContractAddresses = {
  predictionMarket: "0x2A5D9E8A416e889BdCA0913fE04426E484Cb576c",
  liquidityMarket: "0x532EFA808095B01BB72FadE65A0697881de0fE14",
}

// Localhost addresses (for development)
export const LOCALHOST_ADDRESSES: ContractAddresses = {
  predictionMarket: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  liquidityMarket: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
}

// Get addresses based on chain ID
export function getContractAddresses(chainId: number): ContractAddresses {
  switch (chainId) {
    case 97: // BNB Testnet
      return BNB_TESTNET_ADDRESSES
    case 31337: // Localhost
    case 1337:
      return LOCALHOST_ADDRESSES
    default:
      // Default to BNB Testnet
      return BNB_TESTNET_ADDRESSES
  }
}
