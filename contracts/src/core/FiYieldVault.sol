// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract FiYieldVault is Ownable, ReentrancyGuard {
    // State variables
    IERC20 public immutable asset; // Changed from depositToken to asset for consistency
    address public agentExecutor;
    address public strategy; // Add strategy address

    // User deposits mapping
    mapping(address => uint256) public userBalances;
    mapping(address => RiskLevel) public userRiskLevels;
    mapping(address => uint256) public shares; // Add shares tracking

    // Total supply tracking
    uint256 public totalSupply;
    uint256 public totalAssets;

    // Risk levels
    enum RiskLevel {
        Conservative,
        Balanced,
        Aggressive
    }

    // Events
    event Deposit(address indexed user, uint256 amount, RiskLevel riskLevel);
    event Withdraw(address indexed user, uint256 amount);
    event Rebalanced(
        address indexed user,
        address fromProtocol,
        address toProtocol,
        uint256 amount
    );
    event StrategySet(address indexed strategy);
    event Invested(uint256 amount);

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

    // User deposits assets - matches frontend expectation
    function deposit(
        uint256 assets,
        address receiver
    ) external nonReentrant returns (uint256) {
        require(assets > 0, "Amount must be > 0");
        require(receiver != address(0), "Invalid receiver");
        require(
            asset.transferFrom(msg.sender, address(this), assets),
            "Transfer failed"
        );

        // Calculate shares (1:1 for simplicity in MVP)
        uint256 sharesToMint = assets;

        userBalances[receiver] += assets;
        shares[receiver] += sharesToMint;
        totalSupply += sharesToMint;
        totalAssets += assets;

        // Set default risk level to Balanced for MVP
        userRiskLevels[receiver] = RiskLevel.Balanced;

        emit Deposit(receiver, assets, RiskLevel.Balanced);
        return sharesToMint;
    }

    // Alternative deposit function with risk level
    function depositWithRisk(
        uint256 amount,
        RiskLevel riskLevel
    ) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(
            asset.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        userBalances[msg.sender] += amount;
        userRiskLevels[msg.sender] = riskLevel;
        shares[msg.sender] += amount;
        totalSupply += amount;
        totalAssets += amount;

        emit Deposit(msg.sender, amount, riskLevel);
    }

    // User withdraws
    function withdraw(uint256 amount) external nonReentrant {
        require(userBalances[msg.sender] >= amount, "Insufficient balance");

        userBalances[msg.sender] -= amount;
        shares[msg.sender] -= amount;
        totalSupply -= amount;
        totalAssets -= amount;

        require(asset.transfer(msg.sender, amount), "Transfer failed");

        emit Withdraw(msg.sender, amount);
    }

    // Withdraw with shares (ERC4626 style)
    function redeem(
        uint256 sharesAmount,
        address receiver,
        address owner
    ) external nonReentrant returns (uint256) {
        require(sharesAmount > 0, "Invalid shares");
        require(receiver != address(0), "Invalid receiver");

        if (msg.sender != owner) {
            // Add approval logic here if needed
            revert("Not authorized");
        }

        require(sharesAmount <= this.shares(owner), "Insufficient shares");

        uint256 assets = sharesAmount; // 1:1 for MVP

        userBalances[owner] -= assets;
        shares[owner] -= sharesAmount;
        totalSupply -= sharesAmount;
        totalAssets -= assets;

        require(asset.transfer(receiver, assets), "Transfer failed");

        emit Withdraw(owner, assets);
        return assets;
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

        // Rebalancing logic here (withdraw from one protocol, deposit to another)
        // For MVP, just emit event

        emit Rebalanced(user, fromProtocol, toProtocol, amount);
    }

    // Agent can invest funds into strategy
    function invest(uint256 amount) external {
        require(msg.sender == agentExecutor, "Only agent can invest");
        require(strategy != address(0), "Strategy not set");
        require(amount <= totalAssets, "Insufficient assets");

        // Transfer assets to strategy
        require(
            asset.transfer(strategy, amount),
            "Transfer to strategy failed"
        );

        // Call strategy invest function
        (bool success, ) = strategy.call(
            abi.encodeWithSignature("invest(uint256)", amount)
        );
        require(success, "Strategy invest failed");

        emit Invested(amount);
    }

    // View functions
    function getBalance(address user) external view returns (uint256) {
        return userBalances[user];
    }

    function getRiskLevel(address user) external view returns (RiskLevel) {
        return userRiskLevels[user];
    }

    // ERC4626 compatible functions - using state variables directly

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
