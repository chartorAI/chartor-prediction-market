import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const text = searchParams.get("text")

  if (!text) {
    return NextResponse.json(
      { error: "Missing text parameter" },
      { status: 400 }
    )
  }

  try {
    const url = `https://symbol-search.tradingview.com/local_search/v3/?text=${encodeURIComponent(
      text
    )}&hl=1&exchange=&lang=en&search_type=undefined&domain=production`

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    })

    if (!response.ok) {
      throw new Error(`TradingView API returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching from TradingView:", error)
    return NextResponse.json(
      { error: "Failed to search symbol" },
      { status: 500 }
    )
  }
}
