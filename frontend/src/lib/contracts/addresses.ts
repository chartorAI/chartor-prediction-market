// Contract addresses for different networks

export type ContractAddresses = {
  predictionMarket: `0x${string}`
  liquidityMarket: `0x${string}`
}

// BNB Testnet addresses
export const BNB_TESTNET_ADDRESSES: ContractAddresses = {
  predictionMarket:
    "0x145f0B7c4777D05C5326DE723c9087E1cd0C8C68" as `0x${string}`,
  liquidityMarket:
    "0xf6686a498d6FF970380d05946Cf10701125Fd2B0" as `0x${string}`,
}

// Get addresses based on chain ID
export function getContractAddresses(chainId: number): ContractAddresses {
  switch (chainId) {
    case 97: // BNB Testnet
      return BNB_TESTNET_ADDRESSES
    default:
      // Default to BNB Testnet
      return BNB_TESTNET_ADDRESSES
  }
}
