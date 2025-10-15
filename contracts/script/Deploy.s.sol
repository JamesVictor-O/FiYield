// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {FiYieldVault} from "../src/core/FiYieldVault.sol";
import {AaveStrategy} from "../src/AaveStrategy.sol";
import {MockAavePool} from "../src/MockAavePool.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

contract DeployScript is Script {
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
        FiYieldVault vault = new FiYieldVault(address(asset));
        console.log("FiYieldVault deployed at:", address(vault));

        // Deploy strategy
        AaveStrategy strategy = new AaveStrategy(
            address(asset),
            address(mockAavePool),
            address(asset), // Using asset as aToken for simplicity
            address(vault)
        );
        console.log("AaveStrategy deployed at:", address(strategy));

        // Set agent executor in vault
        vault.setAgentExecutor(deployer);
        console.log("Agent executor set in vault");

        // Set strategy in vault
        vault.setStrategy(address(strategy));
        console.log("Strategy set in vault");

        // Mint initial tokens to deployer
        asset.mint(deployer, 1000000 * 1e18);
        console.log("Initial tokens minted to deployer");

        vm.stopBroadcast();

        console.log("Deployment completed successfully!");
        console.log("=== Contract Addresses ===");
        console.log("Asset (cUSD):", address(asset));
        console.log("MockAavePool:", address(mockAavePool));
        console.log("FiYieldVault:", address(vault));
        console.log("AaveStrategy:", address(strategy));
    }
}
