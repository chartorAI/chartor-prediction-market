// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./LMSRMath.sol";

/**
 * @title IPyth
 * @dev Interface for Pyth Network oracle on BNB Testnet
 * Direct contract integration without SDK dependency
 */
interface IPyth {
    struct Price {
        int64 price; 
        uint64 conf; 
        int32 expo; 
        uint256 publishTime; 
    }

    /**
     * @dev Get price data for a given feed ID (unsafe - may return stale data)
     * @param id Pyth feed ID for the asset
     * @return price Price struct containing price data
     */
    function getPriceUnsafe(
        bytes32 id
    ) external view returns (Price memory price);

    /**
     * @dev Get price data for a given feed ID (safe - reverts on stale data)
     * @param id Pyth feed ID for the asset
     * @return price Price struct containing price data
     */
    function getPrice(bytes32 id) external view returns (Price memory price);
}

/**
 * @title PredictionMarket
 * @dev Core prediction market contract implementing LMSR mechanics with automatic payouts
 * Handles individual price-based prediction markets with whale tracking and participant management
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

   
    MarketConfig public marketConfig;

    /// @dev LMSR state
    uint256 public qYes; 
    uint256 public qNo; 

    /// @dev Market resolution state
    bool public resolved; 
    bool public yesWins; 

    /// @dev Participant tracking for autopayout system
    address[] public participants; 
    mapping(address => Position) public positions; 
    mapping(address => bool) public isParticipant; 

    /// @dev Whale tracking storage
    WhaleInfo public largestYesBet; 
    WhaleInfo public largestNoBet; 

    // ============ Events ============

    /// @dev Emitted when shares are purchased
    event SharesPurchased(
        address indexed buyer,
        bool indexed isYes,
        uint256 shares,
        uint256 cost,
        uint256 timestamp
    );

    /// @dev Emitted when a new whale bet is recorded
    event WhaleBet(
        address indexed whale,
        bool indexed isYes,
        uint256 amount,
        uint256 timestamp
    );

    /// @dev Emitted when market is resolved
    event MarketResolved(bool yesWins, uint256 finalPrice, uint256 timestamp);

    /// @dev Emitted when payout is distributed
    event PayoutDistributed(address indexed trader, uint256 amount);

    /// @dev Emitted when payout fails
    event PayoutFailed(address indexed trader, uint256 amount);

    // ============ Errors ============

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

    modifier onlyBeforeDeadline() {
        if (block.timestamp >= marketConfig.deadline) {
            revert DeadlinePassed();
        }
        _;
    }

    modifier onlyAfterDeadline() {
        if (block.timestamp < marketConfig.deadline) {
            revert DeadlineNotReached();
        }
        _;
    }

    modifier onlyUnresolved() {
        if (resolved) {
            revert MarketAlreadyResolved();
        }
        _;
    }

    modifier onlyResolved() {
        if (!resolved) {
            revert MarketNotResolved();
        }
        _;
    }

    // ============ Constructor ============

    /**
     * @dev Initialize prediction market with configuration and validation
     * @param _pythFeedId Pyth oracle feed ID for price resolution
     * @param _targetPrice Target price for market resolution (scaled by 1e18)
     * @param _deadline Market deadline timestamp
     * @param _liquidityParam LMSR liquidity parameter 'b'
     * @param _description Market description
     * @param _creator Market creator address
     */
    constructor(
        bytes32 _pythFeedId,
        uint256 _targetPrice,
        uint256 _deadline,
        uint256 _liquidityParam,
        string memory _description,
        address _creator
    ) {
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

        marketConfig = MarketConfig({
            pythFeedId: _pythFeedId,
            targetPrice: _targetPrice,
            deadline: _deadline,
            liquidityParam: _liquidityParam,
            description: _description,
            creator: _creator
        });

        qYes = 0;
        qNo = 0;

        resolved = false;
        yesWins = false;

        _initializePythFeeds();
    }

    // ============ View Functions ============

    /**
     * @dev Get current YES share price using LMSR formula
     * @return price Current YES price (scaled by 1e18, between 0 and 1)
     */
    function getPriceYes() external view returns (uint256 price) {
        return
            LMSRMath.calculateYesPrice(qYes, qNo, marketConfig.liquidityParam);
    }

    /**
     * @dev Get current NO share price using LMSR formula
     * @return price Current NO price (scaled by 1e18, between 0 and 1)
     */
    function getPriceNo() external view returns (uint256 price) {
        return
            LMSRMath.calculateNoPrice(qYes, qNo, marketConfig.liquidityParam);
    }

    /**
     * @dev Get trader's position information
     * @param trader Address of the trader
     * @return position Trader's position struct
     */
    function getPosition(
        address trader
    ) external view returns (Position memory position) {
        return positions[trader];
    }

    /**
     * @dev Get current whale information for both YES and NO bets
     * @return largestYes Current largest YES bet info
     * @return largestNo Current largest NO bet info
     */
    function getCurrentWhales()
        external
        view
        returns (WhaleInfo memory largestYes, WhaleInfo memory largestNo)
    {
        return (largestYesBet, largestNoBet);
    }

    /**
     * @dev Get total number of participants
     * @return count Number of unique traders
     */
    function getParticipantCount() external view returns (uint256 count) {
        return participants.length;
    }

    /**
     * @dev Get participant address by index
     * @param index Index in participants array
     * @return participant Address of participant
     */
    function getParticipant(
        uint256 index
    ) external view returns (address participant) {
        require(index < participants.length, "Index out of bounds");
        return participants[index];
    }

    /**
     * @dev Calculate cost for purchasing YES shares
     * @param shares Number of YES shares to purchase
     * @return cost Required payment in wei
     */
    function calculateYesCost(
        uint256 shares
    ) external view returns (uint256 cost) {
        if (shares == 0) return 0;
        return
            LMSRMath.calculateYesPurchaseCost(
                qYes,
                qNo,
                shares,
                marketConfig.liquidityParam
            );
    }

    /**
     * @dev Calculate cost for purchasing NO shares
     * @param shares Number of NO shares to purchase
     * @return cost Required payment in wei
     */
    function calculateNoCost(
        uint256 shares
    ) external view returns (uint256 cost) {
        if (shares == 0) return 0;
        return
            LMSRMath.calculateNoPurchaseCost(
                qYes,
                qNo,
                shares,
                marketConfig.liquidityParam
            );
    }

    // ============ Trading Functions ============

    /**
     * @dev Buy YES shares using LMSR cost calculation
     * @param shares Number of YES shares to purchase
     */
    function buyYesShares(
        uint256 shares
    ) external payable onlyBeforeDeadline onlyUnresolved {
        if (shares == 0) {
            revert InvalidShareAmount();
        }

        uint256 cost = LMSRMath.calculateYesPurchaseCost(
            qYes,
            qNo,
            shares,
            marketConfig.liquidityParam
        );

        if (msg.value < cost) {
            revert InsufficientPayment();
        }

        if (!isParticipant[msg.sender]) {
            participants.push(msg.sender);
            isParticipant[msg.sender] = true;
        }

        // Update trader's position
        positions[msg.sender].yesShares += shares;
        positions[msg.sender].totalStaked += cost;

        qYes += shares;

        _updateWhaleTracking(msg.sender, cost, true);

        emit SharesPurchased(msg.sender, true, shares, cost, block.timestamp);

        // Refund excess payment
        if (msg.value > cost) {
            (bool success, ) = msg.sender.call{value: msg.value - cost}("");
            require(success, "Refund failed");
        }
    }

    /**
     * @dev Buy NO shares using LMSR cost calculation
     * @param shares Number of NO shares to purchase
     */
    function buyNoShares(
        uint256 shares
    ) external payable onlyBeforeDeadline onlyUnresolved {
        if (shares == 0) {
            revert InvalidShareAmount();
        }

        uint256 cost = LMSRMath.calculateNoPurchaseCost(
            qYes,
            qNo,
            shares,
            marketConfig.liquidityParam
        );

        if (msg.value < cost) {
            revert InsufficientPayment();
        }

        if (!isParticipant[msg.sender]) {
            participants.push(msg.sender);
            isParticipant[msg.sender] = true;
        }

        positions[msg.sender].noShares += shares;
        positions[msg.sender].totalStaked += cost;

        qNo += shares;

        _updateWhaleTracking(msg.sender, cost, false);

        emit SharesPurchased(msg.sender, false, shares, cost, block.timestamp);

        if (msg.value > cost) {
            (bool success, ) = msg.sender.call{value: msg.value - cost}("");
            require(success, "Refund failed");
        }
    }

    // ============ Internal Functions ============

    /**
     * @dev Internal function to update whale tracking
     * @param trader Address of the trader
     * @param amount Bet amount
     * @param isYes Whether this is a YES bet
     */
    function _updateWhaleTracking(
        address trader,
        uint256 amount,
        bool isYes
    ) internal {
        if (isYes) {
            if (amount > largestYesBet.amount) {
                largestYesBet = WhaleInfo({
                    whale: trader,
                    amount: amount,
                    timestamp: block.timestamp
                });
                emit WhaleBet(trader, true, amount, block.timestamp);
            }
        } else {
            if (amount > largestNoBet.amount) {
                largestNoBet = WhaleInfo({
                    whale: trader,
                    amount: amount,
                    timestamp: block.timestamp
                });
                emit WhaleBet(trader, false, amount, block.timestamp);
            }
        }
    }

    // ============ Oracle Integration Functions ============

    /**
     * @dev Initialize supported Pyth feed IDs for different assets
     * Called during contract construction
     */
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
     * @dev Get current price from Pyth oracle for the market's feed ID
     * @return price Current price scaled to 18 decimals
     * @return timestamp Price update timestamp
     */
    function getCurrentPrice()
        external
        view
        returns (uint256 price, uint256 timestamp)
    {
        return _fetchPriceFromPyth(marketConfig.pythFeedId);
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
    ) external view returns (bool supported) {
        // Check if feedId matches any of the supported feeds
        return (feedId == pythFeeds["BTC"] ||
            feedId == pythFeeds["ETH"] ||
            feedId == pythFeeds["BNB"] ||
            feedId == pythFeeds["GOLD"] ||
            feedId == pythFeeds["OIL"]);
    }

    // ============ Market Resolution Functions ============

    /**
     * @dev Resolve the market using Pyth oracle data and trigger automatic payouts
     * Can only be called after the deadline has passed
     * Fetches current price, determines outcome, and distributes payouts automatically
     */
    function resolveMarket() external onlyAfterDeadline onlyUnresolved {
        (uint256 currentPrice, ) = _fetchPriceFromPyth(marketConfig.pythFeedId);

      
        yesWins = currentPrice >= marketConfig.targetPrice;

        resolved = true;

        emit MarketResolved(yesWins, currentPrice, block.timestamp);

        _distributePayouts();
    }

    /**
     * @dev Get market resolution status and outcome
     * @return isResolved Whether the market has been resolved
     * @return outcome True if YES wins, false if NO wins (only valid if resolved)
     */
    function getResolutionStatus()
        external
        view
        returns (bool isResolved, bool outcome)
    {
        return (resolved, yesWins);
    }

    // ============ Payout Distribution Functions ============

    /**
     * @dev Internal function to distribute payouts to all winning traders
     * Called automatically during market resolution
     * Iterates through all participants and pays winners 1 BNB per winning share
     */
    function _distributePayouts() internal {
        uint256 participantCount = participants.length;

        for (uint256 i = 0; i < participantCount; i++) {
            address trader = participants[i];
            Position memory position = positions[trader];

            uint256 payout = 0;

            if (yesWins && position.yesShares > 0) {
                payout = position.yesShares * 1 ether;
            } else if (!yesWins && position.noShares > 0) {
                payout = position.noShares * 1 ether;
            }

            if (payout > 0) {
                (bool success, ) = trader.call{value: payout}("");
                if (success) {
                    emit PayoutDistributed(trader, payout);
                } else {
                    emit PayoutFailed(trader, payout);
                }
            }
        }
    }

    /**
     * @dev Get total payout amount for a specific trader (view function)
     * @param trader Address of the trader
     * @return payout Amount the trader would receive (or has received if resolved)
     */
    function getTraderPayout(
        address trader
    ) external view returns (uint256 payout) {
        if (!resolved) {
            return 0; 
        }

        Position memory position = positions[trader];

        if (yesWins && position.yesShares > 0) {
            return position.yesShares * 1 ether;
        } else if (!yesWins && position.noShares > 0) {
            return position.noShares * 1 ether;
        }

        return 0; 
    }

    /**
     * @dev Get total amount that will be paid out to all winners
     * @return totalPayout Total payout amount in wei
     */
    function getTotalPayout() external view returns (uint256 totalPayout) {
        if (!resolved) {
            return 0; 
        }

        uint256 total = 0;
        uint256 participantCount = participants.length;

        for (uint256 i = 0; i < participantCount; i++) {
            address trader = participants[i];
            Position memory position = positions[trader];

            if (yesWins && position.yesShares > 0) {
                total += position.yesShares * 1 ether;
            } else if (!yesWins && position.noShares > 0) {
                total += position.noShares * 1 ether;
            }
        }

        return total;
    }

    /**
     * @dev Get contract balance (for debugging and verification)
     * @return balance Current contract balance in wei
     */
    function getContractBalance() external view returns (uint256 balance) {
        return address(this).balance;
    }
}
