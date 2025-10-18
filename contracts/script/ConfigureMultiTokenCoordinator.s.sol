// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/core/MultiTokenCoordinatorVault.sol";

contract ConfigureMultiTokenCoordinator is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log(
            "Configuring MultiTokenCoordinatorVault with account:",
            deployer
        );

        vm.startBroadcast(deployerPrivateKey);

        // MultiTokenCoordinatorVault address
        MultiTokenCoordinatorVault coordinator = MultiTokenCoordinatorVault(
            0xeEF3B2FD12aC762Eb67a38d160f6DBA1dEbCaAd3
        );

        // Token addresses on Monad Testnet
        address USDC = 0x5D876D73f4441D5f2438B1A3e2A51771B337F27A;
        address WBTC = 0x6BB379A2056d1304E73012b99338F8F581eE2E18;
        address CURR = 0xB5481b57fF4e23eA7D2fda70f3137b16D0D99118;
        address MOCK_USDC = 0xd455943dbc86A559A822AF08f5FDdD6B122E0748;

        // Individual vault addresses
        address USDC_VAULT = 0x55B0C512e8F76B5B207FF40D84D3671C6c66F2b8;
        address WBTC_VAULT = 0x2D036F0B67b5bc85c800acEef8f473A9498a0CaC;
        address CURR_VAULT = 0x1492F4795592BEfb306699165661d29CC12559D5;
        address MOCK_USDC_VAULT = 0x24CFaa279a88333D0268B243d316e75BA4FD0A17;

        // Add token vaults to coordinator
        coordinator.addTokenVault(USDC, USDC_VAULT);
        console.log("Added USDC vault to coordinator");

        coordinator.addTokenVault(WBTC, WBTC_VAULT);
        console.log("Added WBTC vault to coordinator");

        coordinator.addTokenVault(CURR, CURR_VAULT);
        console.log("Added CURR vault to coordinator");

        coordinator.addTokenVault(MOCK_USDC, MOCK_USDC_VAULT);
        console.log("Added MockUSDC vault to coordinator");

        // Set token prices (18 decimals)
        coordinator.updateTokenPrice(USDC, 1e18); // $1.00
        console.log("Set USDC price to $1.00");

        coordinator.updateTokenPrice(WBTC, 50000e18); // $50,000
        console.log("Set WBTC price to $50,000");

        coordinator.updateTokenPrice(CURR, 0.1e18); // $0.10
        console.log("Set CURR price to $0.10");

        coordinator.updateTokenPrice(MOCK_USDC, 1e18); // $1.00
        console.log("Set MockUSDC price to $1.00");

        vm.stopBroadcast();

        console.log("=== CONFIGURATION COMPLETE ===");
        console.log(
            "MultiTokenCoordinatorVault configured with all supported tokens"
        );
    }
}
