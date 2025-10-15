// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract FiYieldVaultOptimized is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // State variables
    IERC20 public immutable asset;
    address public agentExecutor;
    address public strategy;

    // User deposits mapping - packed for gas efficiency
    mapping(address => uint256) public userBalances;
    mapping(address => uint256) public shares;
    mapping(address => uint8) public userRiskLevels; // Use uint8 instead of enum for gas efficiency

    // Total supply tracking
    uint256 public totalSupply;
    uint256 public totalAssets;

    // Risk levels - using uint8 for gas efficiency
    uint8 public constant CONSERVATIVE = 0;
    uint8 public constant BALANCED = 1;
    uint8 public constant AGGRESSIVE = 2;

    // Events
    event Deposit(address indexed user, uint256 amount, uint8 riskLevel);
    event Withdraw(address indexed user, uint256 amount);
    event Rebalanced(
        address indexed user,
        address fromProtocol,
        address toProtocol,
        uint256 amount
    );
    event StrategySet(address indexed strategy);
    event Invested(uint256 amount);
    event SharesTransferred(
        address indexed from,
        address indexed to,
        uint256 amount
    );

    constructor(address _asset) Ownable(msg.sender) {
        asset = IERC20(_asset);
    }

    // Set the agent executor address (only owner)
    function setAgentExecutor(address _agentExecutor) external onlyOwner {
        agentExecutor = _agentExecutor;
    }

    // Set the strategy address (only owner)
    function setStrategy(address _strategy) external onlyOwner {
        strategy = _strategy;
        emit StrategySet(_strategy);
    }

    // User deposits assets - optimized for gas
    function deposit(
        uint256 assets,
        address receiver
    ) external nonReentrant returns (uint256) {
        require(assets > 0, "Amount must be > 0");
        require(receiver != address(0), "Invalid receiver");

        // Use SafeERC20 for gas efficiency
        asset.safeTransferFrom(msg.sender, address(this), assets);

        // Calculate shares (1:1 for MVP)
        uint256 sharesToMint = assets;

        // Update state in single operation for gas efficiency
        userBalances[receiver] += assets;
        shares[receiver] += sharesToMint;
        totalSupply += sharesToMint;
        totalAssets += assets;
        userRiskLevels[receiver] = BALANCED; // Default to balanced

        emit Deposit(receiver, assets, BALANCED);
        return sharesToMint;
    }

    // Alternative deposit function with risk level
    function depositWithRisk(
        uint256 amount,
        uint8 riskLevel
    ) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(riskLevel <= AGGRESSIVE, "Invalid risk level");

        asset.safeTransferFrom(msg.sender, address(this), amount);

        userBalances[msg.sender] += amount;
        shares[msg.sender] += amount;
        totalSupply += amount;
        totalAssets += amount;
        userRiskLevels[msg.sender] = riskLevel;

        emit Deposit(msg.sender, amount, riskLevel);
    }

    // User withdraws - optimized
    function withdraw(uint256 amount) external nonReentrant {
        require(userBalances[msg.sender] >= amount, "Insufficient balance");

        userBalances[msg.sender] -= amount;
        shares[msg.sender] -= amount;
        totalSupply -= amount;
        totalAssets -= amount;

        asset.safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    // Withdraw with shares (ERC4626 style) - optimized
    function redeem(
        uint256 sharesAmount,
        address receiver,
        address owner
    ) external nonReentrant returns (uint256) {
        require(sharesAmount > 0, "Invalid shares");
        require(receiver != address(0), "Invalid receiver");

        if (msg.sender != owner) {
            revert("Not authorized");
        }

        require(sharesAmount <= shares[owner], "Insufficient shares");

        uint256 assets = sharesAmount; // 1:1 for MVP

        userBalances[owner] -= assets;
        shares[owner] -= sharesAmount;
        totalSupply -= sharesAmount;
        totalAssets -= assets;

        asset.safeTransfer(receiver, assets);
        emit Withdraw(owner, assets);
        return assets;
    }

    // Send shares to another user (for send functionality) - optimized
    function sendShares(
        address to,
        uint256 sharesAmount
    ) external nonReentrant {
        require(to != address(0), "Invalid recipient");
        require(sharesAmount > 0, "Amount must be > 0");
        require(shares[msg.sender] >= sharesAmount, "Insufficient shares");

        // Transfer shares and corresponding balance
        shares[msg.sender] -= sharesAmount;
        shares[to] += sharesAmount;

        uint256 assetsAmount = sharesAmount; // 1:1 for MVP
        userBalances[msg.sender] -= assetsAmount;
        userBalances[to] += assetsAmount;

        emit SharesTransferred(msg.sender, to, sharesAmount);
    }

    // Only agent can rebalance
    function rebalance(
        address user,
        address fromProtocol,
        address toProtocol,
        uint256 amount
    ) external {
        require(msg.sender == agentExecutor, "Only agent can rebalance");
        require(userBalances[user] >= amount, "Insufficient user balance");
        emit Rebalanced(user, fromProtocol, toProtocol, amount);
    }

    // Agent can invest funds into strategy
    function invest(uint256 amount) external {
        require(msg.sender == agentExecutor, "Only agent can invest");
        require(strategy != address(0), "Strategy not set");
        require(amount <= totalAssets, "Insufficient assets");

        // Update totalAssets before transferring
        totalAssets -= amount;

        asset.safeTransfer(strategy, amount);

        (bool success, ) = strategy.call(
            abi.encodeWithSignature("invest(uint256)", amount)
        );
        require(success, "Strategy invest failed");

        emit Invested(amount);
    }

    // View functions - optimized for gas
    function getBalance(address user) external view returns (uint256) {
        return userBalances[user];
    }

    function getRiskLevel(address user) external view returns (uint8) {
        return userRiskLevels[user];
    }

    // ERC4626 compatible functions
    function convertToShares(uint256 assets) external pure returns (uint256) {
        return assets; // 1:1 for MVP
    }

    function convertToAssets(
        uint256 sharesAmount
    ) external pure returns (uint256) {
        return sharesAmount; // 1:1 for MVP
    }

    function maxDeposit(address) external pure returns (uint256) {
        return type(uint256).max;
    }

    function maxMint(address) external pure returns (uint256) {
        return type(uint256).max;
    }

    function maxWithdraw(address owner) external view returns (uint256) {
        return userBalances[owner];
    }

    function maxRedeem(address owner) external view returns (uint256) {
        return shares[owner];
    }

    function previewDeposit(uint256 assets) external pure returns (uint256) {
        return assets;
    }

    function previewMint(uint256 sharesAmount) external pure returns (uint256) {
        return sharesAmount;
    }

    function previewWithdraw(uint256 assets) external pure returns (uint256) {
        return assets;
    }

    function previewRedeem(
        uint256 sharesAmount
    ) external pure returns (uint256) {
        return sharesAmount;
    }
}
