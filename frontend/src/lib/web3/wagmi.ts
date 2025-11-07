import { createConfig, http } from "wagmi"
import { bscTestnet } from "wagmi/chains"
import { chainConfig } from "./config"

export const wagmiConfig = createConfig({
  chains: [bscTestnet],
  transports: {
    [bscTestnet.id]: http(chainConfig.rpcUrl),
  },
})
