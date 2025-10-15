// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

contract SimpleDeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying simple contract to Monad Testnet with account:", deployer);
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy a simple ERC20Mock
        ERC20Mock mockToken = new ERC20Mock();
        console.log("MockToken deployed at:", address(mockToken));

        vm.stopBroadcast();

        console.log("Deployment completed successfully!");
    }
}
