// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/core/FiYieldVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DeploySingleVault is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying single vault with the account:", deployer);
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy USDC vault
        address USDC = 0x5D876D73f4441D5f2438B1A3e2A51771B337F27A;
        FiYieldVault usdcVault = new FiYieldVault(USDC);

        console.log("USDC Vault deployed at:", address(usdcVault));

        // Verify the deployment by calling a function
        IERC20 asset = usdcVault.asset();
        console.log("Vault asset:", address(asset));

        // Check if asset matches USDC
        require(address(asset) == USDC, "Asset mismatch");

        vm.stopBroadcast();

        console.log("Deployment successful!");
    }
}
