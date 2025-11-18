"use client"

import { Toaster as HotToaster, toast as hotToast } from "react-hot-toast"

export const Toaster = () => {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "1rem",
          color: "#ffffff",
          padding: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        },
        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: "#ffffff",
          },
          style: {
            border: "1px solid rgba(16, 185, 129, 0.3)",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#ffffff",
          },
          style: {
            border: "1px solid rgba(239, 68, 68, 0.3)",
          },
        },
        loading: {
          iconTheme: {
            primary: "#a855f7",
            secondary: "#ffffff",
          },
        },
      }}
    />
  )
}

// Custom toast utilities
export const toast = {
  success: (message: string) => {
    hotToast.success(message)
  },
  error: (message: string) => {
    hotToast.error(message)
  },
  loading: (message: string) => {
    return hotToast.loading(message)
  },
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string
      error: string
    }
  ) => {
    return hotToast.promise(promise, messages)
  },
  custom: (message: string) => {
    hotToast(message)
  },
  dismiss: (toastId?: string) => {
    hotToast.dismiss(toastId)
  },
}

// Transaction toast helper
export const transactionToast = {
  pending: (txHash: string) => {
    return toast.loading(`Transaction pending: ${txHash.slice(0, 10)}...`)
  },
  success: (txHash: string, chainId: number = 97) => {
    const bscScanUrl =
      chainId === 97
        ? `https://testnet.bscscan.com/tx/${txHash}`
        : `https://bscscan.com/tx/${txHash}`
    const shortHash = `${txHash.slice(0, 10)}...${txHash.slice(-8)}`

    hotToast.success(
      (t) => (
        <div className="flex flex-col gap-1">
          <div className="font-semibold">Trade successful!</div>
          <a
            href={bscScanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 underline cursor-pointer"
            onClick={() => hotToast.dismiss(t.id)}
          >
            View on BSCScan: {shortHash}
          </a>
        </div>
      ),
      {
        duration: 6000,
      }
    )
  },
  error: (error: string) => {
    toast.error(`Transaction failed: ${error}`)
  },
}
