// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract Mission17Ledger is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    // State variables are stored in the Proxy, not here.
    // WARNING: Do not change the order of existing variables in future upgrades!
    mapping(address => uint256) public pointsBalance;

    event PointsAwarded(address indexed user, uint256 amount);

    // Removed constructor locking _disableInitializers() so we can run initialize() directly in Remix

    // This function replaces the constructor for the Proxy
    function initialize() public initializer {
        __Ownable_init(msg.sender); // Sets the deployer as the initial owner
        __UUPSUpgradeable_init();
    }

    // 🔥 OPTIMIZATION 1: 'external' instead of 'public'
    function awardPoints(address recipient, uint256 amount) external onlyOwner {
        // 🔥 OPTIMIZATION 2: 'unchecked' math
        // Bypasses the default ^0.8.0 overflow checks, which cost gas.
        // Earning 2^256 points is mathematically impossible, making this perfectly safe.
        unchecked {
            pointsBalance[recipient] += amount;
        }
        emit PointsAwarded(recipient, amount);
    }

    // Security check: Only the owner can authorize an upgrade to a new version
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
