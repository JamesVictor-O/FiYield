// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract FiYieldVault is Ownable, ReentrancyGuard {
    // State variables
    IERC20 public immutable depositToken;
    address public agentExecutor;
    
    // User deposits mapping
    mapping(address => uint256) public userBalances;
    mapping(address => RiskLevel) public userRiskLevels;
    
    // Risk levels
    enum RiskLevel { Conservative, Balanced, Aggressive }
    
    // Events
    event Deposit(address indexed user, uint256 amount, RiskLevel riskLevel);
    event Withdraw(address indexed user, uint256 amount);
    event Rebalanced(address indexed user, address fromProtocol, address toProtocol, uint256 amount);
    
    constructor(address _depositToken) Ownable(msg.sender) {
        depositToken = IERC20(_depositToken);
    }
    
    // Set the agent executor address (only owner)
    function setAgentExecutor(address _agentExecutor) external onlyOwner {
        agentExecutor = _agentExecutor;
    }
    
    // User deposits USDC
    function deposit(uint256 amount, RiskLevel riskLevel) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(depositToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        userBalances[msg.sender] += amount;
        userRiskLevels[msg.sender] = riskLevel;
        
        emit Deposit(msg.sender, amount, riskLevel);
    }
    
    // User withdraws
    function withdraw(uint256 amount) external nonReentrant {
        require(userBalances[msg.sender] >= amount, "Insufficient balance");
        
        userBalances[msg.sender] -= amount;
        require(depositToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit Withdraw(msg.sender, amount);
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
    
    // View functions
    function getBalance(address user) external view returns (uint256) {
        return userBalances[user];
    }
    
    function getRiskLevel(address user) external view returns (RiskLevel) {
        return userRiskLevels[user];
    }
}