// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AaveStrategy.sol";
import "../src/MockAavePool.sol";
import "../src/core/FiYieldVaultOptimized.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        _mint(msg.sender, 1000000 * 10 ** 6); // 1M USDC
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract AaveStrategyTest is Test {
    AaveStrategy public strategy;
    MockAavePool public mockAavePool;
    FiYieldVaultOptimized public vault;
    MockUSDC public mockUSDC;

    address public vaultAddress = address(0x1);
    address public user1 = address(0x2);
    address public owner = address(0x3);

    function setUp() public {
        // Deploy mock USDC
        mockUSDC = new MockUSDC();

        // Deploy mock Aave pool
        mockAavePool = new MockAavePool();

        // Deploy vault
        vault = new FiYieldVaultOptimized(address(mockUSDC));

        // Deploy strategy
        strategy = new AaveStrategy(
            address(mockUSDC),
            address(mockAavePool),
            address(mockUSDC), // Using mockUSDC as aToken
            address(vault)
        );

        // Give strategy some USDC for testing
        mockUSDC.transfer(address(strategy), 10000 * 10 ** 6);
    }

    function testInvest() public {
        uint256 investAmount = 1000 * 10 ** 6;
        uint256 strategyBalanceBefore = mockUSDC.balanceOf(address(strategy));

        // Only vault can invest
        vm.prank(address(vault));
        strategy.invest(investAmount);

        // Check that funds were transferred to Aave pool
        assertEq(
            mockUSDC.balanceOf(address(strategy)),
            strategyBalanceBefore - investAmount
        );
    }

    function testWithdraw() public {
        uint256 withdrawAmount = 500 * 10 ** 6;
        uint256 strategyBalanceBefore = mockUSDC.balanceOf(address(strategy));

        // Only vault can withdraw
        vm.prank(address(vault));
        strategy.withdraw(withdrawAmount);

        // Check that funds were withdrawn
        assertEq(
            mockUSDC.balanceOf(address(strategy)),
            strategyBalanceBefore - withdrawAmount
        );
    }

    function testHarvest() public {
        uint256 yieldAmount = 100 * 10 ** 6;

        // Simulate yield by transferring to strategy
        mockUSDC.transfer(address(strategy), yieldAmount);

        // Harvest yield
        uint256 harvested = strategy.harvest();

        // Check that yield was harvested
        assertEq(harvested, yieldAmount);
    }

    function testTotalAssets() public {
        uint256 totalAssets = strategy.totalAssets();
        assertEq(totalAssets, mockUSDC.balanceOf(address(strategy)));
    }

    function testGetCurrentYieldRate() public {
        uint256 yieldRate = strategy.getCurrentYieldRate();
        assertTrue(yieldRate >= 0);
    }

    function testEmergencyWithdraw() public {
        uint256 strategyBalance = mockUSDC.balanceOf(address(strategy));

        // Only owner can emergency withdraw
        vm.prank(owner);
        strategy.emergencyWithdraw();

        // Check that all funds were withdrawn
        assertEq(mockUSDC.balanceOf(address(strategy)), 0);
    }

    function testAccessControl() public {
        uint256 amount = 1000 * 10 ** 6;

        // Non-vault cannot invest
        vm.prank(user1);
        vm.expectRevert("Only vault can call");
        strategy.invest(amount);

        // Non-vault cannot withdraw
        vm.prank(user1);
        vm.expectRevert("Only vault can call");
        strategy.withdraw(amount);

        // Non-owner cannot emergency withdraw
        vm.prank(user1);
        vm.expectRevert();
        strategy.emergencyWithdraw();
    }

    function testSetMaxInvestmentRatio() public {
        uint256 newRatio = 5000; // 50%

        // Only owner can set ratio
        vm.prank(owner);
        strategy.setMaxInvestmentRatio(newRatio);

        // Check that ratio was set
        assertEq(strategy.maxInvestmentRatio(), newRatio);
    }

    function testGetStrategyInfo() public {
        (
            address _asset,
            address _aavePool,
            address _aToken,
            uint256 _totalInvested,
            uint256 _totalWithdrawn,
            uint256 _totalYield,
            uint256 _currentBalance
        ) = strategy.getStrategyInfo();

        assertEq(_asset, address(mockUSDC));
        assertEq(_aavePool, address(mockAavePool));
        assertEq(_aToken, address(mockUSDC));
        assertEq(_currentBalance, mockUSDC.balanceOf(address(strategy)));
    }

    function testInvestWithInsufficientBalance() public {
        uint256 amount = 100000 * 10 ** 6; // More than strategy has

        vm.prank(address(vault));
        vm.expectRevert("Insufficient balance");
        strategy.invest(amount);
    }

    function testInvestWithZeroAmount() public {
        vm.prank(address(vault));
        vm.expectRevert("Amount must be greater than 0");
        strategy.invest(0);
    }

    function testWithdrawWithZeroAmount() public {
        vm.prank(address(vault));
        vm.expectRevert("Amount must be greater than 0");
        strategy.withdraw(0);
    }

    function testMultipleInvestments() public {
        uint256 amount1 = 1000 * 10 ** 6;
        uint256 amount2 = 2000 * 10 ** 6;

        // First investment
        vm.prank(address(vault));
        strategy.invest(amount1);

        // Second investment
        vm.prank(address(vault));
        strategy.invest(amount2);

        // Check total invested
        assertEq(strategy.totalInvested(), amount1 + amount2);
    }

    function testMultipleWithdrawals() public {
        uint256 investAmount = 5000 * 10 ** 6;
        uint256 withdrawAmount1 = 1000 * 10 ** 6;
        uint256 withdrawAmount2 = 2000 * 10 ** 6;

        // First invest
        vm.prank(address(vault));
        strategy.invest(investAmount);

        // First withdrawal
        vm.prank(address(vault));
        strategy.withdraw(withdrawAmount1);

        // Second withdrawal
        vm.prank(address(vault));
        strategy.withdraw(withdrawAmount2);

        // Check total withdrawn
        assertEq(strategy.totalWithdrawn(), withdrawAmount1 + withdrawAmount2);
    }
}
