// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/core/FiYieldVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DeployCURRVault is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying CURR vault with the account:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy CURR vault
        address CURR = 0xB5481b57fF4e23eA7D2fda70f3137b16D0D99118;
        FiYieldVault currVault = new FiYieldVault(CURR);

        console.log("CURR Vault deployed at:", address(currVault));

        // Verify the deployment
        IERC20 asset = currVault.asset();
        console.log("Vault asset:", address(asset));
        require(address(asset) == CURR, "Asset mismatch");

        vm.stopBroadcast();

        console.log("CURR Vault deployment successful!");
    }
}
