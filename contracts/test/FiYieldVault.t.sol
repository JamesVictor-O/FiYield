pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/core/FiYieldVault.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        _mint(msg.sender, 1000000 * 10**6); // 1M USDC
    }
    
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract FiYieldVaultTest is Test{
    
}