// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
// Maybe i dont even use that shit anyway
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract RandomToken is ERC20 {
    constructor() ERC20("Token", "Caso") {
       
    }
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
   
}
