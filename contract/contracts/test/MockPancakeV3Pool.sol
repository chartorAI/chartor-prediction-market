// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockPancakeV3Pool
 * @dev Mock contract for testing LiquidityMarket functionality
 * Simulates PancakeSwap V3 pool behavior for BNB/USDT pair
 */
contract MockPancakeV3Pool {
    uint128 private _liquidity;
    address private _token0;
    address private _token1;

    /**
     * @dev Constructor to set initial mock values
     */
    constructor() {
        _liquidity = 500000 * 1e18; // Initial liquidity of 500K
        _token0 = address(0x1); // Mock BNB address
        _token1 = address(0x2); // Mock USDT address
    }

    /**
     * @dev Get current liquidity in the pool
     * @return liquidity Current liquidity amount
     */
    function liquidity() external view returns (uint128) {
        return _liquidity;
    }

    /**
     * @dev Get token0 address
     * @return token0 Address of token0
     */
    function token0() external view returns (address) {
        return _token0;
    }

    /**
     * @dev Get token1 address
     * @return token1 Address of token1
     */
    function token1() external view returns (address) {
        return _token1;
    }

    /**
     * @dev Set liquidity for testing purposes
     * @param newLiquidity New liquidity amount
     */
    function setLiquidity(uint128 newLiquidity) external {
        _liquidity = newLiquidity;
    }

    /**
     * @dev Set token addresses for testing purposes
     * @param newToken0 New token0 address
     * @param newToken1 New token1 address
     */
    function setTokens(address newToken0, address newToken1) external {
        _token0 = newToken0;
        _token1 = newToken1;
    }

    /**
     * @dev Simulate liquidity query failure for testing
     */
    function simulateFailure() external pure {
        revert("Mock pool failure");
    }
}
