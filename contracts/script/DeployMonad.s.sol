// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {FiYieldVault} from "../src/core/FiYieldVault.sol";
import {AaveStrategy} from "../src/AaveStrategy.sol";
import {MockAavePool} from "../src/MockAavePool.sol";
import {AgentExecutor} from "../src/AgentExecutor.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

contract DeployMonadScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log(
            "Deploying contracts to Monad Testnet with account:",
            deployer
        );
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy mock USDC token
        ERC20Mock mockUSDC = new ERC20Mock();
        console.log("MockUSDC deployed at:", address(mockUSDC));

        // Deploy mock Aave pool
        MockAavePool mockAavePool = new MockAavePool();
        console.log("MockAavePool deployed at:", address(mockAavePool));

        // Deploy FiYieldVault
        FiYieldVault vault = new FiYieldVault(address(mockUSDC));
        console.log("FiYieldVault deployed at:", address(vault));

        // Deploy AaveStrategy
        AaveStrategy strategy = new AaveStrategy(
            address(mockUSDC),
            address(mockAavePool),
            address(mockUSDC), // Using mockUSDC as aToken for simplicity
            address(vault)
        );
        console.log("AaveStrategy deployed at:", address(strategy));

        // Deploy AgentExecutor
        AgentExecutor agentExecutor = new AgentExecutor();
        console.log("AgentExecutor deployed at:", address(agentExecutor));

        // Configure vault
        vault.setAgentExecutor(address(agentExecutor));
        vault.setStrategy(address(strategy));
        console.log("Vault configured");

        // Configure agent executor
        agentExecutor.setAuthorizedVault(address(vault), true);
        agentExecutor.setAuthorizedStrategy(address(strategy), true);
        agentExecutor.setCooldowns(3600, 1800); // 1 hour rebalance, 30 min deposit
        agentExecutor.setMaxAmounts(1000 * 10 ** 6, 5000 * 10 ** 6); // $1000 rebalance, $5000 deposit
        console.log("Agent executor configured");

        // Mint initial tokens to deployer for testing
        mockUSDC.mint(deployer, 1000000 * 10 ** 6); // 1M USDC (6 decimals)
        console.log("Initial tokens minted to deployer");

        vm.stopBroadcast();

        console.log("=== DEPLOYMENT COMPLETED ===");
        console.log("=== Contract Addresses ===");
        console.log("MockUSDC:", address(mockUSDC));
        console.log("MockAavePool:", address(mockAavePool));
        console.log("FiYieldVault:", address(vault));
        console.log("AaveStrategy:", address(strategy));
        console.log("AgentExecutor:", address(agentExecutor));
        console.log("=== Configuration ===");
        console.log("Vault owner:", vault.owner());
        console.log("Agent executor owner:", agentExecutor.owner());
        console.log("Rebalance cooldown:", agentExecutor.rebalanceCooldown());
        console.log("Deposit cooldown:", agentExecutor.depositCooldown());
        console.log(
            "Max rebalance amount:",
            agentExecutor.maxRebalanceAmount()
        );
        console.log("Max deposit amount:", agentExecutor.maxDepositAmount());

        // Write addresses to file for frontend
        string memory addressesJson = string(
            abi.encodePacked(
                "{\n",
                '  "FI_YIELD_VAULT": "',
                vm.toString(address(vault)),
                '",\n',
                '  "AGENT_EXECUTOR": "',
                vm.toString(address(agentExecutor)),
                '",\n',
                '  "AAVE_STRATEGY": "',
                vm.toString(address(strategy)),
                '",\n',
                '  "MOCK_AAVE_POOL": "',
                vm.toString(address(mockAavePool)),
                '",\n',
                '  "MOCK_USDC": "',
                vm.toString(address(mockUSDC)),
                '"\n',
                "}"
            )
        );

        vm.writeFile("./deployed-addresses.json", addressesJson);
        console.log("Addresses written to deployed-addresses.json");
    }
}
