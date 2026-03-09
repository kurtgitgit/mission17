// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Mission17Verify {
    // 🔥 OPTIMIZATION 1: Use 'immutable' for write-once variables. 
    // Reads from bytecode instead of expensive storage (Saves ~2,100 gas per tx)
    address public immutable owner;

    // 🔥 OPTIMIZATION 2: Use Custom Errors instead of long require() strings.
    error Unauthorized();

    event MissionVerified(string userId, string missionTitle, uint256 timestamp);

    constructor() {
        owner = msg.sender;
    }

    // 🔥 OPTIMIZATION 3: 'external' instead of 'public'
    // 🔥 OPTIMIZATION 4: 'calldata' instead of 'memory'
    // Avoids copying large strings into temporary memory, copying directly from tx data.
    function verifyMission(string calldata _userId, string calldata _missionTitle) external {
        if (msg.sender != owner) revert Unauthorized();
        emit MissionVerified(_userId, _missionTitle, block.timestamp);
    }
}
