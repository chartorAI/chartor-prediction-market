// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {UD60x18, ud, ln, exp, add, sub, mul, div} from "@prb/math/src/UD60x18.sol";

/**
 * @title LMSRMath
 * @dev Library implementing Logarithmic Market Scoring Rule (LMSR) mathematics
 * for automated market making in prediction markets.
 *
 * The LMSR cost function is: C(q_yes, q_no) = b * ln(e^(q_yes/b) + e^(q_no/b))
 * Where b is the liquidity parameter that controls market sensitivity.
 */
library LMSRMath {
    using {add, sub, mul, div} for UD60x18;

    uint256 public constant MAX_SHARES = 1e21;

    uint256 public constant MIN_LIQUIDITY_PARAM = 1e15; 

    uint256 public constant MAX_LIQUIDITY_PARAM = 1e21; 

    error InvalidLiquidityParameter();
    error ShareQuantityTooLarge();
    error InvalidShareQuantity();

    /**
     * @dev Calculates the LMSR cost function C(q_yes, q_no) = b * ln(e^(q_yes/b) + e^(q_no/b))
     * @param qYes Quantity of YES shares
     * @param qNo Quantity of NO shares
     * @param liquidityParam The liquidity parameter 'b'
     * @return cost The total cost in wei
     */
    function calculateCost(
        uint256 qYes,
        uint256 qNo,
        uint256 liquidityParam
    ) internal pure returns (uint256 cost) {
        if (
            liquidityParam < MIN_LIQUIDITY_PARAM ||
            liquidityParam > MAX_LIQUIDITY_PARAM
        ) {
            revert InvalidLiquidityParameter();
        }

        if (qYes > MAX_SHARES || qNo > MAX_SHARES) {
            revert ShareQuantityTooLarge();
        }

        UD60x18 b = ud(liquidityParam);
        UD60x18 qYesUD = ud(qYes);
        UD60x18 qNoUD = ud(qNo);

        UD60x18 qYesOverB = qYesUD.div(b);
        UD60x18 qNoOverB = qNoUD.div(b);

        UD60x18 expQYes = exp(qYesOverB);
        UD60x18 expQNo = exp(qNoOverB);

        UD60x18 sumExp = expQYes.add(expQNo);

        UD60x18 lnSum = ln(sumExp);

        UD60x18 result = b.mul(lnSum);

        return result.unwrap();
    }

    /**
     * @dev Calculates the price of YES shares using LMSR formula
     * Price = e^(q_yes/b) / (e^(q_yes/b) + e^(q_no/b))
     * @param qYes Quantity of YES shares
     * @param qNo Quantity of NO shares
     * @param liquidityParam The liquidity parameter 'b'
     * @return price The price as a value between 0 and 1 (scaled by 1e18)
     */
    function calculateYesPrice(
        uint256 qYes,
        uint256 qNo,
        uint256 liquidityParam
    ) internal pure returns (uint256 price) {
        if (
            liquidityParam < MIN_LIQUIDITY_PARAM ||
            liquidityParam > MAX_LIQUIDITY_PARAM
        ) {
            revert InvalidLiquidityParameter();
        }

        if (qYes > MAX_SHARES || qNo > MAX_SHARES) {
            revert ShareQuantityTooLarge();
        }

        UD60x18 b = ud(liquidityParam);
        UD60x18 qYesUD = ud(qYes);
        UD60x18 qNoUD = ud(qNo);

        UD60x18 qYesOverB = qYesUD.div(b);
        UD60x18 qNoOverB = qNoUD.div(b);

        UD60x18 expQYes = exp(qYesOverB);
        UD60x18 expQNo = exp(qNoOverB);

        UD60x18 sumExp = expQYes.add(expQNo);

        UD60x18 result = expQYes.div(sumExp);

        return result.unwrap();
    }

    /**
     * @dev Calculates the price of NO shares using LMSR formula
     * Price = e^(q_no/b) / (e^(q_yes/b) + e^(q_no/b))
     * @param qYes Quantity of YES shares
     * @param qNo Quantity of NO shares
     * @param liquidityParam The liquidity parameter 'b'
     * @return price The price as a value between 0 and 1 (scaled by 1e18)
     */
    function calculateNoPrice(
        uint256 qYes,
        uint256 qNo,
        uint256 liquidityParam
    ) internal pure returns (uint256 price) {
        if (
            liquidityParam < MIN_LIQUIDITY_PARAM ||
            liquidityParam > MAX_LIQUIDITY_PARAM
        ) {
            revert InvalidLiquidityParameter();
        }

        if (qYes > MAX_SHARES || qNo > MAX_SHARES) {
            revert ShareQuantityTooLarge();
        }

        UD60x18 b = ud(liquidityParam);
        UD60x18 qYesUD = ud(qYes);
        UD60x18 qNoUD = ud(qNo);

        UD60x18 qYesOverB = qYesUD.div(b);
        UD60x18 qNoOverB = qNoUD.div(b);

        UD60x18 expQYes = exp(qYesOverB);
        UD60x18 expQNo = exp(qNoOverB);

        UD60x18 sumExp = expQYes.add(expQNo);

        UD60x18 result = expQNo.div(sumExp);

        return result.unwrap();
    }

    /**
     *
     * @dev Calculates the cost difference for purchasing additional shares
     * This is the payment required when buying shares: C_new - C_old
     * @param currentQYes Current quantity of YES shares
     * @param currentQNo Current quantity of NO shares
     * @param additionalYes Additional YES shares to purchase
     * @param additionalNo Additional NO shares to purchase
     * @param liquidityParam The liquidity parameter 'b'
     * @return costDifference The payment required in wei
     */
    function calculateCostDifference(
        uint256 currentQYes,
        uint256 currentQNo,
        uint256 additionalYes,
        uint256 additionalNo,
        uint256 liquidityParam
    ) internal pure returns (uint256 costDifference) {
        if (additionalYes == 0 && additionalNo == 0) {
            return 0;
        }

        if (additionalYes > 0 && additionalNo > 0) {
            revert InvalidShareQuantity();
        }

        uint256 currentCost = calculateCost(
            currentQYes,
            currentQNo,
            liquidityParam
        );

        uint256 newQYes = currentQYes + additionalYes;
        uint256 newQNo = currentQNo + additionalNo;
        uint256 newCost = calculateCost(newQYes, newQNo, liquidityParam);

        return newCost - currentCost;
    }

    /**
     * @dev Calculates the cost for purchasing YES shares specifically
     * Optimized version for YES-only purchases
     * @param currentQYes Current quantity of YES shares
     * @param currentQNo Current quantity of NO shares
     * @param additionalYes Additional YES shares to purchase
     * @param liquidityParam The liquidity parameter 'b'
     * @return cost The payment required in wei
     */
    function calculateYesPurchaseCost(
        uint256 currentQYes,
        uint256 currentQNo,
        uint256 additionalYes,
        uint256 liquidityParam
    ) internal pure returns (uint256 cost) {
        if (additionalYes == 0) {
            return 0;
        }

        return
            calculateCostDifference(
                currentQYes,
                currentQNo,
                additionalYes,
                0,
                liquidityParam
            );
    }

    /**
     * @dev Calculates the cost for purchasing NO shares specifically
     * Optimized version for NO-only purchases
     * @param currentQYes Current quantity of YES shares
     * @param currentQNo Current quantity of NO shares
     * @param additionalNo Additional NO shares to purchase
     * @param liquidityParam The liquidity parameter 'b'
     * @return cost The payment required in wei
     */
    function calculateNoPurchaseCost(
        uint256 currentQYes,
        uint256 currentQNo,
        uint256 additionalNo,
        uint256 liquidityParam
    ) internal pure returns (uint256 cost) {
        if (additionalNo == 0) {
            return 0;
        }

        return
            calculateCostDifference(
                currentQYes,
                currentQNo,
                0,
                additionalNo,
                liquidityParam
            );
    }

    /**
     * @dev Validates that prices sum to approximately 1 (within tolerance)
     * Used for testing and validation purposes
     * @param yesPrice Price of YES shares
     * @param noPrice Price of NO shares
     * @return valid True if prices sum to approximately 1
     */
    function validatePriceSum(
        uint256 yesPrice,
        uint256 noPrice
    ) internal pure returns (bool valid) {
        uint256 sum = yesPrice + noPrice;
        uint256 tolerance = 1e15;

        return (sum >= (1e18 - tolerance) && sum <= (1e18 + tolerance));
    }
}
