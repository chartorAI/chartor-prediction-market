// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./LMSRMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interface/IPancakeV3Pool.sol";


/**
 * @title LiquidityMarket
 * @dev Prediction market contract for BNB/USDT PancakeSwap liquidity predictions
 * Extends base market functionality with liquidity-based resolution
 * Uses LMSR mechanics for automated market making
 */
contract LiquidityMarket is Ownable {
    using LMSRMath for uint256;

    IPancakeV3Pool public immutable BNB_USDT_POOL;
    uint256 public constant MAX_LIQUIDITY_AGE = 300;
    uint256 public constant PLATFORM_FEE_RATE = 150; // 1.5% = 150 basis points

    // ============ State Variables ============

    struct LiquidityMarketConfig {
        uint256 targetLiquidity;
        uint256 deadline;
        uint256 liquidityParam;
        string description;
        address creator;
        bool exists;
    }

    struct Position {
        uint256 yesShares;
        uint256 noShares;
        uint256 totalStaked;
    }

    struct WhaleInfo {
        address whale;
        uint256 amount;
        uint256 timestamp;
    }

    uint256 public marketCounter;

    mapping(uint256 => LiquidityMarketConfig) public markets;

    mapping(uint256 => uint256) public qYes;
    mapping(uint256 => uint256) public qNo;

    mapping(uint256 => bool) public resolved;
    mapping(uint256 => bool) public yesWins;

    mapping(uint256 => address[]) public participants;
    mapping(uint256 => mapping(address => Position)) public positions;
    mapping(uint256 => mapping(address => bool)) public isParticipant;

    mapping(uint256 => WhaleInfo) public largestYesBet;
    mapping(uint256 => WhaleInfo) public largestNoBet;

    mapping(uint256 => uint256) public marketBalance;
    mapping(uint256 => uint256) public platformFees;
    uint256 public totalPlatformFees;

    mapping(uint256 => uint256) public totalWinningSharesCache;

    // ============ Events ============

    event LiquidityMarketCreated(
        uint256 indexed marketId,
        uint256 targetLiquidity,
        uint256 deadline,
        string description,
        address indexed creator
    );

    event SharesPurchased(
        uint256 indexed marketId,
        address indexed buyer,
        bool indexed isYes,
        uint256 shares,
        uint256 cost,
        uint256 timestamp
    );

    event WhaleBet(
        uint256 indexed marketId,
        address indexed whale,
        bool indexed isYes,
        uint256 amount,
        uint256 timestamp
    );

    event MarketResolved(
        uint256 indexed marketId,
        bool yesWins,
        uint256 finalLiquidity,
        uint256 targetLiquidity,
        uint256 timestamp
    );

    event PayoutDistributed(
        uint256 indexed marketId,
        address indexed trader,
        uint256 amount
    );

    event PayoutFailed(
        uint256 indexed marketId,
        address indexed trader,
        uint256 amount
    );

    event PlatformFeesWithdrawn(
        address indexed owner,
        uint256 amount,
        uint256 timestamp
    );

    event EmergencyWithdrawal(
        address indexed owner,
        uint256 amount,
        uint256 timestamp
    );

    event MarketSurplusWithdrawn(
        address indexed owner,
        uint256 amount,
        uint256 timestamp
    );

    // ============ Errors ============

    error MarketNotFound();
    error MarketNotResolved();
    error MarketAlreadyResolved();
    error DeadlineNotReached();
    error DeadlinePassed();
    error InvalidShareAmount();
    error InsufficientPayment();
    error InvalidDeadline();
    error InvalidLiquidityParam();
    error InvalidTargetLiquidity();
    error PayoutTransferFailed();
    error LiquidityQueryFailed();
    error InvalidPoolAddress();

    // ============ Modifiers ============

    modifier marketExists(uint256 marketId) {
        if (!markets[marketId].exists) {
            revert MarketNotFound();
        }
        _;
    }

    modifier onlyBeforeDeadline(uint256 marketId) {
        if (block.timestamp >= markets[marketId].deadline) {
            revert DeadlinePassed();
        }
        _;
    }

    modifier onlyAfterDeadline(uint256 marketId) {
        if (block.timestamp < markets[marketId].deadline) {
            revert DeadlineNotReached();
        }
        _;
    }

    modifier onlyUnresolved(uint256 marketId) {
        if (resolved[marketId]) {
            revert MarketAlreadyResolved();
        }
        _;
    }

    modifier onlyResolved(uint256 marketId) {
        if (!resolved[marketId]) {
            revert MarketNotResolved();
        }
        _;
    }

    // ============ Constructor ============

    /**
     * @dev Initialize the liquidity market contract
     * @param _poolAddress Address of the BNB/USDT PancakeSwap V3 pool on testnet
     */
    constructor(address _poolAddress) Ownable(msg.sender) {
        if (_poolAddress == address(0)) {
            revert InvalidPoolAddress();
        }

        BNB_USDT_POOL = IPancakeV3Pool(_poolAddress);

        // Validate that the pool address is a valid PancakeSwap pool
        _validatePoolAddress();
    }

    // ============ Market Management Functions ============

    /**
     * @dev Create a new liquidity prediction market
     * @param _targetLiquidity Target liquidity threshold for market resolution
     * @param _deadline Market deadline timestamp
     * @param _liquidityParam LMSR liquidity parameter 'b'
     * @param _description Market description
     * @return marketId The ID of the newly created market
     */
    function createLiquidityMarket(
        uint256 _targetLiquidity,
        uint256 _deadline,
        uint256 _liquidityParam,
        string memory _description
    ) external returns (uint256 marketId) {
        if (_deadline <= block.timestamp + 1 hours) {
            revert InvalidDeadline();
        }
        if (_deadline > block.timestamp + 30 days) {
            revert InvalidDeadline();
        }

        if (
            _liquidityParam < LMSRMath.MIN_LIQUIDITY_PARAM ||
            _liquidityParam > LMSRMath.MAX_LIQUIDITY_PARAM
        ) {
            revert InvalidLiquidityParam();
        }

        if (_targetLiquidity == 0) {
            revert InvalidTargetLiquidity();
        }

        marketId = marketCounter++;

        markets[marketId] = LiquidityMarketConfig({
            targetLiquidity: _targetLiquidity,
            deadline: _deadline,
            liquidityParam: _liquidityParam,
            description: _description,
            creator: msg.sender,
            exists: true
        });

        qYes[marketId] = 0;
        qNo[marketId] = 0;

        resolved[marketId] = false;
        yesWins[marketId] = false;

        emit LiquidityMarketCreated(
            marketId,
            _targetLiquidity,
            _deadline,
            _description,
            msg.sender
        );

        return marketId;
    }

    function getMarket(
        uint256 marketId
    )
        external
        view
        marketExists(marketId)
        returns (LiquidityMarketConfig memory config)
    {
        return markets[marketId];
    }

    function getMarketCount() external view returns (uint256 count) {
        return marketCounter;
    }

    // ============ View Functions ============

    function getPriceYes(
        uint256 marketId
    ) external view marketExists(marketId) returns (uint256 price) {
        return
            LMSRMath.calculateYesPrice(
                qYes[marketId],
                qNo[marketId],
                markets[marketId].liquidityParam
            );
    }

    function getPriceNo(
        uint256 marketId
    ) external view marketExists(marketId) returns (uint256 price) {
        return
            LMSRMath.calculateNoPrice(
                qYes[marketId],
                qNo[marketId],
                markets[marketId].liquidityParam
            );
    }

    function getPosition(
        uint256 marketId,
        address trader
    ) external view marketExists(marketId) returns (Position memory position) {
        return positions[marketId][trader];
    }

    function getCurrentWhales(
        uint256 marketId
    )
        external
        view
        marketExists(marketId)
        returns (WhaleInfo memory largestYes, WhaleInfo memory largestNo)
    {
        return (largestYesBet[marketId], largestNoBet[marketId]);
    }

    function getParticipantCount(
        uint256 marketId
    ) external view marketExists(marketId) returns (uint256 count) {
        return participants[marketId].length;
    }

    function calculateYesCost(
        uint256 marketId,
        uint256 shares
    ) external view marketExists(marketId) returns (uint256 cost) {
        if (shares == 0) return 0;
        return
            LMSRMath.calculateYesPurchaseCost(
                qYes[marketId],
                qNo[marketId],
                shares,
                markets[marketId].liquidityParam
            );
    }

    function calculateNoCost(
        uint256 marketId,
        uint256 shares
    ) external view marketExists(marketId) returns (uint256 cost) {
        if (shares == 0) return 0;
        return
            LMSRMath.calculateNoPurchaseCost(
                qYes[marketId],
                qNo[marketId],
                shares,
                markets[marketId].liquidityParam
            );
    }

    // ============ Trading Functions ============

    /**
     * @dev Buy YES shares using LMSR cost calculation
     * @param marketId The market ID
     * @param shares Number of YES shares to purchase
     */
    function buyYesShares(
        uint256 marketId,
        uint256 shares
    )
        external
        payable
        marketExists(marketId)
        onlyBeforeDeadline(marketId)
        onlyUnresolved(marketId)
    {
        if (shares == 0) {
            revert InvalidShareAmount();
        }

        uint256 cost = LMSRMath.calculateYesPurchaseCost(
            qYes[marketId],
            qNo[marketId],
            shares,
            markets[marketId].liquidityParam
        );

        if (msg.value < cost) {
            revert InsufficientPayment();
        }

        // Calculate and deduct platform fee
        uint256 platformFee = (cost * PLATFORM_FEE_RATE) / 10000;
        uint256 marketFunds = cost - platformFee;

        // Update fund tracking
        marketBalance[marketId] += marketFunds;
        platformFees[marketId] += platformFee;
        totalPlatformFees += platformFee;

        if (!isParticipant[marketId][msg.sender]) {
            participants[marketId].push(msg.sender);
            isParticipant[marketId][msg.sender] = true;
        }

        positions[marketId][msg.sender].yesShares += shares;
        positions[marketId][msg.sender].totalStaked += cost;

        qYes[marketId] += shares;

        _updateWhaleTracking(marketId, msg.sender, cost, true);

        emit SharesPurchased(
            marketId,
            msg.sender,
            true,
            shares,
            cost,
            block.timestamp
        );

        if (msg.value > cost) {
            (bool success, ) = msg.sender.call{value: msg.value - cost}("");
            require(success, "Refund failed");
        }
    }

    /**
     * @dev Buy NO shares using LMSR cost calculation
     * @param marketId The market ID
     * @param shares Number of NO shares to purchase
     */
    function buyNoShares(
        uint256 marketId,
        uint256 shares
    )
        external
        payable
        marketExists(marketId)
        onlyBeforeDeadline(marketId)
        onlyUnresolved(marketId)
    {
        if (shares == 0) {
            revert InvalidShareAmount();
        }

        uint256 cost = LMSRMath.calculateNoPurchaseCost(
            qYes[marketId],
            qNo[marketId],
            shares,
            markets[marketId].liquidityParam
        );

        if (msg.value < cost) {
            revert InsufficientPayment();
        }

        // Calculate and deduct platform fee
        uint256 platformFee = (cost * PLATFORM_FEE_RATE) / 10000;
        uint256 marketFunds = cost - platformFee;

        // Update fund tracking
        marketBalance[marketId] += marketFunds;
        platformFees[marketId] += platformFee;
        totalPlatformFees += platformFee;

        if (!isParticipant[marketId][msg.sender]) {
            participants[marketId].push(msg.sender);
            isParticipant[marketId][msg.sender] = true;
        }

        positions[marketId][msg.sender].noShares += shares;
        positions[marketId][msg.sender].totalStaked += cost;

        qNo[marketId] += shares;

        _updateWhaleTracking(marketId, msg.sender, cost, false);

        emit SharesPurchased(
            marketId,
            msg.sender,
            false,
            shares,
            cost,
            block.timestamp
        );

        if (msg.value > cost) {
            (bool success, ) = msg.sender.call{value: msg.value - cost}("");
            require(success, "Refund failed");
        }
    }

    // ============ Internal Functions ============

    function _updateWhaleTracking(
        uint256 marketId,
        address trader,
        uint256 amount,
        bool isYes
    ) internal {
        if (isYes) {
            if (amount > largestYesBet[marketId].amount) {
                largestYesBet[marketId] = WhaleInfo({
                    whale: trader,
                    amount: amount,
                    timestamp: block.timestamp
                });
                emit WhaleBet(marketId, trader, true, amount, block.timestamp);
            }
        } else {
            if (amount > largestNoBet[marketId].amount) {
                largestNoBet[marketId] = WhaleInfo({
                    whale: trader,
                    amount: amount,
                    timestamp: block.timestamp
                });
                emit WhaleBet(marketId, trader, false, amount, block.timestamp);
            }
        }
    }

    /**
     * @dev Validate that the pool address is a valid PancakeSwap V3 pool
     * Attempts to call the pool interface to ensure it's a valid pool contract
     */
    function _validatePoolAddress() internal view {
        try BNB_USDT_POOL.token0() returns (address) {
            try BNB_USDT_POOL.token1() returns (address) {
                try BNB_USDT_POOL.liquidity() returns (uint128) {
                    // Pool is valid if all interface calls succeed
                } catch {
                    revert InvalidPoolAddress();
                }
            } catch {
                revert InvalidPoolAddress();
            }
        } catch {
            revert InvalidPoolAddress();
        }
    }

    // ============ Liquidity Query Functions ============

    function getCurrentLiquidity() external view returns (uint256 liquidity) {
        return _queryPoolLiquidity();
    }

    function _queryPoolLiquidity() internal view returns (uint256 liquidity) {
        try BNB_USDT_POOL.liquidity() returns (uint128 poolLiquidity) {
            return uint256(poolLiquidity);
        } catch {
            revert LiquidityQueryFailed();
        }
    }

    function getPoolTokens()
        external
        view
        returns (address token0, address token1)
    {
        try BNB_USDT_POOL.token0() returns (address t0) {
            try BNB_USDT_POOL.token1() returns (address t1) {
                return (t0, t1);
            } catch {
                revert LiquidityQueryFailed();
            }
        } catch {
            revert LiquidityQueryFailed();
        }
    }

    // ============ Market Resolution Functions ============

    function resolveMarket(
        uint256 marketId
    )
        external
        marketExists(marketId)
        onlyAfterDeadline(marketId)
        onlyUnresolved(marketId)
    {
        uint256 currentLiquidity = _queryPoolLiquidity();

        yesWins[marketId] =
            currentLiquidity >= markets[marketId].targetLiquidity;

        resolved[marketId] = true;

        emit MarketResolved(
            marketId,
            yesWins[marketId],
            currentLiquidity,
            markets[marketId].targetLiquidity,
            block.timestamp
        );

        _distributePayouts(marketId);
    }

    function getResolutionStatus(
        uint256 marketId
    )
        external
        view
        marketExists(marketId)
        returns (bool isResolved, bool outcome)
    {
        return (resolved[marketId], yesWins[marketId]);
    }

    // ============ Payout Distribution Functions ============

    /**
     * @dev Internal function to distribute payouts to all winning traders
     * Called automatically during market resolution
     * Uses proportional LMSR payouts based on market balance
     * @param marketId The market ID
     */
    function _distributePayouts(uint256 marketId) internal {
        uint256 participantCount = participants[marketId].length;
        uint256 totalWinningShares = 0;
        uint256 availableBalance = marketBalance[marketId];

        // First pass: calculate total winning shares
        for (uint256 i = 0; i < participantCount; i++) {
            address trader = participants[marketId][i];
            Position memory position = positions[marketId][trader];

            if (yesWins[marketId] && position.yesShares > 0) {
                totalWinningShares += position.yesShares;
            } else if (!yesWins[marketId] && position.noShares > 0) {
                totalWinningShares += position.noShares;
            }
        }

        // Cache the total winning shares for future queries
        totalWinningSharesCache[marketId] = totalWinningShares;

        // Second pass: distribute proportional payouts
        if (totalWinningShares > 0 && availableBalance > 0) {
            for (uint256 i = 0; i < participantCount; i++) {
                address trader = participants[marketId][i];
                Position memory position = positions[marketId][trader];

                uint256 winningShares = 0;
                if (yesWins[marketId] && position.yesShares > 0) {
                    winningShares = position.yesShares;
                } else if (!yesWins[marketId] && position.noShares > 0) {
                    winningShares = position.noShares;
                }

                if (winningShares > 0) {
                    // Calculate proportional payout: (userShares / totalWinningShares) × marketBalance
                    uint256 payout = (winningShares * availableBalance) /
                        totalWinningShares;

                    if (payout > 0) {
                        (bool success, ) = trader.call{value: payout}("");
                        if (success) {
                            emit PayoutDistributed(marketId, trader, payout);
                        } else {
                            emit PayoutFailed(marketId, trader, payout);
                        }
                    }
                }
            }
        }
    }

    /**
     * @dev Get total payout amount for a specific trader (view function)
     * @param marketId The market ID
     * @param trader Address of the trader
     * @return payout Amount the trader would receive (or has received if resolved)
     */
    function getTraderPayout(
        uint256 marketId,
        address trader
    ) external view marketExists(marketId) returns (uint256 payout) {
        if (!resolved[marketId]) {
            return 0;
        }

        Position memory position = positions[marketId][trader];
        uint256 winningShares = 0;

        if (yesWins[marketId] && position.yesShares > 0) {
            winningShares = position.yesShares;
        } else if (!yesWins[marketId] && position.noShares > 0) {
            winningShares = position.noShares;
        }

        if (winningShares == 0) {
            return 0;
        }

        // Use cached value instead of recalculating
        uint256 totalWinningShares = totalWinningSharesCache[marketId];

        if (totalWinningShares == 0) {
            return 0;
        }

        // Calculate proportional payout
        return (winningShares * marketBalance[marketId]) / totalWinningShares;
    }

    /**
     * @dev Get total amount that will be paid out to all winners
     * @param marketId The market ID
     * @return totalPayout Total payout amount in wei
     */
    function getTotalPayout(
        uint256 marketId
    ) external view marketExists(marketId) returns (uint256 totalPayout) {
        if (!resolved[marketId]) {
            return 0;
        }

        // With proportional payouts, total payout equals the market balance
        return marketBalance[marketId];
    }

    function getContractBalance() external view returns (uint256 balance) {
        return address(this).balance;
    }

    // ============ Market Listing Functions ============

    function getActiveMarkets()
        external
        view
        returns (uint256[] memory activeMarkets)
    {
        uint256[] memory tempMarkets = new uint256[](marketCounter);
        uint256 activeCount = 0;

        for (uint256 i = 0; i < marketCounter; i++) {
            if (
                markets[i].exists &&
                !resolved[i] &&
                block.timestamp < markets[i].deadline
            ) {
                tempMarkets[activeCount] = i;
                activeCount++;
            }
        }

        activeMarkets = new uint256[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            activeMarkets[i] = tempMarkets[i];
        }

        return activeMarkets;
    }

    function getResolvedMarkets()
        external
        view
        returns (uint256[] memory resolvedMarkets)
    {
        uint256[] memory tempMarkets = new uint256[](marketCounter);
        uint256 resolvedCount = 0;

        for (uint256 i = 0; i < marketCounter; i++) {
            if (markets[i].exists && resolved[i]) {
                tempMarkets[resolvedCount] = i;
                resolvedCount++;
            }
        }

        resolvedMarkets = new uint256[](resolvedCount);
        for (uint256 i = 0; i < resolvedCount; i++) {
            resolvedMarkets[i] = tempMarkets[i];
        }

        return resolvedMarkets;
    }

    // ============ Fund Management Functions ============

    /**
     * @dev Get the balance of funds for a specific market
     * @param marketId The market ID
     * @return balance Market-specific balance in wei
     */
    function getMarketBalance(
        uint256 marketId
    ) external view marketExists(marketId) returns (uint256 balance) {
        return marketBalance[marketId];
    }

    /**
     * @dev Get platform fees collected for a specific market
     * @param marketId The market ID
     * @return fees Platform fees collected for this market in wei
     */
    function getPlatformFees(
        uint256 marketId
    ) external view marketExists(marketId) returns (uint256 fees) {
        return platformFees[marketId];
    }

    /**
     * @dev Get total platform fees collected across all markets
     * @return totalFees Total platform fees in wei
     */
    function getTotalPlatformFees() external view returns (uint256 totalFees) {
        return totalPlatformFees;
    }

    // ============ Platform Fee Management ============

    /**
     * @dev Withdraw accumulated platform fees (only owner)
     * @param amount Amount of fees to withdraw in wei
     */
    function withdrawPlatformFees(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= totalPlatformFees, "Insufficient platform fees");
        require(
            address(this).balance >= amount,
            "Insufficient contract balance"
        );

        totalPlatformFees -= amount;

        (bool success, ) = owner().call{value: amount}("");
        require(success, "Platform fee withdrawal failed");

        emit PlatformFeesWithdrawn(owner(), amount, block.timestamp);
    }

    /**
     * @dev Withdraw all accumulated platform fees (only owner)
     */
    function withdrawAllPlatformFees() external onlyOwner {
        uint256 amount = totalPlatformFees;
        require(amount > 0, "No platform fees to withdraw");
        require(
            address(this).balance >= amount,
            "Insufficient contract balance"
        );

        totalPlatformFees = 0;

        (bool success, ) = owner().call{value: amount}("");
        require(success, "Platform fee withdrawal failed");

        emit PlatformFeesWithdrawn(owner(), amount, block.timestamp);
    }

    // ============ Emergency Admin Functions ============

    /**
     * @dev Emergency withdrawal of any remaining contract balance (only owner)
     * Should only be used in emergency situations or for contract migration
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = owner().call{value: balance}("");
        require(success, "Emergency withdrawal failed");

        emit EmergencyWithdrawal(owner(), balance, block.timestamp);
    }

    /**
     * @dev Withdraw specific amount from contract balance (only owner)
     * @param amount Amount to withdraw in wei
     */
    function emergencyWithdrawAmount(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(
            address(this).balance >= amount,
            "Insufficient contract balance"
        );

        (bool success, ) = owner().call{value: amount}("");
        require(success, "Emergency withdrawal failed");

        emit EmergencyWithdrawal(owner(), amount, block.timestamp);
    }

    /**
     * @dev Withdraw surplus funds that exceed active market requirements (only owner)
     * Calculates total active market balances and allows withdrawal of excess
     */
    function withdrawMarketSurplus() external onlyOwner {
        uint256 totalActiveMarketFunds = 0;

        // Calculate total funds needed for active markets
        for (uint256 i = 0; i < marketCounter; i++) {
            if (markets[i].exists && !resolved[i]) {
                totalActiveMarketFunds += marketBalance[i];
            }
        }

        uint256 contractBalance = address(this).balance;
        uint256 reservedFunds = totalActiveMarketFunds + totalPlatformFees;

        require(contractBalance > reservedFunds, "No surplus funds available");

        uint256 surplus = contractBalance - reservedFunds;
        require(surplus > 0, "No surplus to withdraw");

        (bool success, ) = owner().call{value: surplus}("");
        require(success, "Market surplus withdrawal failed");

        emit MarketSurplusWithdrawn(owner(), surplus, block.timestamp);
    }
}
