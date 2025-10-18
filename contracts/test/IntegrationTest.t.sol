// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/core/FiYieldVaultOptimized.sol";
import "../src/AgentExecutor.sol";
import "../src/AaveStrategy.sol";
import "../src/MockAavePool.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        _mint(msg.sender, 1000000 * 10 ** 6); // 1M USDC
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract IntegrationTest is Test {
    FiYieldVaultOptimized public vault;
    AgentExecutor public agentExecutor;
    AaveStrategy public strategy;
    MockAavePool public mockAavePool;
    MockUSDC public mockUSDC;

    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public owner = address(0x3);

    function setUp() public {
        // Deploy mock USDC
        mockUSDC = new MockUSDC();

        // Deploy vault
        vault = new FiYieldVaultOptimized(address(mockUSDC));

        // Deploy mock Aave pool
        mockAavePool = new MockAavePool();

        // Deploy strategy
        strategy = new AaveStrategy(
            address(mockUSDC),
            address(mockAavePool),
            address(mockUSDC),
            address(vault)
        );

        // Deploy agent executor
        agentExecutor = new AgentExecutor();

        // Configure vault
        vault.setAgentExecutor(address(agentExecutor));
        vault.setStrategy(address(strategy));

        // Configure agent executor
        agentExecutor.setAuthorizedVault(address(vault), true);
        agentExecutor.setAuthorizedStrategy(address(strategy), true);
        agentExecutor.setCooldowns(3600, 1800);
        agentExecutor.setMaxAmounts(1000 * 10 ** 6, 5000 * 10 ** 6);

        // Give users some USDC
        mockUSDC.transfer(user1, 10000 * 10 ** 6);
        mockUSDC.transfer(user2, 10000 * 10 ** 6);

        // Users approve vault to spend their USDC
        vm.prank(user1);
        mockUSDC.approve(address(vault), type(uint256).max);

        vm.prank(user2);
        mockUSDC.approve(address(vault), type(uint256).max);
    }

    function testCompleteUserFlow() public {
        uint256 depositAmount = 1000 * 10 ** 6;

        // 1. User deposits
        vm.prank(user1);
        vault.deposit(depositAmount, user1);

        assertEq(vault.getBalance(user1), depositAmount);
        assertEq(vault.totalAssets(), depositAmount);

        // 2. Agent invests funds
        vm.prank(owner);
        agentExecutor.investFunds(address(vault), depositAmount / 2);

        assertEq(vault.totalAssets(), depositAmount / 2);

        // 3. User withdraws
        uint256 withdrawAmount = 200 * 10 ** 6;
        vm.prank(user1);
        vault.withdraw(withdrawAmount);

        assertEq(vault.getBalance(user1), depositAmount - withdrawAmount);
        assertEq(vault.totalAssets(), depositAmount / 2 - withdrawAmount);
    }

    function testMultipleUsersFlow() public {
        uint256 depositAmount1 = 1000 * 10 ** 6;
        uint256 depositAmount2 = 2000 * 10 ** 6;

        // User1 deposits
        vm.prank(user1);
        vault.deposit(depositAmount1, user1);

        // User2 deposits
        vm.prank(user2);
        vault.deposit(depositAmount2, user2);

        assertEq(vault.getBalance(user1), depositAmount1);
        assertEq(vault.getBalance(user2), depositAmount2);
        assertEq(vault.totalAssets(), depositAmount1 + depositAmount2);

        // Agent invests half of total
        uint256 investAmount = (depositAmount1 + depositAmount2) / 2;
        vm.prank(owner);
        agentExecutor.investFunds(address(vault), investAmount);

        assertEq(vault.totalAssets(), investAmount);
    }

    function testSendSharesFlow() public {
        uint256 depositAmount = 1000 * 10 ** 6;

        // User1 deposits
        vm.prank(user1);
        vault.deposit(depositAmount, user1);

        // User1 sends shares to User2
        uint256 sendAmount = 300 * 10 ** 6;
        vm.prank(user1);
        vault.sendShares(user2, sendAmount);

        assertEq(vault.getBalance(user1), depositAmount - sendAmount);
        assertEq(vault.getBalance(user2), sendAmount);
        assertEq(vault.shares(user1), depositAmount - sendAmount);
        assertEq(vault.shares(user2), sendAmount);
    }

    function testAgentOperations() public {
        uint256 depositAmount = 1000 * 10 ** 6;

        // User deposits
        vm.prank(user1);
        vault.deposit(depositAmount, user1);

        // Agent rebalances
        vm.prank(owner);
        agentExecutor.rebalance(
            user1,
            address(0x1),
            address(0x2),
            500 * 10 ** 6
        );

        // Agent deposits for user
        vm.prank(owner);
        agentExecutor.deposit(user1, address(vault), 200 * 10 ** 6);

        // Agent invests funds
        vm.prank(owner);
        agentExecutor.investFunds(address(vault), 300 * 10 ** 6);

        // Check final state
        assertEq(vault.getBalance(user1), depositAmount + 200 * 10 ** 6);
        assertEq(
            vault.totalAssets(),
            depositAmount + 200 * 10 ** 6 - 300 * 10 ** 6
        );
    }

    function testRiskLevels() public {
        uint256 depositAmount = 1000 * 10 ** 6;

        // User deposits with different risk levels
        vm.prank(user1);
        vault.depositWithRisk(depositAmount, vault.CONSERVATIVE());

        vm.prank(user2);
        vault.depositWithRisk(depositAmount, vault.AGGRESSIVE());

        assertEq(vault.getRiskLevel(user1), vault.CONSERVATIVE());
        assertEq(vault.getRiskLevel(user2), vault.AGGRESSIVE());
    }

    function testCooldowns() public {
        uint256 amount = 500 * 10 ** 6;

        // First operation
        vm.prank(owner);
        agentExecutor.rebalance(user1, address(0x1), address(0x2), amount);

        vm.prank(owner);
        agentExecutor.deposit(user1, address(vault), amount);

        // Try to do operations again immediately (should fail)
        vm.prank(owner);
        vm.expectRevert("Rebalance cooldown not met");
        agentExecutor.rebalance(user1, address(0x1), address(0x2), amount);

        vm.prank(owner);
        vm.expectRevert("Deposit cooldown not met");
        agentExecutor.deposit(user1, address(vault), amount);

        // Fast forward time
        vm.warp(block.timestamp + 3601);

        // Now should work
        vm.prank(owner);
        agentExecutor.rebalance(user1, address(0x1), address(0x2), amount);
    }

    function testMaxAmounts() public {
        uint256 maxRebalance = agentExecutor.maxRebalanceAmount();
        uint256 maxDeposit = agentExecutor.maxDepositAmount();

        // Test max amounts
        vm.prank(owner);
        agentExecutor.rebalance(
            user1,
            address(0x1),
            address(0x2),
            maxRebalance
        );

        vm.prank(owner);
        agentExecutor.deposit(user1, address(vault), maxDeposit);

        // Test exceeding max amounts
        vm.prank(owner);
        vm.expectRevert("Amount exceeds maximum");
        agentExecutor.rebalance(
            user1,
            address(0x1),
            address(0x2),
            maxRebalance + 1
        );

        vm.prank(owner);
        vm.expectRevert("Amount exceeds maximum");
        agentExecutor.deposit(user1, address(vault), maxDeposit + 1);
    }

    function testEmergencyPause() public {
        // Pause system
        agentExecutor.emergencyPause();

        // Operations should fail
        vm.prank(owner);
        vm.expectRevert("Contract is paused");
        agentExecutor.rebalance(
            user1,
            address(0x1),
            address(0x2),
            100 * 10 ** 6
        );

        vm.prank(owner);
        vm.expectRevert("Contract is paused");
        agentExecutor.deposit(user1, address(vault), 100 * 10 ** 6);

        // Unpause
        agentExecutor.emergencyPause();

        // Operations should work again
        vm.prank(owner);
        agentExecutor.rebalance(
            user1,
            address(0x1),
            address(0x2),
            100 * 10 ** 6
        );
    }

    function testERC4626Compatibility() public {
        uint256 assets = 1000 * 10 ** 6;

        // Test all ERC4626 functions
        assertEq(vault.convertToShares(assets), assets);
        assertEq(vault.convertToAssets(assets), assets);
        assertEq(vault.previewDeposit(assets), assets);
        assertEq(vault.previewMint(assets), assets);
        assertEq(vault.previewWithdraw(assets), assets);
        assertEq(vault.previewRedeem(assets), assets);
        assertEq(vault.maxDeposit(user1), type(uint256).max);
        assertEq(vault.maxMint(user1), type(uint256).max);
        assertEq(vault.maxWithdraw(user1), 0);
        assertEq(vault.maxRedeem(user1), 0);
    }

    function testGasOptimization() public {
        uint256 depositAmount = 1000 * 10 ** 6;

        // Measure gas for deposit
        uint256 gasStart = gasleft();
        vm.prank(user1);
        vault.deposit(depositAmount, user1);
        uint256 gasUsed = gasStart - gasleft();

        console.log("Gas used for deposit:", gasUsed);
        assertTrue(gasUsed < 200000); // Should be less than 200k gas
    }
}
