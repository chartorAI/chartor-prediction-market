// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockPyth
 * @dev Mock Pyth oracle contract for testing purposes
 * Simulates Pyth Network oracle responses for integration testing
 */
contract MockPyth {
    struct Price {
        int64 price; // Price value
        uint64 conf; // Confidence interval
        int32 expo; // Price exponent
        uint256 publishTime; // Timestamp of price update
    }

    // Mock price data storage
    mapping(bytes32 => Price) public mockPrices;

    // Default price data
    Price public defaultPrice =
        Price({
            price: 50000_00000000, // $50,000 with 8 decimals
            conf: 100_00000000, // $100 confidence
            expo: -8, // 8 decimal places
            publishTime: 0 // Will be set to current timestamp
        });

    /**
     * @dev Set mock price data for a specific feed ID
     * @param feedId Pyth feed ID
     * @param price Price value (with decimals according to expo)
     * @param conf Confidence interval
     * @param expo Price exponent (usually negative)
     */
    function setMockPrice(bytes32 feedId, int64 price, uint64 conf, int32 expo) external {
        mockPrices[feedId] = Price({
            price: price,
            conf: conf,
            expo: expo,
            publishTime: block.timestamp
        });
    }

    /**
     * @dev Set mock price with current timestamp
     * @param feedId Pyth feed ID
     * @param price Price value in USD with 8 decimals (e.g., 5000000000000 for $50,000)
     */
    function setMockPriceSimple(bytes32 feedId, int64 price) external {
        mockPrices[feedId] = Price({
            price: price,
            conf: uint64(price / 100), // 1% confidence interval
            expo: -8,
            publishTime: block.timestamp
        });
    }

    /**
     * @dev Get price data for a given feed ID (unsafe - may return stale data)
     * @param id Pyth feed ID for the asset
     * @return price Price struct containing price data
     */
    function getPriceUnsafe(bytes32 id) external view returns (Price memory price) {
        Price memory storedPrice = mockPrices[id];

        // If no mock price set, return default
        if (storedPrice.publishTime == 0) {
            return
                Price({
                    price: defaultPrice.price,
                    conf: defaultPrice.conf,
                    expo: defaultPrice.expo,
                    publishTime: block.timestamp
                });
        }

        return storedPrice;
    }

    /**
     * @dev Get price data for a given feed ID (safe - reverts on stale data)
     * @param id Pyth feed ID for the asset
     * @return price Price struct containing price data
     */
    function getPrice(bytes32 id) external view returns (Price memory price) {
        Price memory storedPrice = mockPrices[id];

        // If no mock price set, return default
        if (storedPrice.publishTime == 0) {
            return
                Price({
                    price: defaultPrice.price,
                    conf: defaultPrice.conf,
                    expo: defaultPrice.expo,
                    publishTime: block.timestamp
                });
        }

        // Check if price is stale (older than 5 minutes)
        require(block.timestamp - storedPrice.publishTime <= 300, "Price data is stale");

        return storedPrice;
    }

    /**
     * @dev Simulate price above target (YES wins scenario)
     * @param feedId Pyth feed ID
     */
    function setHighPrice(bytes32 feedId) external {
        mockPrices[feedId] = Price({
            price: 55000_00000000, // $55,000 (above $50,000 target)
            conf: 100_00000000,
            expo: -8,
            publishTime: block.timestamp
        });
    }

    /**
     * @dev Simulate price below target (NO wins scenario)
     * @param feedId Pyth feed ID
     */
    function setLowPrice(bytes32 feedId) external {
        mockPrices[feedId] = Price({
            price: 45000_00000000, // $45,000 (below $50,000 target)
            conf: 100_00000000,
            expo: -8,
            publishTime: block.timestamp
        });
    }

    /**
     * @dev Simulate stale price data (for error testing)
     * @param feedId Pyth feed ID
     */
    function setStalePrice(bytes32 feedId) external {
        mockPrices[feedId] = Price({
            price: 50000_00000000,
            conf: 100_00000000,
            expo: -8,
            publishTime: block.timestamp - 600 // 10 minutes ago (stale)
        });
    }
}
