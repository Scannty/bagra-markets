// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BalanceVault
 * @notice Manages user deposits and withdrawals for Kalshi market positions
 * @dev Tracks on-chain balances while the backend handles actual Kalshi API interactions
 */
contract BalanceVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // USDC token address (will be set in constructor based on chain)
    IERC20 public immutable usdcToken;

    // Kalshi deposit address on Arbitrum where USDC is forwarded
    address public kalshiDepositAddress;

    // User balances (available for withdrawal)
    mapping(address => uint256) public balances;

    // Locked balances (in active Kalshi positions, cannot withdraw)
    mapping(address => uint256) public lockedBalances;

    // Events
    event Deposit(address indexed user, uint256 amount, uint256 newBalance);
    event Withdrawal(address indexed user, uint256 amount, uint256 newBalance);
    event BalanceLocked(address indexed user, uint256 amount, uint256 newLockedBalance);
    event BalanceUnlocked(address indexed user, uint256 amount, uint256 newLockedBalance);
    event KalshiDepositAddressUpdated(address indexed oldAddress, address indexed newAddress);
    event FundsForwardedToKalshi(uint256 amount);

    constructor(address _usdcToken, address _kalshiDepositAddress) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_kalshiDepositAddress != address(0), "Invalid Kalshi deposit address");

        usdcToken = IERC20(_usdcToken);
        kalshiDepositAddress = _kalshiDepositAddress;
    }

    /**
     * @notice Credit user balance after backend confirms deposit
     * @dev Only callable by owner (backend service after confirming on-chain and Kalshi deposit)
     * @param user User address to credit
     * @param amount Amount of USDC to credit (in USDC decimals, typically 6)
     */
    function creditDeposit(address user, uint256 amount) external onlyOwner {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than 0");

        // Update user balance
        balances[user] += amount;

        emit Deposit(user, amount, balances[user]);
    }

    /**
     * @notice Process withdrawal for a user
     * @dev Only callable by owner (backend service after processing off-chain withdrawal)
     * @param user User address to withdraw for
     * @param amount Amount of USDC to withdraw
     */
    function processWithdrawal(address user, uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(balances[user] >= amount, "Insufficient balance");

        // Update balance
        balances[user] -= amount;

        emit Withdrawal(user, amount, balances[user]);
    }

    /**
     * @notice Lock user balance when opening a Kalshi position
     * @dev Only callable by owner (backend service)
     * @param user User whose balance to lock
     * @param amount Amount to lock
     */
    function lockBalance(address user, uint256 amount) external onlyOwner {
        require(balances[user] >= amount, "Insufficient balance to lock");

        balances[user] -= amount;
        lockedBalances[user] += amount;

        emit BalanceLocked(user, amount, lockedBalances[user]);
    }

    /**
     * @notice Unlock user balance when closing a Kalshi position
     * @dev Only callable by owner (backend service)
     * @param user User whose balance to unlock
     * @param amount Amount to unlock (could be more/less than locked if position won/lost)
     */
    function unlockBalance(address user, uint256 amount) external onlyOwner {
        lockedBalances[user] = 0; // Clear locked balance
        balances[user] += amount; // Add the final amount (profit/loss already calculated)

        emit BalanceUnlocked(user, amount, lockedBalances[user]);
    }

    /**
     * @notice Get total balance (available + locked) for a user
     * @param user User address
     * @return Total balance
     */
    function getTotalBalance(address user) external view returns (uint256) {
        return balances[user] + lockedBalances[user];
    }

    /**
     * @notice Update Kalshi deposit address
     * @dev Only callable by owner
     * @param newKalshiDepositAddress New Kalshi deposit address
     */
    function updateKalshiDepositAddress(address newKalshiDepositAddress) external onlyOwner {
        require(newKalshiDepositAddress != address(0), "Invalid Kalshi deposit address");
        address oldAddress = kalshiDepositAddress;
        kalshiDepositAddress = newKalshiDepositAddress;
        emit KalshiDepositAddressUpdated(oldAddress, newKalshiDepositAddress);
    }
}
