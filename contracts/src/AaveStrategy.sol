// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title AaveStrategy
 * @dev Strategy contract for Aave lending protocol integration
 * @author NexYield Team
 */
contract AaveStrategy is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Events
    event Invested(uint256 amount);
    event Withdrawn(uint256 amount);
    event Harvested(uint256 yield);
    event EmergencyWithdrawExecuted();

    // State variables
    IERC20 public immutable asset;
    address public immutable aavePool;
    address public immutable aToken;
    address public immutable vault;
    
    uint256 public totalInvested;
    uint256 public totalWithdrawn;
    uint256 public totalYield;

    // Risk management
    uint256 public maxInvestmentRatio = 9500; // 95% max investment
    uint256 public constant MAX_RATIO = 10000; // 100%

    constructor(
        address _asset,
        address _aavePool,
        address _aToken,
        address _vault
    ) {
        require(_asset != address(0), "Invalid asset");
        require(_aavePool != address(0), "Invalid Aave pool");
        require(_aToken != address(0), "Invalid aToken");
        require(_vault != address(0), "Invalid vault");
        
        asset = IERC20(_asset);
        aavePool = _aavePool;
        aToken = _aToken;
        vault = _vault;
    }

    /**
     * @dev Invest assets into Aave
     * @param amount Amount to invest
     */
    function invest(uint256 amount) external nonReentrant {
        require(msg.sender == vault, "Only vault can call");
        require(amount > 0, "Amount must be greater than 0");
        
        // Check if we have enough balance
        uint256 balance = asset.balanceOf(address(this));
        require(balance >= amount, "Insufficient balance");
        
        // Approve Aave pool to spend tokens
        asset.safeApprove(aavePool, amount);
        
        // Supply to Aave
        (bool success,) = aavePool.call(
            abi.encodeWithSignature("supply(address,uint256,address,uint16)", 
                address(asset), amount, address(this), 0)
        );
        require(success, "Aave supply failed");
        
        totalInvested += amount;
        emit Invested(amount);
    }

    /**
     * @dev Withdraw assets from Aave
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(msg.sender == vault, "Only vault can call");
        require(amount > 0, "Amount must be greater than 0");
        
        // Get current aToken balance
        uint256 aTokenBalance = IERC20(aToken).balanceOf(address(this));
        require(aTokenBalance > 0, "No aTokens to withdraw");
        
        // Calculate how much to withdraw (convert to aToken amount)
        uint256 withdrawAmount = amount;
        if (withdrawAmount > aTokenBalance) {
            withdrawAmount = aTokenBalance;
        }
        
        // Withdraw from Aave
        (bool success,) = aavePool.call(
            abi.encodeWithSignature("withdraw(address,uint256,address)", 
                address(asset), withdrawAmount, address(this))
        );
        require(success, "Aave withdraw failed");
        
        // Transfer assets back to vault
        uint256 actualWithdrawn = asset.balanceOf(address(this));
        asset.safeTransfer(vault, actualWithdrawn);
        
        totalWithdrawn += actualWithdrawn;
        emit Withdrawn(actualWithdrawn);
    }

    /**
     * @dev Harvest yield from Aave
     * @return yieldAmount Amount of yield harvested
     */
    function harvest() external nonReentrant returns (uint256 yieldAmount) {
        require(msg.sender == vault, "Only vault can call");
        
        // Get current aToken balance
        uint256 aTokenBalance = IERC20(aToken).balanceOf(address(this));
        if (aTokenBalance == 0) return 0;
        
        // Calculate yield (aToken balance - total invested)
        uint256 currentValue = aTokenBalance;
        uint256 investedValue = totalInvested - totalWithdrawn;
        
        if (currentValue > investedValue) {
            yieldAmount = currentValue - investedValue;
            
            // Withdraw yield
            (bool success,) = aavePool.call(
                abi.encodeWithSignature("withdraw(address,uint256,address)", 
                    address(asset), yieldAmount, address(this))
            );
            require(success, "Aave yield withdrawal failed");
            
            // Transfer yield to vault
            asset.safeTransfer(vault, yieldAmount);
            
            totalYield += yieldAmount;
            emit Harvested(yieldAmount);
        }
        
        return yieldAmount;
    }

    /**
     * @dev Get total assets managed by this strategy
     * @return Total assets including yield
     */
    function totalAssets() external view returns (uint256) {
        return IERC20(aToken).balanceOf(address(this));
    }

    /**
     * @dev Get current yield rate (APY)
     * @return Current yield rate in basis points
     */
    function getCurrentYieldRate() external view returns (uint256) {
        // This would typically call Aave's rate oracle
        // For now, return a mock rate
        return 500; // 5% APY
    }

    /**
     * @dev Emergency withdraw all assets
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 aTokenBalance = IERC20(aToken).balanceOf(address(this));
        if (aTokenBalance > 0) {
            (bool success,) = aavePool.call(
                abi.encodeWithSignature("withdraw(address,uint256,address)", 
                    address(asset), aTokenBalance, address(this))
            );
            require(success, "Emergency withdrawal failed");
        }
        
        // Transfer all assets to vault
        uint256 balance = asset.balanceOf(address(this));
        if (balance > 0) {
            asset.safeTransfer(vault, balance);
        }
        
        emit EmergencyWithdrawExecuted();
    }

    /**
     * @dev Set maximum investment ratio
     * @param _ratio New maximum investment ratio (in basis points)
     */
    function setMaxInvestmentRatio(uint256 _ratio) external onlyOwner {
        require(_ratio <= MAX_RATIO, "Ratio too high");
        maxInvestmentRatio = _ratio;
    }

    /**
     * @dev Get strategy information
     * @return Strategy details
     */
    function getStrategyInfo() external view returns (
        address _asset,
        address _aavePool,
        address _aToken,
        uint256 _totalInvested,
        uint256 _totalWithdrawn,
        uint256 _totalYield,
        uint256 _currentBalance
    ) {
        return (
            address(asset),
            aavePool,
            aToken,
            totalInvested,
            totalWithdrawn,
            totalYield,
            IERC20(aToken).balanceOf(address(this))
        );
    }
}
