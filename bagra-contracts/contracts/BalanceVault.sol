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

    // Platform wallet that holds the actual funds for Kalshi trading
    address public platformWallet;

    // User balances (available for withdrawal)
    mapping(address => uint256) public balances;

    // Locked balances (in active Kalshi positions, cannot withdraw)
    mapping(address => uint256) public lockedBalances;

    // Events
    event Deposit(address indexed user, uint256 amount, uint256 newBalance);
    event Withdrawal(address indexed user, uint256 amount, uint256 newBalance);
    event BalanceLocked(address indexed user, uint256 amount, uint256 newLockedBalance);
    event BalanceUnlocked(address indexed user, uint256 amount, uint256 newLockedBalance);
    event PlatformWalletUpdated(address indexed oldWallet, address indexed newWallet);

    constructor(address _usdcToken, address _platformWallet) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_platformWallet != address(0), "Invalid platform wallet");

        usdcToken = IERC20(_usdcToken);
        platformWallet = _platformWallet;
    }

    /**
     * @notice Deposit USDC to the vault
     * @param amount Amount of USDC to deposit (in USDC decimals, typically 6)
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        // Transfer USDC from user to platform wallet
        usdcToken.safeTransferFrom(msg.sender, platformWallet, amount);

        // Update user balance
        balances[msg.sender] += amount;

        emit Deposit(msg.sender, amount, balances[msg.sender]);
    }

    /**
     * @notice Withdraw available USDC from the vault
     * @param amount Amount of USDC to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        // Update balance before transfer
        balances[msg.sender] -= amount;

        // Transfer USDC from platform wallet to user
        usdcToken.safeTransferFrom(platformWallet, msg.sender, amount);

        emit Withdrawal(msg.sender, amount, balances[msg.sender]);
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
     * @notice Update platform wallet address
     * @dev Only callable by owner
     * @param newPlatformWallet New platform wallet address
     */
    function updatePlatformWallet(address newPlatformWallet) external onlyOwner {
        require(newPlatformWallet != address(0), "Invalid platform wallet");
        address oldWallet = platformWallet;
        platformWallet = newPlatformWallet;
        emit PlatformWalletUpdated(oldWallet, newPlatformWallet);
    }
}
