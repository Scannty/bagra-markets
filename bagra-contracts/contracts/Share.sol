// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Share
 * @notice A basic ERC20 token with minting functionality
 * @dev Only the owner can mint new tokens to any address
 */
contract Share is ERC20, Ownable {
    event Minted(address indexed to, uint256 amount);

    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) Ownable(tx.origin) {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit Minted(to, amount);
    }
}
