"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import {
  initWeb3Auth,
  loginWithWeb3Auth,
  logoutWeb3Auth,
  isWeb3AuthConnected,
} from "./web3auth"
import { createSmartAccount, getSmartAccountAddress } from "./biconomy"
import { useAuthStore } from "@/stores/authStore"
import type { BiconomySmartAccountV2 } from "@biconomy/account"
import type { IProvider } from "@web3auth/base"

interface AuthContextType {
  login: () => Promise<void>
  logout: () => Promise<void>
  isInitialized: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const {
    setAuthenticated,
    setLoading,
    setError,
    logout: logoutStore,
  } = useAuthStore()

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        await initWeb3Auth()

        // Check if already connected
        if (isWeb3AuthConnected()) {
          await restoreSession()
        }

        setIsInitialized(true)
      } catch (error: any) {
        console.error("Failed to initialize Web3Auth:", {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          stack: error?.stack,
          raw: error,
        })
        setError(error?.message || "Failed to initialize authentication")
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const restoreSession = async () => {
    try {
      const provider = await loginWithWeb3Auth()
      if (provider) {
        const smartAccount = await createSmartAccount(provider)
        const address = await getSmartAccountAddress(smartAccount)
        setAuthenticated(address, smartAccount, provider)
      }
    } catch (error: any) {
      console.error("Failed to restore session:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        stack: error?.stack,
        raw: error,
      })
    }
  }

  const login = async () => {
    try {
      setLoading(true)
      setError(null)

      const provider = await loginWithWeb3Auth()
      if (!provider) {
        throw new Error("Failed to get provider from Web3Auth")
      }

      // Create Smart Account
      const smartAccount = await createSmartAccount(provider)
      const address = await getSmartAccountAddress(smartAccount)

      setAuthenticated(address, smartAccount, provider)
    } catch (error: any) {
      console.error("Login failed:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        stack: error?.stack,
        raw: error,
      })
      setError(error?.message || "Login failed")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await logoutWeb3Auth()
      logoutStore()
    } catch (error: any) {
      console.error("Logout failed:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        stack: error?.stack,
        raw: error,
      })
      setError(error?.message || "Logout failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ login, logout, isInitialized }}>
      {children}
    </AuthContext.Provider>
  )
}
