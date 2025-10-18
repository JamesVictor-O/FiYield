// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MultiTokenCoordinatorVault
 * @dev Main vault that coordinates multi-token deposits and rebalancing
 * @author NexYield Team
 */
contract MultiTokenCoordinatorVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // State variables
    address public agentExecutor;
    address public strategy;

    // Supported tokens and their vaults
    mapping(address => bool) public supportedTokens;
    mapping(address => address) public tokenVaults;
    mapping(address => uint8) public tokenDecimals; // Track decimals per token

    // User portfolio tracking
    mapping(address => uint256) public userTotalValue; // Total USD value (18 decimals)
    mapping(address => mapping(address => uint256)) public userTokenBalances;

    // Price oracles with staleness protection
    mapping(address => uint256) public tokenPrices; // USD price (18 decimals)
    mapping(address => uint256) public priceUpdatedAt;
    uint256 public constant MAX_PRICE_AGE = 1 hours;

    // Total portfolio tracking
    uint256 public totalPortfolioValue;

    // Events
    event TokenDeposited(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 usdValue
    );
    event TokenWithdrawn(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 usdValue
    );
    event PortfolioRebalanced(
        address indexed user,
        address fromToken,
        address toToken,
        uint256 amount
    );
    event TokenVaultAdded(address indexed token, address indexed vault);
    event TokenPriceUpdated(address indexed token, uint256 price);
    event AgentExecutorUpdated(
        address indexed oldAgent,
        address indexed newAgent
    );

    constructor() Ownable(msg.sender) {}

    // ============ ADMIN FUNCTIONS ============

    function setAgentExecutor(address _agentExecutor) external onlyOwner {
        require(_agentExecutor != address(0), "Invalid agent address");
        address oldAgent = agentExecutor;
        agentExecutor = _agentExecutor;
        emit AgentExecutorUpdated(oldAgent, _agentExecutor);
    }

    function setStrategy(address _strategy) external onlyOwner {
        require(_strategy != address(0), "Invalid strategy address");
        strategy = _strategy;
    }

    function addTokenVault(address token, address vault) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(vault != address(0), "Invalid vault address");
        require(!supportedTokens[token], "Token already supported");

        supportedTokens[token] = true;
        tokenVaults[token] = vault;
        tokenDecimals[token] = IERC20Metadata(token).decimals();

        emit TokenVaultAdded(token, vault);
    }

    function updateTokenPrice(address token, uint256 price) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        require(price > 0, "Price must be > 0");

        tokenPrices[token] = price;
        priceUpdatedAt[token] = block.timestamp;

        emit TokenPriceUpdated(token, price);
    }

    // ============ USER FUNCTIONS ============

    /**
     * @notice Deposit tokens into the vault
     * @dev Only msg.sender can deposit for themselves (removed receiver param for security)
     */
    function deposit(
        address token,
        uint256 amount
    ) external nonReentrant returns (uint256) {
        require(supportedTokens[token], "Token not supported");
        require(amount > 0, "Amount must be > 0");
        _requireFreshPrice(token);

        address tokenVault = tokenVaults[token];
        require(tokenVault != address(0), "Vault not set for token");

        // Transfer token from user to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Calculate USD value (normalize to 18 decimals)
        uint256 usdValue = _calculateUsdValue(token, amount);

        // Update user balances
        userTokenBalances[msg.sender][token] += amount;
        userTotalValue[msg.sender] += usdValue;
        totalPortfolioValue += usdValue;

        // Approve and deposit to specific vault
        IERC20(token).safeIncreaseAllowance(tokenVault, amount);

        // Call deposit on the vault - FiYieldVault expects deposit(uint256, address)
        (bool success, ) = tokenVault.call(
            abi.encodeWithSignature(
                "deposit(uint256,address)",
                amount,
                address(this)
            )
        );
        require(success, "Vault deposit failed");

        emit TokenDeposited(msg.sender, token, amount, usdValue);
        return usdValue;
    }

    /**
     * @notice Withdraw tokens from the vault
     */
    function withdraw(
        address token,
        uint256 amount
    ) external nonReentrant returns (uint256) {
        require(supportedTokens[token], "Token not supported");
        require(amount > 0, "Amount must be > 0");
        require(
            userTokenBalances[msg.sender][token] >= amount,
            "Insufficient balance"
        );
        _requireFreshPrice(token);

        // Calculate USD value
        uint256 usdValue = _calculateUsdValue(token, amount);

        // Update user balances BEFORE external calls
        userTokenBalances[msg.sender][token] -= amount;
        userTotalValue[msg.sender] -= usdValue;
        totalPortfolioValue -= usdValue;

        address tokenVault = tokenVaults[token];

        // Get balance before withdrawal
        uint256 balanceBefore = IERC20(token).balanceOf(address(this));

        // Withdraw from specific vault using redeem function
        (bool success, ) = tokenVault.call(
            abi.encodeWithSignature(
                "redeem(uint256,address,address)",
                amount,
                address(this),
                address(this)
            )
        );
        require(success, "Vault withdraw failed");

        // Verify we received the tokens
        uint256 balanceAfter = IERC20(token).balanceOf(address(this));
        require(
            balanceAfter >= balanceBefore + amount,
            "Tokens not received from vault"
        );

        // Transfer token to user
        IERC20(token).safeTransfer(msg.sender, amount);

        emit TokenWithdrawn(msg.sender, token, amount, usdValue);
        return usdValue;
    }

    // ============ AGENT FUNCTIONS ============

    /**
     * @notice Rebalance user portfolio (agent only)
     * @dev This is still just accounting - you need DEX integration for actual swaps
     */
    function rebalancePortfolio(
        address user,
        address fromToken,
        address toToken,
        uint256 amount
    ) external {
        require(msg.sender == agentExecutor, "Only agent can rebalance");
        require(
            supportedTokens[fromToken] && supportedTokens[toToken],
            "Tokens not supported"
        );
        require(
            userTokenBalances[user][fromToken] >= amount,
            "Insufficient balance"
        );
        _requireFreshPrice(fromToken);
        _requireFreshPrice(toToken);

        // Calculate USD value
        uint256 usdValue = _calculateUsdValue(fromToken, amount);

        // Calculate how many toTokens to receive
        uint256 toTokenAmount = _calculateTokenAmount(toToken, usdValue);

        // Update balances (NOTE: This doesn't actually swap tokens!)
        userTokenBalances[user][fromToken] -= amount;
        userTokenBalances[user][toToken] += toTokenAmount;

        // TODO: Implement actual token swap via DEX
        // For now, this only updates accounting

        emit PortfolioRebalanced(user, fromToken, toToken, amount);
    }

    // ============ VIEW FUNCTIONS ============

    function getUserTotalValue(address user) external view returns (uint256) {
        return userTotalValue[user];
    }

    function getUserTokenBalance(
        address user,
        address token
    ) external view returns (uint256) {
        return userTokenBalances[user][token];
    }

    function getTotalPortfolioValue() external view returns (uint256) {
        return totalPortfolioValue;
    }

    function isPriceStale(address token) public view returns (bool) {
        return block.timestamp > priceUpdatedAt[token] + MAX_PRICE_AGE;
    }

    // ============ INTERNAL FUNCTIONS ============

    function _calculateUsdValue(
        address token,
        uint256 amount
    ) internal view returns (uint256) {
        // Normalize amount to 18 decimals, then multiply by price (18 decimals)
        uint256 normalizedAmount = _normalizeDecimals(
            amount,
            tokenDecimals[token],
            18
        );
        return (normalizedAmount * tokenPrices[token]) / 1e18;
    }

    function _calculateTokenAmount(
        address token,
        uint256 usdValue
    ) internal view returns (uint256) {
        require(tokenPrices[token] > 0, "Invalid token price");

        // Calculate amount in 18 decimals, then denormalize to token decimals
        uint256 amount18 = (usdValue * 1e18) / tokenPrices[token];
        return _normalizeDecimals(amount18, 18, tokenDecimals[token]);
    }

    function _normalizeDecimals(
        uint256 amount,
        uint8 fromDecimals,
        uint8 toDecimals
    ) internal pure returns (uint256) {
        if (fromDecimals == toDecimals) {
            return amount;
        } else if (fromDecimals < toDecimals) {
            return amount * (10 ** (toDecimals - fromDecimals));
        } else {
            return amount / (10 ** (fromDecimals - toDecimals));
        }
    }

    function _requireFreshPrice(address token) internal view {
        require(!isPriceStale(token), "Price is stale");
    }
}
