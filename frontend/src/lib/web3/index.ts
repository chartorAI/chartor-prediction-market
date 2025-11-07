// Authentication
export { AuthProvider, useAuth } from "./AuthProvider"
export { WagmiProvider } from "./WagmiProvider"

// Web3Auth
export {
  getWeb3Auth,
  initWeb3Auth,
  loginWithWeb3Auth,
  logoutWeb3Auth,
  getWeb3AuthProvider,
  isWeb3AuthConnected,
} from "./web3auth"

// Biconomy
export {
  createSmartAccount,
  getSmartAccountAddress,
  sendTransaction,
} from "./biconomy"

// Configuration
export {
  web3AuthConfig,
  chainConfig,
  biconomyConfig,
  contractAddresses,
} from "./config"

export { wagmiConfig } from "./wagmi"
