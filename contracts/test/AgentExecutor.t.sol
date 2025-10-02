// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {AgentExecutor} from "../src/AgentExecutor.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

contract AgentExecutorTest is Test {
    AgentExecutor public agentExecutor;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public vault1 = address(0x4);
    address public vault2 = address(0x5);
    address public strategy1 = address(0x6);
    address public strategy2 = address(0x7);

    function setUp() public {
        vm.prank(owner);
        agentExecutor = new AgentExecutor();
    }

    function testInitialState() public {
        assertEq(agentExecutor.owner(), owner);
        assertEq(agentExecutor.rebalanceCooldown(), 3600); // 1 hour
        assertEq(agentExecutor.depositCooldown(), 1800); // 30 minutes
        assertEq(agentExecutor.maxRebalanceAmount(), 1000 * 10**6); // $1000
        assertEq(agentExecutor.maxDepositAmount(), 5000 * 10**6); // $5000
    }

    function testSetAuthorizedVault() public {
        vm.prank(owner);
        agentExecutor.setAuthorizedVault(vault1, true);
        
        assertTrue(agentExecutor.authorizedVaults(vault1));
        assertFalse(agentExecutor.authorizedVaults(vault2));
    }

    function testSetAuthorizedStrategy() public {
        vm.prank(owner);
        agentExecutor.setAuthorizedStrategy(strategy1, true);
        
        assertTrue(agentExecutor.authorizedStrategies(strategy1));
        assertFalse(agentExecutor.authorizedStrategies(strategy2));
    }

    function testSetCooldowns() public {
        vm.prank(owner);
        agentExecutor.setCooldowns(7200, 3600); // 2 hours, 1 hour
        
        assertEq(agentExecutor.rebalanceCooldown(), 7200);
        assertEq(agentExecutor.depositCooldown(), 3600);
    }

    function testSetMaxAmounts() public {
        vm.prank(owner);
        agentExecutor.setMaxAmounts(2000 * 10**6, 10000 * 10**6);
        
        assertEq(agentExecutor.maxRebalanceAmount(), 2000 * 10**6);
        assertEq(agentExecutor.maxDepositAmount(), 10000 * 10**6);
    }

    function testRebalance() public {
        // Setup authorized strategies
        vm.prank(owner);
        agentExecutor.setAuthorizedStrategy(strategy1, true);
        
        vm.prank(owner);
        agentExecutor.setAuthorizedStrategy(strategy2, true);
        
        uint256 amount = 500 * 10**6; // $500
        
        // Execute rebalance
        vm.prank(owner);
        agentExecutor.rebalance(user1, strategy1, strategy2, amount);
        
        // Check that last rebalance time was updated
        (uint256 lastRebalance,) = agentExecutor.getUserTimestamps(user1);
        assertEq(lastRebalance, block.timestamp);
    }

    function testRebalanceFailsUnauthorizedStrategy() public {
        vm.prank(owner);
        agentExecutor.setAuthorizedStrategy(strategy1, true);
        // strategy2 not authorized
        
        uint256 amount = 500 * 10**6;
        
        vm.prank(owner);
        vm.expectRevert("To protocol not authorized");
        agentExecutor.rebalance(user1, strategy1, strategy2, amount);
    }

    function testRebalanceFailsExceedsMaxAmount() public {
        vm.prank(owner);
        agentExecutor.setAuthorizedStrategy(strategy1, true);
        
        vm.prank(owner);
        agentExecutor.setAuthorizedStrategy(strategy2, true);
        
        uint256 amount = 2000 * 10**6; // Exceeds max of $1000
        
        vm.prank(owner);
        vm.expectRevert("Amount exceeds maximum");
        agentExecutor.rebalance(user1, strategy1, strategy2, amount);
    }

    function testRebalanceFailsCooldown() public {
        vm.prank(owner);
        agentExecutor.setAuthorizedStrategy(strategy1, true);
        
        vm.prank(owner);
        agentExecutor.setAuthorizedStrategy(strategy2, true);
        
        uint256 amount = 500 * 10**6;
        
        // First rebalance
        vm.prank(owner);
        agentExecutor.rebalance(user1, strategy1, strategy2, amount);
        
        // Try to rebalance again immediately (should fail)
        vm.prank(owner);
        vm.expectRevert("Rebalance cooldown not met");
        agentExecutor.rebalance(user1, strategy1, strategy2, amount);
    }

    function testDeposit() public {
        vm.prank(owner);
        agentExecutor.setAuthorizedVault(vault1, true);
        
        uint256 amount = 1000 * 10**6; // $1000
        
        vm.prank(owner);
        agentExecutor.deposit(user1, vault1, amount);
        
        // Check that last deposit time was updated
        (, uint256 lastDeposit) = agentExecutor.getUserTimestamps(user1);
        assertEq(lastDeposit, block.timestamp);
    }

    function testDepositFailsUnauthorizedVault() public {
        uint256 amount = 1000 * 10**6;
        
        vm.prank(owner);
        vm.expectRevert("Vault not authorized");
        agentExecutor.deposit(user1, vault1, amount);
    }

    function testDepositFailsExceedsMaxAmount() public {
        vm.prank(owner);
        agentExecutor.setAuthorizedVault(vault1, true);
        
        uint256 amount = 10000 * 10**6; // Exceeds max of $5000
        
        vm.prank(owner);
        vm.expectRevert("Amount exceeds maximum");
        agentExecutor.deposit(user1, vault1, amount);
    }

    function testCanRebalance() public {
        vm.prank(owner);
        agentExecutor.setAuthorizedStrategy(strategy1, true);
        
        vm.prank(owner);
        agentExecutor.setAuthorizedStrategy(strategy2, true);
        
        uint256 amount = 500 * 10**6;
        
        // First rebalance
        vm.prank(owner);
        agentExecutor.rebalance(user1, strategy1, strategy2, amount);
        
        // Check canRebalance immediately after
        (bool canRebalance, uint256 timeRemaining) = agentExecutor.canRebalance(user1);
        assertFalse(canRebalance);
        assertGt(timeRemaining, 0);
        
        // Fast forward past cooldown
        vm.warp(block.timestamp + 3601); // 1 hour + 1 second
        
        (canRebalance, timeRemaining) = agentExecutor.canRebalance(user1);
        assertTrue(canRebalance);
        assertEq(timeRemaining, 0);
    }

    function testCanDeposit() public {
        vm.prank(owner);
        agentExecutor.setAuthorizedVault(vault1, true);
        
        uint256 amount = 1000 * 10**6;
        
        // First deposit
        vm.prank(owner);
        agentExecutor.deposit(user1, vault1, amount);
        
        // Check canDeposit immediately after
        (bool canDeposit, uint256 timeRemaining) = agentExecutor.canDeposit(user1);
        assertFalse(canDeposit);
        assertGt(timeRemaining, 0);
        
        // Fast forward past cooldown
        vm.warp(block.timestamp + 1801); // 30 minutes + 1 second
        
        (canDeposit, timeRemaining) = agentExecutor.canDeposit(user1);
        assertTrue(canDeposit);
        assertEq(timeRemaining, 0);
    }

    function testOptimizeStrategy() public {
        vm.prank(owner);
        agentExecutor.setAuthorizedStrategy(strategy1, true);
        
        vm.prank(owner);
        agentExecutor.setAuthorizedStrategy(strategy2, true);
        
        uint256 amount = 500 * 10**6;
        
        vm.prank(owner);
        agentExecutor.optimizeStrategy(user1, strategy1, strategy2, amount);
        
        // Check that event was emitted (we can't easily test the actual optimization logic)
        // This test mainly ensures the function doesn't revert
    }

    function testOnlyOwnerFunctions() public {
        // Test that only owner can call restricted functions
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        agentExecutor.setAuthorizedVault(vault1, true);
        
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        agentExecutor.setAuthorizedStrategy(strategy1, true);
        
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        agentExecutor.setCooldowns(7200, 3600);
        
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        agentExecutor.setMaxAmounts(2000 * 10**6, 10000 * 10**6);
    }

    function testMultipleUsers() public {
        vm.prank(owner);
        agentExecutor.setAuthorizedStrategy(strategy1, true);
        
        vm.prank(owner);
        agentExecutor.setAuthorizedStrategy(strategy2, true);
        
        uint256 amount = 500 * 10**6;
        
        // User1 rebalances
        vm.prank(owner);
        agentExecutor.rebalance(user1, strategy1, strategy2, amount);
        
        // User2 can rebalance immediately (different user)
        vm.prank(owner);
        agentExecutor.rebalance(user2, strategy1, strategy2, amount);
        
        // Check both users have their timestamps updated
        (uint256 user1Rebalance,) = agentExecutor.getUserTimestamps(user1);
        (uint256 user2Rebalance,) = agentExecutor.getUserTimestamps(user2);
        
        assertEq(user1Rebalance, block.timestamp);
        assertEq(user2Rebalance, block.timestamp);
    }

    function testFuzzRebalance(uint256 amount) public {
        vm.assume(amount > 0 && amount <= 1000 * 10**6);
        
        vm.prank(owner);
        agentExecutor.setAuthorizedStrategy(strategy1, true);
        
        vm.prank(owner);
        agentExecutor.setAuthorizedStrategy(strategy2, true);
        
        vm.prank(owner);
        agentExecutor.rebalance(user1, strategy1, strategy2, amount);
        
        (uint256 lastRebalance,) = agentExecutor.getUserTimestamps(user1);
        assertEq(lastRebalance, block.timestamp);
    }
}
