// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockAavePool
 * @dev Mock implementation of Aave pool for testing purposes
 * @author NexYield Team
 */
contract MockAavePool {
    using SafeERC20 for IERC20;

    // Events
    event Supply(address indexed asset, uint256 amount, address indexed onBehalfOf, uint16 referralCode);
    event Withdraw(address indexed asset, uint256 amount, address indexed to);

    // State variables
    mapping(address => uint256) public totalSupply;
    mapping(address => uint256) public totalBorrow;
    mapping(address => uint256) public liquidityRate;
    mapping(address => uint256) public variableBorrowRate;
    mapping(address => uint256) public stableBorrowRate;
    
    // Mock APY (5% = 500 basis points)
    uint256 public constant MOCK_APY = 500;
    
    // Time tracking for yield calculation
    mapping(address => mapping(address => uint256)) public lastUpdateTime;
    mapping(address => mapping(address => uint256)) public userSupply;

    constructor() {
        // Set default rates
        liquidityRate[address(0)] = MOCK_APY;
        variableBorrowRate[address(0)] = 300; // 3%
        stableBorrowRate[address(0)] = 400; // 4%
    }

    /**
     * @dev Supply assets to the pool
     * @param asset Asset address
     * @param amount Amount to supply
     * @param onBehalfOf Address to credit the supply to
     * @param referralCode Referral code (unused in mock)
     */
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external {
        require(asset != address(0), "Invalid asset");
        require(amount > 0, "Amount must be greater than 0");
        require(onBehalfOf != address(0), "Invalid onBehalfOf");
        
        // Transfer tokens from caller
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        
        // Update state
        totalSupply[asset] += amount;
        userSupply[asset][onBehalfOf] += amount;
        lastUpdateTime[asset][onBehalfOf] = block.timestamp;
        
        emit Supply(asset, amount, onBehalfOf, referralCode);
    }

    /**
     * @dev Withdraw assets from the pool
     * @param asset Asset address
     * @param amount Amount to withdraw
     * @param to Address to receive the assets
     * @return Amount actually withdrawn
     */
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256) {
        require(asset != address(0), "Invalid asset");
        require(amount > 0, "Amount must be greater than 0");
        require(to != address(0), "Invalid to address");
        
        uint256 userBalance = userSupply[asset][msg.sender];
        require(userBalance >= amount, "Insufficient balance");
        
        // Calculate yield
        uint256 yield = _calculateYield(asset, msg.sender);
        uint256 totalWithdrawable = userBalance + yield;
        
        uint256 actualAmount = amount;
        if (actualAmount > totalWithdrawable) {
            actualAmount = totalWithdrawable;
        }
        
        // Update state
        totalSupply[asset] -= actualAmount;
        userSupply[asset][msg.sender] -= actualAmount;
        lastUpdateTime[asset][msg.sender] = block.timestamp;
        
        // Transfer tokens to recipient
        IERC20(asset).safeTransfer(to, actualAmount);
        
        emit Withdraw(asset, actualAmount, to);
        return actualAmount;
    }

    /**
     * @dev Get user account data
     * @param user User address
     * @return totalCollateralETH Total collateral in ETH
     * @return totalDebtETH Total debt in ETH
     * @return availableBorrowsETH Available borrows in ETH
     * @return currentLiquidationThreshold Current liquidation threshold
     * @return ltv Loan to value ratio
     * @return healthFactor Health factor
     */
    function getUserAccountData(address user)
        external
        view
        returns (
            uint256 totalCollateralETH,
            uint256 totalDebtETH,
            uint256 availableBorrowsETH,
            uint256 currentLiquidationThreshold,
            uint256 ltv,
            uint256 healthFactor
        )
    {
        // Mock implementation - return safe values
        return (0, 0, 0, 8000, 7500, type(uint256).max);
    }

    /**
     * @dev Get reserve data
     * @param asset Asset address
     * @return Reserve data struct (simplified)
     */
    function getReserveData(address asset)
        external
        view
        returns (
            uint256 configuration,
            uint128 liquidityIndex,
            uint128 currentLiquidityRate,
            uint128 variableBorrowIndex,
            uint128 currentVariableBorrowRate,
            uint128 currentStableBorrowRate,
            uint40 lastUpdateTimestamp,
            uint16 id,
            address aTokenAddress,
            address stableDebtTokenAddress,
            address variableDebtTokenAddress,
            address interestRateStrategyAddress,
            uint128 accruedToTreasury,
            uint128 unbacked,
            uint128 isolationModeTotalDebt
        )
    {
        return (
            0, // configuration
            1e27, // liquidityIndex
            uint128(liquidityRate[asset]), // currentLiquidityRate
            1e27, // variableBorrowIndex
            uint128(variableBorrowRate[asset]), // currentVariableBorrowRate
            uint128(stableBorrowRate[asset]), // currentStableBorrowRate
            uint40(block.timestamp), // lastUpdateTimestamp
            0, // id
            address(0), // aTokenAddress
            address(0), // stableDebtTokenAddress
            address(0), // variableDebtTokenAddress
            address(0), // interestRateStrategyAddress
            0, // accruedToTreasury
            0, // unbacked
            0 // isolationModeTotalDebt
        );
    }

    /**
     * @dev Calculate yield for a user
     * @param asset Asset address
     * @param user User address
     * @return Yield amount
     */
    function _calculateYield(address asset, address user) internal view returns (uint256) {
        uint256 userBalance = userSupply[asset][user];
        if (userBalance == 0) return 0;
        
        uint256 timeElapsed = block.timestamp - lastUpdateTime[asset][user];
        uint256 rate = liquidityRate[asset];
        
        // Calculate yield: balance * rate * time / (365 days * 10000)
        return (userBalance * rate * timeElapsed) / (365 days * 10000);
    }

    /**
     * @dev Get user balance including yield
     * @param asset Asset address
     * @param user User address
     * @return Total balance including yield
     */
    function getUserBalance(address asset, address user) external view returns (uint256) {
        uint256 userBalance = userSupply[asset][user];
        uint256 yield = _calculateYield(asset, user);
        return userBalance + yield;
    }

    /**
     * @dev Set liquidity rate for an asset (for testing)
     * @param asset Asset address
     * @param rate New liquidity rate in basis points
     */
    function setLiquidityRate(address asset, uint256 rate) external {
        liquidityRate[asset] = rate;
    }

    /**
     * @dev Get total supply for an asset
     * @param asset Asset address
     * @return Total supply
     */
    function getTotalSupply(address asset) external view returns (uint256) {
        return totalSupply[asset];
    }
}
