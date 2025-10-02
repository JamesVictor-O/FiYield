// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title AgentExecutor
 * @dev Contract that executes operations on behalf of users through delegation
 * @author NexYield Team
 */
contract AgentExecutor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Events
    event RebalanceExecuted(
        address indexed user,
        address indexed fromProtocol,
        address indexed toProtocol,
        uint256 amount,
        uint256 timestamp
    );
    
    event DepositExecuted(
        address indexed user,
        address indexed vault,
        uint256 amount,
        uint256 timestamp
    );
    
    event StrategyOptimized(
        address indexed user,
        address indexed oldStrategy,
        address indexed newStrategy,
        uint256 amount,
        uint256 timestamp
    );

    // State variables
    mapping(address => bool) public authorizedVaults;
    mapping(address => bool) public authorizedStrategies;
    mapping(address => uint256) public userLastRebalance;
    mapping(address => uint256) public userLastDeposit;
    
    // Cooldown periods (in seconds)
    uint256 public rebalanceCooldown = 3600; // 1 hour
    uint256 public depositCooldown = 1800; // 30 minutes
    
    // Maximum amounts per operation
    uint256 public maxRebalanceAmount = 1000 * 10**6; // $1000
    uint256 public maxDepositAmount = 5000 * 10**6; // $5000

    constructor() {}

    /**
     * @dev Authorize a vault contract
     * @param vault Address of the vault to authorize
     * @param authorized Whether the vault is authorized
     */
    function setAuthorizedVault(address vault, bool authorized) external onlyOwner {
        authorizedVaults[vault] = authorized;
    }

    /**
     * @dev Authorize a strategy contract
     * @param strategy Address of the strategy to authorize
     * @param authorized Whether the strategy is authorized
     */
    function setAuthorizedStrategy(address strategy, bool authorized) external onlyOwner {
        authorizedStrategies[strategy] = authorized;
    }

    /**
     * @dev Set cooldown periods
     * @param _rebalanceCooldown New rebalance cooldown in seconds
     * @param _depositCooldown New deposit cooldown in seconds
     */
    function setCooldowns(uint256 _rebalanceCooldown, uint256 _depositCooldown) external onlyOwner {
        rebalanceCooldown = _rebalanceCooldown;
        depositCooldown = _depositCooldown;
    }

    /**
     * @dev Set maximum amounts per operation
     * @param _maxRebalanceAmount New maximum rebalance amount
     * @param _maxDepositAmount New maximum deposit amount
     */
    function setMaxAmounts(uint256 _maxRebalanceAmount, uint256 _maxDepositAmount) external onlyOwner {
        maxRebalanceAmount = _maxRebalanceAmount;
        maxDepositAmount = _maxDepositAmount;
    }

    /**
     * @dev Execute rebalance operation on behalf of user
     * @param user User's smart account address
     * @param fromProtocol Protocol to rebalance from
     * @param toProtocol Protocol to rebalance to
     * @param amount Amount to rebalance
     */
    function rebalance(
        address user,
        address fromProtocol,
        address toProtocol,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(authorizedStrategies[fromProtocol], "From protocol not authorized");
        require(authorizedStrategies[toProtocol], "To protocol not authorized");
        require(amount <= maxRebalanceAmount, "Amount exceeds maximum");
        require(
            block.timestamp >= userLastRebalance[user] + rebalanceCooldown,
            "Rebalance cooldown not met"
        );

        // Execute rebalance through vault
        // This would typically call the vault's rebalance function
        // For now, we'll emit an event to track the operation
        
        userLastRebalance[user] = block.timestamp;
        
        emit RebalanceExecuted(user, fromProtocol, toProtocol, amount, block.timestamp);
    }

    /**
     * @dev Execute deposit operation on behalf of user
     * @param user User's smart account address
     * @param vault Vault address to deposit into
     * @param amount Amount to deposit
     */
    function deposit(
        address user,
        address vault,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(authorizedVaults[vault], "Vault not authorized");
        require(amount <= maxDepositAmount, "Amount exceeds maximum");
        require(
            block.timestamp >= userLastDeposit[user] + depositCooldown,
            "Deposit cooldown not met"
        );

        // Execute deposit through vault
        // This would typically call the vault's deposit function
        // For now, we'll emit an event to track the operation
        
        userLastDeposit[user] = block.timestamp;
        
        emit DepositExecuted(user, vault, amount, block.timestamp);
    }

    /**
     * @dev Optimize strategy for user
     * @param user User's smart account address
     * @param oldStrategy Current strategy address
     * @param newStrategy New strategy address
     * @param amount Amount to move
     */
    function optimizeStrategy(
        address user,
        address oldStrategy,
        address newStrategy,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(authorizedStrategies[oldStrategy], "Old strategy not authorized");
        require(authorizedStrategies[newStrategy], "New strategy not authorized");
        require(amount <= maxRebalanceAmount, "Amount exceeds maximum");

        // Execute strategy optimization
        // This would typically call the vault's setStrategy function
        
        emit StrategyOptimized(user, oldStrategy, newStrategy, amount, block.timestamp);
    }

    /**
     * @dev Get user's last operation timestamps
     * @param user User address
     * @return lastRebalance Last rebalance timestamp
     * @return lastDeposit Last deposit timestamp
     */
    function getUserTimestamps(address user) external view returns (uint256 lastRebalance, uint256 lastDeposit) {
        return (userLastRebalance[user], userLastDeposit[user]);
    }

    /**
     * @dev Check if user can perform rebalance
     * @param user User address
     * @return canRebalance Whether user can rebalance
     * @return timeRemaining Time remaining until next rebalance
     */
    function canRebalance(address user) external view returns (bool canRebalance, uint256 timeRemaining) {
        uint256 lastRebalance = userLastRebalance[user];
        uint256 nextRebalance = lastRebalance + rebalanceCooldown;
        
        if (block.timestamp >= nextRebalance) {
            return (true, 0);
        } else {
            return (false, nextRebalance - block.timestamp);
        }
    }

    /**
     * @dev Check if user can perform deposit
     * @param user User address
     * @return canDeposit Whether user can deposit
     * @return timeRemaining Time remaining until next deposit
     */
    function canDeposit(address user) external view returns (bool canDeposit, uint256 timeRemaining) {
        uint256 lastDeposit = userLastDeposit[user];
        uint256 nextDeposit = lastDeposit + depositCooldown;
        
        if (block.timestamp >= nextDeposit) {
            return (true, 0);
        } else {
            return (false, nextDeposit - block.timestamp);
        }
    }

    /**
     * @dev Emergency function to pause operations
     */
    function emergencyPause() external onlyOwner {
        // This would typically implement a pause mechanism
        // For now, we'll just emit an event
        emit StrategyOptimized(address(0), address(0), address(0), 0, block.timestamp);
    }
}
