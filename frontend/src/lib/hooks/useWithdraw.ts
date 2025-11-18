import { useState } from "react"
import { useAuthStore } from "@/stores/authStore"
import { sendTransaction } from "@/lib/web3/biconomy"
import { toast } from "react-hot-toast"
import { parseEther } from "ethers"

export function useWithdraw() {
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const { smartAccount, smartAccountAddress } = useAuthStore()

  const withdraw = async (toAddress: string, amount: string) => {
    if (!smartAccount) {
      toast.error("Please connect your wallet first")
      return { success: false }
    }

    if (!toAddress || !amount) {
      toast.error("Please provide address and amount")
      return { success: false }
    }

    try {
      setIsWithdrawing(true)

      if (!toAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        toast.error("Invalid address format")
        return { success: false }
      }

      const amountWei = parseEther(amount)

      console.log("Withdrawing:", {
        from: smartAccountAddress,
        to: toAddress,
        amount: amount,
        amountWei: amountWei.toString(),
      })

      const txHash = await sendTransaction(smartAccount, {
        to: toAddress as `0x${string}`,
        data: "0x",
        value: amountWei,
      })

      console.log("Withdrawal successful:", txHash)
      toast.success(`Withdrawal successful! ${amount} BNB sent`)

      return { success: true, txHash }
    } catch (error: any) {
      console.error("Withdrawal failed:", error)
      const errorMessage =
        error?.message || "Failed to withdraw. Please try again."
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsWithdrawing(false)
    }
  }

  return {
    withdraw,
    isWithdrawing,
  }
}
