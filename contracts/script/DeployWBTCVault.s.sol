// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/core/FiYieldVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DeployWBTCVault is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying WBTC vault with the account:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy WBTC vault
        address WBTC = 0x6BB379A2056d1304E73012b99338F8F581eE2E18;
        FiYieldVault wbtcVault = new FiYieldVault(WBTC);

        console.log("WBTC Vault deployed at:", address(wbtcVault));
        
        // Verify the deployment
        IERC20 asset = wbtcVault.asset();
        console.log("Vault asset:", address(asset));
        require(address(asset) == WBTC, "Asset mismatch");

        vm.stopBroadcast();

        console.log("WBTC Vault deployment successful!");
    }
}
