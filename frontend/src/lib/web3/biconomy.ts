import {
  BiconomySmartAccountV2,
  DEFAULT_ENTRYPOINT_ADDRESS,
  createBundler,
} from "@biconomy/account"
import {
  createWalletClient,
  custom,
  type WalletClient,
  type Address,
} from "viem"
import { bscTestnet } from "viem/chains"
import { biconomyConfig } from "./config"
import type { IProvider } from "@web3auth/base"

export const createSmartAccount = async (
  provider: IProvider
): Promise<BiconomySmartAccountV2> => {
  // Create wallet client from Web3Auth provider
  const walletClient = createWalletClient({
    chain: bscTestnet,
    transport: custom(provider),
  })

  // Get the EOA address
  const [eoaAddress] = await walletClient.getAddresses()

  // Create Bundler instance
  const bundler = await createBundler({
    bundlerUrl: biconomyConfig.bundlerUrl,
    chainId: biconomyConfig.chainId,
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
  })

  // Create Biconomy Smart Account
  const smartAccount = await BiconomySmartAccountV2.create({
    chainId: biconomyConfig.chainId,
    bundler: bundler,
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
    signer: walletClient,
  })

  return smartAccount
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
  const userOp = await smartAccount.buildUserOp([transaction])
  const userOpResponse = await smartAccount.sendUserOp(userOp)
  const transactionDetails = await userOpResponse.wait()

  return transactionDetails.receipt.transactionHash
}
