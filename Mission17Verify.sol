// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Mission17Verify {
    address public owner;
    event MissionVerified(string userId, string missionTitle, uint256 timestamp);

    constructor() {
        owner = msg.sender;
    }

    function verifyMission(string memory _userId, string memory _missionTitle) public {
        require(msg.sender == owner, "Only owner can call this");
        emit MissionVerified(_userId, _missionTitle, block.timestamp);
    }
}