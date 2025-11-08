import { Web3Auth } from "@web3auth/modal"
import { IProvider } from "@web3auth/base"
import { web3AuthConfig } from "./config"

let web3AuthInstance: Web3Auth | null = null

export const getWeb3Auth = (): Web3Auth => {
  if (!web3AuthInstance) {
    if (!web3AuthConfig.clientId) {
      throw new Error(
        "Web3Auth Client ID is not configured. Please set NEXT_PUBLIC_WEB3AUTH_CLIENT_ID in your .env file"
      )
    }

    web3AuthInstance = new Web3Auth({
      clientId: web3AuthConfig.clientId,
      web3AuthNetwork: web3AuthConfig.web3AuthNetwork,
      uiConfig: web3AuthConfig.uiConfig,
    })
  }
  return web3AuthInstance
}

export const initWeb3Auth = async (): Promise<Web3Auth> => {
  try {
    const web3auth = getWeb3Auth()

    if (!web3auth) {
      throw new Error("Failed to create Web3Auth instance")
    }

    await web3auth.init()
    return web3auth
  } catch (error: any) {
    console.error("Web3Auth initialization error:", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      name: error?.name,
    })
    throw error
  }
}

export const loginWithWeb3Auth = async (): Promise<IProvider | null> => {
  try {
    const web3auth = getWeb3Auth()

    if (!web3auth) {
      throw new Error("Web3Auth instance not initialized")
    }

    const provider = await web3auth.connect()

    if (!provider) {
      throw new Error("No provider returned from Web3Auth")
    }

    return provider
  } catch (error: any) {
    console.error("Web3Auth login error:", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      name: error?.name,
    })
    throw error
  }
}

export const logoutWeb3Auth = async (): Promise<void> => {
  const web3auth = getWeb3Auth()
  await web3auth.logout()
}

export const getWeb3AuthProvider = (): IProvider | null => {
  const web3auth = getWeb3Auth()
  return web3auth.provider
}

export const isWeb3AuthConnected = (): boolean => {
  const web3auth = getWeb3Auth()
  return web3auth.connected
}
