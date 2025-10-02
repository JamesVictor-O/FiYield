// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {YieldMakerVault} from "../src/YieldMakerVault.sol";
import {AaveStrategy} from "../src/AaveStrategy.sol";
import {MockAavePool} from "../src/MockAavePool.sol";
import {AgentExecutor} from "../src/AgentExecutor.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

contract DeployWithAgentScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy mock asset (cUSD)
        ERC20Mock asset = new ERC20Mock();
        console.log("Asset deployed at:", address(asset));
        
        // Deploy mock Aave pool
        MockAavePool mockAavePool = new MockAavePool();
        console.log("MockAavePool deployed at:", address(mockAavePool));
        
        // Deploy vault
        YieldMakerVault vault = new YieldMakerVault(
            address(asset),
            "YieldMaker Vault",
            "YMK",
            deployer // Using deployer as fee recipient
        );
        console.log("YieldMakerVault deployed at:", address(vault));
        
        // Deploy strategy
        AaveStrategy strategy = new AaveStrategy(
            address(asset),
            address(mockAavePool),
            address(asset), // Using asset as aToken for simplicity
            address(vault)
        );
        console.log("AaveStrategy deployed at:", address(strategy));
        
        // Deploy agent executor
        AgentExecutor agentExecutor = new AgentExecutor();
        console.log("AgentExecutor deployed at:", address(agentExecutor));
        
        // Set strategy in vault
        vault.setStrategy(address(strategy), true);
        console.log("Strategy set in vault");
        
        // Configure agent executor
        agentExecutor.setAuthorizedVault(address(vault), true);
        agentExecutor.setAuthorizedStrategy(address(strategy), true);
        agentExecutor.setCooldowns(3600, 1800); // 1 hour rebalance, 30 min deposit
        agentExecutor.setMaxAmounts(1000 * 10**6, 5000 * 10**6); // $1000 rebalance, $5000 deposit
        console.log("Agent executor configured");
        
        // Mint initial tokens to deployer
        asset.mint(deployer, 1000000 * 1e18);
        console.log("Initial tokens minted to deployer");
        
        vm.stopBroadcast();
        
        console.log("Deployment completed successfully!");
        console.log("=== Contract Addresses ===");
        console.log("Asset (cUSD):", address(asset));
        console.log("MockAavePool:", address(mockAavePool));
        console.log("YieldMakerVault:", address(vault));
        console.log("AaveStrategy:", address(strategy));
        console.log("AgentExecutor:", address(agentExecutor));
        console.log("=== Configuration ===");
        console.log("Vault owner:", vault.owner());
        console.log("Agent executor owner:", agentExecutor.owner());
        console.log("Rebalance cooldown:", agentExecutor.rebalanceCooldown());
        console.log("Deposit cooldown:", agentExecutor.depositCooldown());
        console.log("Max rebalance amount:", agentExecutor.maxRebalanceAmount());
        console.log("Max deposit amount:", agentExecutor.maxDepositAmount());
    }
}
