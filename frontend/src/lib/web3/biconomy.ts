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

    // Validate Biconomy configuration
    if (!biconomyConfig.bundlerUrl) {
      throw new Error("Biconomy bundler URL is not configured")
    }

    console.log("Creating ethers provider from Web3Auth...")

    // Create ethers provider from Web3Auth provider
    // Using ethers v6 BrowserProvider API
    const ethersProvider = new ethers.BrowserProvider(provider as any)

    console.log("Getting signer...")

    // Get the signer from ethers provider
    const signer = await ethersProvider.getSigner()

    // Get the address to verify connection
    const address = await signer.getAddress()
    console.log("Creating smart account for address:", address)

    // Create Bundler instance
    const bundler = await createBundler({
      bundlerUrl: biconomyConfig.bundlerUrl,
      chainId: biconomyConfig.chainId,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
    })

    console.log("Creating Biconomy Smart Account...")

    // Create Biconomy Smart Account using ethers signer
    // This is the correct way according to official Biconomy documentation
    const smartAccount = await BiconomySmartAccountV2.create({
      chainId: biconomyConfig.chainId,
      bundler: bundler,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
      signer: signer, // ethers signer, not viem wallet client
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

    // Log additional context for debugging
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

    // Build the transaction object for Biconomy
    const tx = {
      to: transaction.to,
      data: transaction.data,
      value: transaction.value || BigInt(0),
    }

    console.log("Building user operation...")

    // Build user operation
    const userOp = await smartAccount.buildUserOp([tx])

    console.log("User operation built:", {
      sender: userOp.sender,
      nonce: userOp.nonce?.toString(),
      callGasLimit: userOp.callGasLimit?.toString(),
    })

    console.log("Sending user operation...")

    // Send user operation
    const userOpResponse = await smartAccount.sendUserOp(userOp)

    console.log("User operation sent, waiting for confirmation...")

    // Wait for transaction to be mined
    const transactionDetails = await userOpResponse.wait()

    console.log("Transaction confirmed:", {
      hash: transactionDetails.receipt.transactionHash,
      status: transactionDetails.success,
    })

    return transactionDetails.receipt.transactionHash
  } catch (error: any) {
    // Log the error comprehensively
    console.error("=== TRANSACTION FAILED ===")
    console.error("Error object:", error)

    // Try to stringify with error handling for circular references
    try {
      console.error("Error stringified:", JSON.stringify(error, null, 2))
    } catch (e) {
      console.error("Error stringification failed (circular reference)")
    }

    console.error("Error keys:", Object.keys(error || {}))
    console.error("Error toString:", error?.toString())

    // Log specific properties
    console.error("Error properties:", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      reason: error?.reason,
      name: error?.name,
    })

    // Deep dive into the 'data' property
    if (error?.data) {
      console.error("=== ERROR DATA DETAILS ===")
      console.error("Data type:", typeof error.data)
      console.error("Data keys:", Object.keys(error.data))

      try {
        console.error("Data stringified:", JSON.stringify(error.data, null, 2))
      } catch (e) {
        console.error("Data stringification failed")
      }

      // Check for nested error information
      if (error.data.cause) {
        console.error("Data cause:", error.data.cause)
      }
      if (error.data.message) {
        console.error("Data message:", error.data.message)
      }
    }

    console.error("Transaction that failed:", transaction)
    console.error("=========================")

    // Extract the most meaningful error message
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

    // Create enhanced error with all context
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
    const balance = await provider.request({
      method: "eth_getBalance",
      params: [address, "latest"],
    })
    return BigInt(balance as string)
  } catch (error) {
    console.error("Failed to get balance:", error)
    return BigInt(0)
  }
}
