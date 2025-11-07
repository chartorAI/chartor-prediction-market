import { formatDistanceToNow } from "date-fns"

/**
 * Truncate an Ethereum address for display
 * @param address - Full Ethereum address
 * @param length - Number of characters to show on each side (default: 6)
 * @returns Truncated address (e.g., "0x1234...5678")
 */
export function truncateAddress(address: string, length: number = 6): string {
  if (!address) return ""
  if (address.length <= length * 2 + 2) return address
  return `${address.slice(0, length + 2)}...${address.slice(-length)}`
}

/**
 * Format a BigInt value to a readable number string
 * @param value - BigInt value
 * @param decimals - Number of decimals (default: 18)
 * @param precision - Display precision (default: 2)
 * @returns Formatted string
 */
export function formatBigInt(
  value: bigint,
  decimals: number = 18,
  precision: number = 2
): string {
  const divisor = BigInt(10 ** decimals)
  const integerPart = value / divisor
  const fractionalPart = value % divisor

  const fractionalStr = fractionalPart
    .toString()
    .padStart(decimals, "0")
    .slice(0, precision)

  if (precision === 0 || fractionalStr === "0".repeat(precision)) {
    return integerPart.toString()
  }

  return `${integerPart}.${fractionalStr}`
}

/**
 * Format a number as a percentage
 * @param value - Number between 0 and 1
 * @param precision - Decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, precision: number = 1): string {
  return `${(value * 100).toFixed(precision)}%`
}

/**
 * Format a timestamp to relative time
 * @param timestamp - Unix timestamp in seconds
 * @returns Relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true })
}

/**
 * Format a countdown timer
 * @param deadline - Unix timestamp in seconds
 * @returns Countdown string (e.g., "2d 5h 30m")
 */
export function formatCountdown(deadline: number): string {
  const now = Math.floor(Date.now() / 1000)
  const remaining = deadline - now

  if (remaining <= 0) return "Ended"

  const days = Math.floor(remaining / 86400)
  const hours = Math.floor((remaining % 86400) / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

/**
 * Format a number with thousand separators
 * @param value - Number to format
 * @param precision - Decimal places (default: 2)
 * @returns Formatted string
 */
export function formatNumber(value: number, precision: number = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  })
}
