// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/core/MultiTokenCoordinatorVault.sol";
import "../src/core/FiYieldVault.sol";
import "../src/AgentExecutor.sol";

contract SimpleMultiTokenDeploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log(
            "Deploying MultiTokenCoordinatorVault with account:",
            deployer
        );
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Token addresses on Monad Testnet
        address USDC = 0x5D876D73f4441D5f2438B1A3e2A51771B337F27A;
        address WBTC = 0x6BB379A2056d1304E73012b99338F8F581eE2E18;
        address CURR = 0xB5481b57fF4e23eA7D2fda70f3137b16D0D99118;
        address MOCK_USDC = 0xd455943dbc86A559A822AF08f5FDdD6B122E0748;

        // Deploy coordinator vault
        MultiTokenCoordinatorVault coordinator = new MultiTokenCoordinatorVault();
        console.log(
            "MultiTokenCoordinatorVault deployed at:",
            address(coordinator)
        );

        // Deploy individual vaults
        FiYieldVault usdcVault = new FiYieldVault(USDC);
        FiYieldVault wbtcVault = new FiYieldVault(WBTC);
        FiYieldVault currVault = new FiYieldVault(CURR);
        FiYieldVault mockUsdcVault = new FiYieldVault(MOCK_USDC);

        console.log("USDC Vault deployed at:", address(usdcVault));
        console.log("WBTC Vault deployed at:", address(wbtcVault));
        console.log("CURR Vault deployed at:", address(currVault));
        console.log("MockUSDC Vault deployed at:", address(mockUsdcVault));

        // Deploy agent executor
        AgentExecutor agentExecutor = new AgentExecutor();
        console.log("AgentExecutor deployed at:", address(agentExecutor));

        vm.stopBroadcast();

        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("MultiTokenCoordinatorVault:", address(coordinator));
        console.log("USDC Vault:", address(usdcVault));
        console.log("WBTC Vault:", address(wbtcVault));
        console.log("CURR Vault:", address(currVault));
        console.log("MockUSDC Vault:", address(mockUsdcVault));
        console.log("AgentExecutor:", address(agentExecutor));
    }
}
