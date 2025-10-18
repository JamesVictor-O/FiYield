// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/core/MultiTokenCoordinatorVault.sol";
import "../src/core/FiYieldVault.sol";
import "../src/AgentExecutor.sol";

contract DeployMultiTokenCoordinator is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying MultiTokenCoordinatorVault with account:", deployer);
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Token addresses on Monad Testnet
        address USDC = 0x5D876D73f4441D5f2438B1A3e2A51771B337F27A;
        address WBTC = 0x6BB379A2056d1304E73012b99338F8F581eE2E18;
        address CURR = 0xB5481b57fF4e23eA7D2fda70f3137b16D0D99118;
        address MOCK_USDC = 0xd455943dbc86A559A822AF08f5FDdD6B122E0748;

        // Deploy coordinator vault
        MultiTokenCoordinatorVault coordinator = new MultiTokenCoordinatorVault();
        console.log("MultiTokenCoordinatorVault deployed at:", address(coordinator));

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

        // Setup coordinator
        coordinator.setAgentExecutor(address(agentExecutor));

        // Add token vaults to coordinator
        coordinator.addTokenVault(USDC, address(usdcVault));
        coordinator.addTokenVault(WBTC, address(wbtcVault));
        coordinator.addTokenVault(CURR, address(currVault));
        coordinator.addTokenVault(MOCK_USDC, address(mockUsdcVault));

        // Set token prices (18 decimals)
        coordinator.updateTokenPrice(USDC, 1e18); // $1.00
        coordinator.updateTokenPrice(WBTC, 50000e18); // $50,000
        coordinator.updateTokenPrice(CURR, 0.1e18); // $0.10
        coordinator.updateTokenPrice(MOCK_USDC, 1e18); // $1.00

        // Setup individual vaults
        usdcVault.setAgentExecutor(address(coordinator));
        wbtcVault.setAgentExecutor(address(coordinator));
        currVault.setAgentExecutor(address(coordinator));
        mockUsdcVault.setAgentExecutor(address(coordinator));

        vm.stopBroadcast();

        // Write addresses to file
        string memory json = string(
            abi.encodePacked(
                '{\n',
                '  "MULTI_TOKEN_COORDINATOR": "', vm.toString(address(coordinator)), '",\n',
                '  "USDC_VAULT": "', vm.toString(address(usdcVault)), '",\n',
                '  "WBTC_VAULT": "', vm.toString(address(wbtcVault)), '",\n',
                '  "CURR_VAULT": "', vm.toString(address(currVault)), '",\n',
                '  "MOCK_USDC_VAULT": "', vm.toString(address(mockUsdcVault)), '",\n',
                '  "AGENT_EXECUTOR": "', vm.toString(address(agentExecutor)), '"\n',
                '}'
            )
        );

        vm.writeFile("./deployments/MultiTokenCoordinator.json", json);
        console.log("Deployment addresses written to ./deployments/MultiTokenCoordinator.json");
    }
}

