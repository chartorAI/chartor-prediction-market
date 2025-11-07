import { useEffect, useState } from "react"
import { type Address, createPublicClient, http } from "viem"
import { bscTestnet } from "viem/chains"
import { chainConfig } from "../web3/config"

const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(chainConfig.rpcUrl),
})

interface UseContractReadParams {
  address: Address
  abi: any[]
  functionName: string
  args?: any[]
  enabled?: boolean
  watch?: boolean
  watchInterval?: number
}

interface UseContractReadReturn<T> {
  data: T | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useContractRead<T = any>({
  address,
  abi,
  functionName,
  args = [],
  enabled = true,
  watch = false,
  watchInterval = 10000,
}: UseContractReadParams): UseContractReadReturn<T> {
  const [data, setData] = useState<T | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    if (!enabled) return

    try {
      setIsLoading(true)
      setError(null)

      const result = await publicClient.readContract({
        address,
        abi,
        functionName,
        args,
      })

      setData(result as T)
    } catch (err) {
      console.error(`Error reading contract ${functionName}:`, err)
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    if (watch) {
      const interval = setInterval(fetchData, watchInterval)
      return () => clearInterval(interval)
    }
  }, [
    address,
    functionName,
    JSON.stringify(args),
    enabled,
    watch,
    watchInterval,
  ])

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  }
}
