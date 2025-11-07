import { useCallback } from "react"
import { type Address, encodeFunctionData } from "viem"
import { useAuthStore } from "@/stores/authStore"
import { sendTransaction } from "../web3/biconomy"
import type { BiconomySmartAccountV2 } from "@biconomy/account"

interface UseContractReturn {
  writeContract: (params: {
    address: Address
    abi: any[]
    functionName: string
    args?: any[]
    value?: bigint
  }) => Promise<string>
  isConnected: boolean
  smartAccount: BiconomySmartAccountV2 | null
}

export const useContract = (): UseContractReturn => {
  const { smartAccount, isAuthenticated } = useAuthStore()

  const writeContract = useCallback(
    async ({
      address,
      abi,
      functionName,
      args = [],
      value,
    }: {
      address: Address
      abi: any[]
      functionName: string
      args?: any[]
      value?: bigint
    }): Promise<string> => {
      if (!smartAccount) {
        throw new Error("Smart Account not initialized")
      }

      // Encode the function call
      const data = encodeFunctionData({
        abi,
        functionName,
        args,
      })

      // Send transaction through Smart Account
      const txHash = await sendTransaction(smartAccount, {
        to: address,
        data,
        value,
      })

      return txHash
    },
    [smartAccount]
  )

  return {
    writeContract,
    isConnected: isAuthenticated,
    smartAccount,
  }
}
