import {
  BiconomySmartAccountV2,
  DEFAULT_ENTRYPOINT_ADDRESS,
  createBundler,
} from "@biconomy/account"
import { ethers } from "ethers"
import type { Address } from "viem"
import { biconomyConfig } from "./config"
import type { IProvider } from "@web3auth/base"

export const createSmartAccount = async (
  provider: IProvider
): Promise<BiconomySmartAccountV2> => {
  try {
    if (!provider) {
      throw new Error("Provider is required")
    }

    if (!biconomyConfig.bundlerUrl) {
      throw new Error("Biconomy bundler URL is not configured")
    }

    console.log("Creating ethers provider from Web3Auth...")

    const ethersProvider = new ethers.BrowserProvider(provider as any)

    console.log("Getting signer...")

    const signer = await ethersProvider.getSigner()

    const address = await signer.getAddress()
    console.log("Creating smart account for address:", address)

    // Create Bundler instance
    const bundler = await createBundler({
      bundlerUrl: biconomyConfig.bundlerUrl,
      chainId: biconomyConfig.chainId,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
    })

    console.log("Creating Biconomy Smart Account...")

    const smartAccount = await BiconomySmartAccountV2.create({
      chainId: biconomyConfig.chainId,
      bundler: bundler,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
      signer: signer,
    })

    console.log("Smart account created successfully")

    return smartAccount
  } catch (error: any) {
    console.error("Smart Account creation error:", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      name: error?.name,
      bundlerUrl: biconomyConfig.bundlerUrl,
      chainId: biconomyConfig.chainId,
    })

    if (error?.data) {
      console.error("Error data:", error.data)
    }

    throw error
  }
}

export const getSmartAccountAddress = async (
  smartAccount: BiconomySmartAccountV2
): Promise<Address> => {
  const address = await smartAccount.getAccountAddress()
  return address as Address
}

export const sendTransaction = async (
  smartAccount: BiconomySmartAccountV2,
  transaction: {
    to: Address
    data: `0x${string}`
    value?: bigint
  }
): Promise<string> => {
  try {
    console.log("Sending transaction:", {
      to: transaction.to,
      value: transaction.value?.toString() || "0",
      dataLength: transaction.data.length,
    })

    const tx = {
      to: transaction.to,
      data: transaction.data,
      value: transaction.value || BigInt(0),
    }

    console.log("Building user operation...")

    const userOp = await smartAccount.buildUserOp([tx])

    console.log("User operation built:", {
      sender: userOp.sender,
      nonce: userOp.nonce?.toString(),
      callGasLimit: userOp.callGasLimit?.toString(),
    })

    console.log("Sending user operation...")

    const userOpResponse = await smartAccount.sendUserOp(userOp)

    console.log("User operation sent, waiting for confirmation...")

    // Wait for the transaction to be mined
    const { receipt, success } = await userOpResponse.wait()

    console.log("=== TRANSACTION RESULT ===")
    console.log("Biconomy success flag:", success)
    console.log("Receipt status:", receipt.status)
    console.log("Transaction hash:", receipt.transactionHash)
    console.log("==========================")

    // CRITICAL: With Biconomy Smart Accounts, the UserOp transaction can succeed (status=1)
    // even if the internal contract call reverts. The 'success' flag from Biconomy
    // indicates whether the actual contract execution succeeded.
    // Handle both boolean and string representations
    const isContractSuccess = String(success) === "true"
    if (!isContractSuccess) {
      console.error(
        "❌ Contract execution reverted (insufficient balance or contract error)"
      )
      console.error("Receipt:", receipt)
      throw new Error(
        "Transaction failed. Insufficient balance or contract error."
      )
    }

    // Also check receipt status as a fallback
    const txStatus =
      typeof receipt.status === "string"
        ? parseInt(receipt.status, 16)
        : receipt.status

    if (txStatus === 0) {
      console.error("❌ Transaction reverted on-chain")
      console.error("Receipt:", receipt)
      throw new Error("Transaction failed on-chain.")
    }

    console.log("✅ Transaction successful!")
    return receipt.transactionHash
  } catch (error: any) {
    console.error("=== TRANSACTION FAILED ===")
    console.error("Error object:", error)

    try {
      console.error("Error stringified:", JSON.stringify(error, null, 2))
    } catch (e) {
      console.error("Error stringification failed (circular reference)")
    }

    console.error("Error keys:", Object.keys(error || {}))
    console.error("Error toString:", error?.toString())

    console.error("Error properties:", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      reason: error?.reason,
      name: error?.name,
    })

    if (error?.data) {
      console.error("=== ERROR DATA DETAILS ===")
      console.error("Data type:", typeof error.data)
      console.error("Data keys:", Object.keys(error.data))

      try {
        console.error("Data stringified:", JSON.stringify(error.data, null, 2))
      } catch (e) {
        console.error("Data stringification failed")
      }

      if (error.data.cause) {
        console.error("Data cause:", error.data.cause)
      }
      if (error.data.message) {
        console.error("Data message:", error.data.message)
      }
    }

    console.error("Transaction that failed:", transaction)
    console.error("=========================")

    let errorMessage = "Transaction failed - unknown error"

    if (error?.data?.cause?.message) {
      errorMessage = error.data.cause.message
    } else if (error?.data?.message) {
      errorMessage = error.data.message
    } else if (error?.message) {
      errorMessage = error.message
    } else if (error?.reason) {
      errorMessage = error.reason
    }

    const enhancedError = new Error(errorMessage) as any
    enhancedError.originalError = error
    enhancedError.transaction = transaction
    enhancedError.errorCode = error?.code
    enhancedError.errorData = error?.data

    throw enhancedError
  }
}

export const getBalance = async (
  provider: IProvider,
  address: Address
): Promise<bigint> => {
  try {
    console.log("getBalance called for address:", address)

    const rpcUrl =
      process.env.NEXT_PUBLIC_RPC_URL ||
      "https://data-seed-prebsc-1-s1.binance.org:8545/"
    console.log("Using RPC URL:", rpcUrl)

    const directProvider = new ethers.JsonRpcProvider(rpcUrl)

    // Verify network
    const network = await directProvider.getNetwork()
    console.log("Network:", {
      chainId: network.chainId.toString(),
      name: network.name,
    })

    const balance = await directProvider.getBalance(address)
    console.log("Balance from ethers:", balance.toString())
    console.log("Balance in BNB:", ethers.formatEther(balance))

    return balance
  } catch (error) {
    console.error("Failed to get balance:", error)
    return BigInt(0)
  }
}
