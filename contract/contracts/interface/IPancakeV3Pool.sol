// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPancakeV3Pool
 * @dev Interface for PancakeSwap V3 pool to query liquidity
 * Used for BNB/USDT liquidity-based prediction markets
 */
interface IPancakeV3Pool {
    function liquidity() external view returns (uint128 liquidity);

    function token0() external view returns (address token0);

    function token1() external view returns (address token1);
}
