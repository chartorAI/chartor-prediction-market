// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./LMSRMath.sol";

interface IPyth {
    struct Price {
        int64 price;
        uint64 conf;
        int32 expo;
        uint256 publishTime;
    }

    function getPriceUnsafe(
        bytes32 id
    ) external view returns (Price memory price);

    function getPrice(bytes32 id) external view returns (Price memory price);
}

/**
 * @title PredictionMarket
 * @dev Multi-market prediction market hub implementing LMSR mechanics with automatic payouts
 * Handles multiple price-based prediction markets with whale tracking and participant management
 * Single contract deployment supports unlimited markets
 */
contract PredictionMarket {
    using LMSRMath for uint256;

    // ============ Constants ============

    IPyth public constant PYTH_ORACLE =
        IPyth(0x5744Cbf430D99456a0A8771208b674F27f8EF0Fb);

    uint256 public constant MAX_PRICE_AGE = 300;

    mapping(string => bytes32) public pythFeeds;

    // ============ State Variables ============

    struct MarketConfig {
        bytes32 pythFeedId;
        uint256 targetPrice;
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

    mapping(uint256 => MarketConfig) public markets;

    mapping(uint256 => uint256) public qYes;
    mapping(uint256 => uint256) public qNo;

    mapping(uint256 => bool) public resolved;
    mapping(uint256 => bool) public yesWins;

    mapping(uint256 => address[]) public participants;
    mapping(uint256 => mapping(address => Position)) public positions;
    mapping(uint256 => mapping(address => bool)) public isParticipant;

    mapping(uint256 => WhaleInfo) public largestYesBet;
    mapping(uint256 => WhaleInfo) public largestNoBet;

    // ============ Events ============

    event MarketCreated(
        uint256 indexed marketId,
        bytes32 indexed pythFeedId,
        uint256 targetPrice,
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
        uint256 finalPrice,
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
    error InvalidTargetPrice();
    error PayoutTransferFailed();
    error InvalidFeedId();
    error StalePriceData();
    error OracleError();

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

    constructor() {
        _initializePythFeeds();
    }

    // ============ Market Management Functions ============

    /**
     * @dev Create a new prediction market
     * @param _pythFeedId Pyth oracle feed ID for price resolution
     * @param _targetPrice Target price for market resolution (scaled by 1e18)
     * @param _deadline Market deadline timestamp
     * @param _liquidityParam LMSR liquidity parameter 'b'
     * @param _description Market description
     * @return marketId The ID of the newly created market
     */
    function createMarket(
        bytes32 _pythFeedId,
        uint256 _targetPrice,
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

        if (_targetPrice == 0) {
            revert InvalidTargetPrice();
        }

        if (!isFeedSupported(_pythFeedId)) {
            revert InvalidFeedId();
        }

        marketId = marketCounter++;

        markets[marketId] = MarketConfig({
            pythFeedId: _pythFeedId,
            targetPrice: _targetPrice,
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

        emit MarketCreated(
            marketId,
            _pythFeedId,
            _targetPrice,
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
        returns (MarketConfig memory config)
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

    function getParticipant(
        uint256 marketId,
        uint256 index
    ) external view marketExists(marketId) returns (address participant) {
        require(index < participants[marketId].length, "Index out of bounds");
        return participants[marketId][index];
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

    // ============ Oracle Integration Functions ============

    function _initializePythFeeds() internal {
        // BTC/USD feed ID
        pythFeeds[
            "BTC"
        ] = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;

        // ETH/USD feed ID
        pythFeeds[
            "ETH"
        ] = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;

        // BNB/USD feed ID
        pythFeeds[
            "BNB"
        ] = 0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f;

        // GOLD/USD feed ID
        pythFeeds[
            "GOLD"
        ] = 0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2;

        // OIL/USD feed ID (WTI Crude Oil)
        pythFeeds[
            "OIL"
        ] = 0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b;
    }

    /**
     * @dev Get current price from Pyth oracle for a market's feed ID
     * @param marketId The market ID
     * @return price Current price scaled to 18 decimals
     * @return timestamp Price update timestamp
     */
    function getCurrentPrice(
        uint256 marketId
    )
        external
        view
        marketExists(marketId)
        returns (uint256 price, uint256 timestamp)
    {
        return _fetchPriceFromPyth(markets[marketId].pythFeedId);
    }

    /**
     * @dev Get supported feed ID for an asset symbol
     * @param symbol Asset symbol (e.g., "BTC", "ETH", "BNB", "GOLD", "OIL")
     * @return feedId Pyth feed ID for the asset
     */
    function getFeedId(
        string memory symbol
    ) external view returns (bytes32 feedId) {
        bytes32 id = pythFeeds[symbol];
        if (id == bytes32(0)) {
            revert InvalidFeedId();
        }
        return id;
    }

    /**
     * @dev Internal function to fetch price from Pyth oracle
     * @param feedId Pyth feed ID for the asset
     * @return price Current price scaled to 18 decimals
     * @return timestamp Price update timestamp
     */
    function _fetchPriceFromPyth(
        bytes32 feedId
    ) internal view returns (uint256 price, uint256 timestamp) {
        if (feedId == bytes32(0)) {
            revert InvalidFeedId();
        }

        try PYTH_ORACLE.getPriceUnsafe(feedId) returns (
            IPyth.Price memory priceData
        ) {
            if (block.timestamp - priceData.publishTime > MAX_PRICE_AGE) {
                revert StalePriceData();
            }

            uint256 scaledPrice;
            if (priceData.expo >= 0) {
                scaledPrice =
                    uint256(uint64(priceData.price)) *
                    (10 ** uint256(int256(priceData.expo)));
            } else {
                uint256 divisor = 10 ** uint256(-int256(priceData.expo));
                scaledPrice =
                    (uint256(uint64(priceData.price)) * 1e18) /
                    divisor;
            }

            return (scaledPrice, priceData.publishTime);
        } catch {
            revert OracleError();
        }
    }

    /**
     * @dev Check if a feed ID is supported
     * @param feedId Pyth feed ID to check
     * @return supported True if feed ID is supported
     */
    function isFeedSupported(
        bytes32 feedId
    ) public view returns (bool supported) {
        return (feedId == pythFeeds["BTC"] ||
            feedId == pythFeeds["ETH"] ||
            feedId == pythFeeds["BNB"] ||
            feedId == pythFeeds["GOLD"] ||
            feedId == pythFeeds["OIL"]);
    }

    // ============ Market Resolution Functions ============

    /**
     * @dev Resolve a market using Pyth oracle data and trigger automatic payouts
     * Can only be called after the deadline has passed
     * @param marketId The market ID to resolve
     */
    function resolveMarket(
        uint256 marketId
    )
        external
        marketExists(marketId)
        onlyAfterDeadline(marketId)
        onlyUnresolved(marketId)
    {
        (uint256 currentPrice, ) = _fetchPriceFromPyth(
            markets[marketId].pythFeedId
        );

        yesWins[marketId] = currentPrice >= markets[marketId].targetPrice;

        resolved[marketId] = true;

        emit MarketResolved(
            marketId,
            yesWins[marketId],
            currentPrice,
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
     * @param marketId The market ID
     */
    function _distributePayouts(uint256 marketId) internal {
        uint256 participantCount = participants[marketId].length;

        for (uint256 i = 0; i < participantCount; i++) {
            address trader = participants[marketId][i];
            Position memory position = positions[marketId][trader];

            uint256 payout = 0;

            if (yesWins[marketId] && position.yesShares > 0) {
                payout = position.yesShares * 1 ether;
            } else if (!yesWins[marketId] && position.noShares > 0) {
                payout = position.noShares * 1 ether;
            }

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

        if (yesWins[marketId] && position.yesShares > 0) {
            return position.yesShares * 1 ether;
        } else if (!yesWins[marketId] && position.noShares > 0) {
            return position.noShares * 1 ether;
        }

        return 0;
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

        uint256 total = 0;
        uint256 participantCount = participants[marketId].length;

        for (uint256 i = 0; i < participantCount; i++) {
            address trader = participants[marketId][i];
            Position memory position = positions[marketId][trader];

            if (yesWins[marketId] && position.yesShares > 0) {
                total += position.yesShares * 1 ether;
            } else if (!yesWins[marketId] && position.noShares > 0) {
                total += position.noShares * 1 ether;
            }
        }

        return total;
    }

    function getContractBalance() external view returns (uint256 balance) {
        return address(this).balance;
    }

    // ============ Market Listing Functions ============

    /**
     * @dev Get all active markets (not resolved and not expired)
     * @return activeMarkets Array of active market IDs
     */
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

    /**
     * @dev Get all resolved markets
     * @return resolvedMarkets Array of resolved market IDs
     */
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

    /**
     * @dev Get markets by asset (feed ID)
     * @param feedId Pyth feed ID to filter by
     * @return assetMarkets Array of market IDs for the specified asset
     */
    function getMarketsByAsset(
        bytes32 feedId
    ) external view returns (uint256[] memory assetMarkets) {
        uint256[] memory tempMarkets = new uint256[](marketCounter);
        uint256 assetCount = 0;

        for (uint256 i = 0; i < marketCounter; i++) {
            if (markets[i].exists && markets[i].pythFeedId == feedId) {
                tempMarkets[assetCount] = i;
                assetCount++;
            }
        }

        assetMarkets = new uint256[](assetCount);
        for (uint256 i = 0; i < assetCount; i++) {
            assetMarkets[i] = tempMarkets[i];
        }

        return assetMarkets;
    }
}
