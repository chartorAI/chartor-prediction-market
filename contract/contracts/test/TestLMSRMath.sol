// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../contracts/LMSRMath.sol";

/**
 * @title TestLMSRMath
 * @dev Test contract that exposes LMSRMath library functions for unit testing
 */
contract TestLMSRMath {
    using LMSRMath for *;

    function calculateCost(
        uint256 qYes,
        uint256 qNo,
        uint256 liquidityParam
    ) external pure returns (uint256) {
        return LMSRMath.calculateCost(qYes, qNo, liquidityParam);
    }

    function calculateYesPrice(
        uint256 qYes,
        uint256 qNo,
        uint256 liquidityParam
    ) external pure returns (uint256) {
        return LMSRMath.calculateYesPrice(qYes, qNo, liquidityParam);
    }

    function calculateNoPrice(
        uint256 qYes,
        uint256 qNo,
        uint256 liquidityParam
    ) external pure returns (uint256) {
        return LMSRMath.calculateNoPrice(qYes, qNo, liquidityParam);
    }

    function calculateCostDifference(
        uint256 currentQYes,
        uint256 currentQNo,
        uint256 additionalYes,
        uint256 additionalNo,
        uint256 liquidityParam
    ) external pure returns (uint256) {
        return
            LMSRMath.calculateCostDifference(
                currentQYes,
                currentQNo,
                additionalYes,
                additionalNo,
                liquidityParam
            );
    }

    function calculateYesPurchaseCost(
        uint256 currentQYes,
        uint256 currentQNo,
        uint256 additionalYes,
        uint256 liquidityParam
    ) external pure returns (uint256) {
        return
            LMSRMath.calculateYesPurchaseCost(
                currentQYes,
                currentQNo,
                additionalYes,
                liquidityParam
            );
    }

    function calculateNoPurchaseCost(
        uint256 currentQYes,
        uint256 currentQNo,
        uint256 additionalNo,
        uint256 liquidityParam
    ) external pure returns (uint256) {
        return
            LMSRMath.calculateNoPurchaseCost(currentQYes, currentQNo, additionalNo, liquidityParam);
    }

    function validatePriceSum(uint256 yesPrice, uint256 noPrice) external pure returns (bool) {
        return LMSRMath.validatePriceSum(yesPrice, noPrice);
    }
}
