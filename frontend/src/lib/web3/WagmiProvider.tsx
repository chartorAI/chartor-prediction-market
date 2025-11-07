"use client"

import { type ReactNode } from "react"
import { WagmiProvider as WagmiProviderBase } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { wagmiConfig } from "./wagmi"

const queryClient = new QueryClient()

export function WagmiProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProviderBase config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProviderBase>
  )
}
