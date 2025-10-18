// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/core/MultiTokenCoordinatorVault.sol";
import "../src/core/FiYieldVault.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock ERC20 tokens for testing
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {
        _mint(msg.sender, 1000000 * 10 ** 6); // 1M tokens
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract MockWBTC is ERC20 {
    constructor() ERC20("Mock Wrapped BTC", "mWBTC") {
        _mint(msg.sender, 1000 * 10 ** 8); // 1000 tokens
    }

    function decimals() public pure override returns (uint8) {
        return 8;
    }
}

contract MockCURR is ERC20 {
    constructor() ERC20("Mock Currances", "mCURR") {
        _mint(msg.sender, 1000000 * 10 ** 18); // 1M tokens
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }
}

contract MultiTokenCoordinatorVaultTest is Test {
    MultiTokenCoordinatorVault public coordinator;
    FiYieldVault public usdcVault;
    FiYieldVault public wbtcVault;
    FiYieldVault public currVault;

    MockUSDC public usdc;
    MockWBTC public wbtc;
    MockCURR public curr;

    address public user = address(0x1);
    address public agent = address(0x2);

    function setUp() public {
        // Deploy mock tokens
        usdc = new MockUSDC();
        wbtc = new MockWBTC();
        curr = new MockCURR();

        // Deploy coordinator vault
        coordinator = new MultiTokenCoordinatorVault();

        // Deploy individual vaults
        usdcVault = new FiYieldVault(address(usdc));
        wbtcVault = new FiYieldVault(address(wbtc));
        currVault = new FiYieldVault(address(curr));

        // Setup coordinator
        coordinator.setAgentExecutor(agent);

        // Add token vaults to coordinator
        coordinator.addTokenVault(address(usdc), address(usdcVault));
        coordinator.addTokenVault(address(wbtc), address(wbtcVault));
        coordinator.addTokenVault(address(curr), address(currVault));

        // Set token prices (18 decimals)
        coordinator.updateTokenPrice(address(usdc), 1e18); // $1.00
        coordinator.updateTokenPrice(address(wbtc), 50000e18); // $50,000
        coordinator.updateTokenPrice(address(curr), 0.1e18); // $0.10

        // Setup individual vaults
        usdcVault.setAgentExecutor(address(coordinator));
        wbtcVault.setAgentExecutor(address(coordinator));
        currVault.setAgentExecutor(address(coordinator));

        // Give user some tokens
        usdc.transfer(user, 10000 * 10 ** 6); // 10,000 USDC
        wbtc.transfer(user, 1 * 10 ** 8); // 1 WBTC
        curr.transfer(user, 100000 * 10 ** 18); // 100,000 CURR
    }

    function testInitialSetup() public {
        assertTrue(coordinator.supportedTokens(address(usdc)));
        assertTrue(coordinator.supportedTokens(address(wbtc)));
        assertTrue(coordinator.supportedTokens(address(curr)));
        assertEq(coordinator.agentExecutor(), agent);
    }

    function testUSDCDeposit() public {
        uint256 depositAmount = 1000 * 10 ** 6; // 1000 USDC

        // Approve coordinator to spend USDC
        vm.prank(user);
        usdc.approve(address(coordinator), depositAmount);

        // Deposit USDC
        vm.prank(user);
        uint256 usdValue = coordinator.deposit(address(usdc), depositAmount);

        // Check USD value (1000 USDC * $1 = $1000)
        assertEq(usdValue, 1000e18);

        // Check user balances
        assertEq(
            coordinator.getUserTokenBalance(user, address(usdc)),
            depositAmount
        );
        assertEq(coordinator.getUserTotalValue(user), 1000e18);
        assertEq(coordinator.getTotalPortfolioValue(), 1000e18);
    }

    function testWBTCDeposit() public {
        uint256 depositAmount = 1 * 10 ** 8; // 1 WBTC

        // Approve coordinator to spend WBTC
        vm.prank(user);
        wbtc.approve(address(coordinator), depositAmount);

        // Deposit WBTC
        vm.prank(user);
        uint256 usdValue = coordinator.deposit(address(wbtc), depositAmount);

        // Check USD value (1 WBTC * $50,000 = $50,000)
        assertEq(usdValue, 50000e18);

        // Check user balances
        assertEq(
            coordinator.getUserTokenBalance(user, address(wbtc)),
            depositAmount
        );
        assertEq(coordinator.getUserTotalValue(user), 50000e18);
        assertEq(coordinator.getTotalPortfolioValue(), 50000e18);
    }

    function testCURRDeposit() public {
        uint256 depositAmount = 10000 * 10 ** 18; // 10,000 CURR

        // Approve coordinator to spend CURR
        vm.prank(user);
        curr.approve(address(coordinator), depositAmount);

        // Deposit CURR
        vm.prank(user);
        uint256 usdValue = coordinator.deposit(address(curr), depositAmount);

        // Check USD value (10,000 CURR * $0.10 = $1,000)
        assertEq(usdValue, 1000e18);

        // Check user balances
        assertEq(
            coordinator.getUserTokenBalance(user, address(curr)),
            depositAmount
        );
        assertEq(coordinator.getUserTotalValue(user), 1000e18);
        assertEq(coordinator.getTotalPortfolioValue(), 1000e18);
    }

    function testMultipleDeposits() public {
        // Deposit USDC
        vm.startPrank(user);
        usdc.approve(address(coordinator), 1000 * 10 ** 6);
        coordinator.deposit(address(usdc), 1000 * 10 ** 6);

        // Deposit WBTC
        wbtc.approve(address(coordinator), 1 * 10 ** 8);
        coordinator.deposit(address(wbtc), 1 * 10 ** 8);

        // Deposit CURR
        curr.approve(address(coordinator), 10000 * 10 ** 18);
        coordinator.deposit(address(curr), 10000 * 10 ** 18);
        vm.stopPrank();

        // Check total portfolio value ($1000 + $50,000 + $1000 = $52,000)
        assertEq(coordinator.getUserTotalValue(user), 52000e18);
        assertEq(coordinator.getTotalPortfolioValue(), 52000e18);
    }

    function testWithdraw() public {
        // First deposit some USDC
        vm.startPrank(user);
        usdc.approve(address(coordinator), 1000 * 10 ** 6);
        coordinator.deposit(address(usdc), 1000 * 10 ** 6);
        vm.stopPrank();

        // Withdraw half
        vm.prank(user);
        uint256 usdValue = coordinator.withdraw(address(usdc), 500 * 10 ** 6);

        // Check USD value
        assertEq(usdValue, 500e18);

        // Check balances
        assertEq(
            coordinator.getUserTokenBalance(user, address(usdc)),
            500 * 10 ** 6
        );
        assertEq(coordinator.getUserTotalValue(user), 500e18);
        assertEq(coordinator.getTotalPortfolioValue(), 500e18);
    }

    function testRebalance() public {
        // Deposit USDC
        vm.startPrank(user);
        usdc.approve(address(coordinator), 1000 * 10 ** 6);
        coordinator.deposit(address(usdc), 1000 * 10 ** 6);
        vm.stopPrank();

        // Rebalance from USDC to CURR (agent only)
        vm.prank(agent);
        coordinator.rebalancePortfolio(
            user,
            address(usdc),
            address(curr),
            500 * 10 ** 6
        );

        // Check balances after rebalance
        assertEq(
            coordinator.getUserTokenBalance(user, address(usdc)),
            500 * 10 ** 6
        );
        assertEq(
            coordinator.getUserTokenBalance(user, address(curr)),
            5000 * 10 ** 18
        ); // $500 worth of CURR
        assertEq(coordinator.getUserTotalValue(user), 1000e18); // Total value unchanged
    }

    function testPriceStaleness() public {
        // Fast forward time to make price stale
        vm.warp(block.timestamp + 2 hours);

        // Try to deposit with stale price
        vm.startPrank(user);
        usdc.approve(address(coordinator), 1000 * 10 ** 6);
        vm.expectRevert("Price is stale");
        coordinator.deposit(address(usdc), 1000 * 10 ** 6);
        vm.stopPrank();
    }

    function testOnlyAgentCanRebalance() public {
        // Deposit some USDC
        vm.startPrank(user);
        usdc.approve(address(coordinator), 1000 * 10 ** 6);
        coordinator.deposit(address(usdc), 1000 * 10 ** 6);
        vm.stopPrank();

        // Try to rebalance as user (should fail)
        vm.prank(user);
        vm.expectRevert("Only agent can rebalance");
        coordinator.rebalancePortfolio(
            user,
            address(usdc),
            address(curr),
            500 * 10 ** 6
        );
    }

    function testInsufficientBalance() public {
        // Try to withdraw without depositing
        vm.prank(user);
        vm.expectRevert("Insufficient balance");
        coordinator.withdraw(address(usdc), 1000 * 10 ** 6);
    }

    function testUnsupportedToken() public {
        // Try to deposit unsupported token
        vm.prank(user);
        vm.expectRevert("Token not supported");
        coordinator.deposit(address(0x123), 1000);
    }
}
