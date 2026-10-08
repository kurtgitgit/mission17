// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title BrgyLinkResolutionLedger
/// @notice Stores privacy-safe integrity commitments for officially resolved blotter cases.
/// @dev The contract never accepts resident names, contact details, locations, narratives, or evidence.
contract BrgyLinkResolutionLedger {
    error Unauthorized();
    error InvalidRecord();
    error RecordAlreadyExists();

    address public immutable owner;

    struct ResolutionRecord {
        bytes32 integrityHash;
        uint64 recordedAt;
        bool exists;
    }

    mapping(bytes32 => ResolutionRecord) private resolutionRecords;

    event ResolutionRecorded(
        bytes32 indexed caseKey,
        bytes32 indexed integrityHash,
        uint64 recordedAt
    );

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    /// @notice Creates one immutable integrity commitment for an officially resolved case.
    /// @param caseKey A keccak256 key derived from the public case reference number.
    /// @param integrityHash A keccak256 digest of non-sensitive case metadata.
    function recordResolution(bytes32 caseKey, bytes32 integrityHash) external onlyOwner {
        if (caseKey == bytes32(0) || integrityHash == bytes32(0)) revert InvalidRecord();
        if (resolutionRecords[caseKey].exists) revert RecordAlreadyExists();

        resolutionRecords[caseKey] = ResolutionRecord({
            integrityHash: integrityHash,
            recordedAt: uint64(block.timestamp),
            exists: true
        });

        emit ResolutionRecorded(caseKey, integrityHash, uint64(block.timestamp));
    }

    function getResolution(bytes32 caseKey)
        external
        view
        returns (bytes32 integrityHash, uint64 recordedAt, bool exists)
    {
        ResolutionRecord memory record = resolutionRecords[caseKey];
        return (record.integrityHash, record.recordedAt, record.exists);
    }
}
