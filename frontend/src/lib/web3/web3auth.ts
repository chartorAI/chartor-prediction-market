import { Web3Auth } from "@web3auth/modal"
import { IProvider } from "@web3auth/base"
import { web3AuthConfig } from "./config"

let web3AuthInstance: Web3Auth | null = null

export const getWeb3Auth = (): Web3Auth => {
  if (!web3AuthInstance) {
    web3AuthInstance = new Web3Auth({
      clientId: web3AuthConfig.clientId,
      web3AuthNetwork: web3AuthConfig.web3AuthNetwork,
      uiConfig: web3AuthConfig.uiConfig,
    })
  }
  return web3AuthInstance
}

export const initWeb3Auth = async (): Promise<Web3Auth> => {
  const web3auth = getWeb3Auth()
  await web3auth.init()
  return web3auth
}

export const loginWithWeb3Auth = async (): Promise<IProvider | null> => {
  const web3auth = getWeb3Auth()
  const provider = await web3auth.connect()
  return provider
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
