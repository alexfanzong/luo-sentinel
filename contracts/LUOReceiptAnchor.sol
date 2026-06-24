// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title LUOReceiptAnchor
/// @notice Anchors a wallet-bound, human-approved RWA evidence receipt.
/// @dev This contract does not transfer value or decide legal outcomes.
///      It records that the submitting wallet anchored a specific evidence and
///      product commitment within a short approval window.
contract LUOReceiptAnchor {
    bytes32 public constant SCHEMA_VERSION_HASH = keccak256("LUO_SENTINEL_PROCEED_RECEIPT_V1");
    uint64 public constant MAX_DECISION_AGE = 1 hours;

    struct Record {
        address submitter;
        uint64 anchoredAt;
        uint64 decidedAt;
        bytes32 evidenceHash;
        bytes32 productRefHash;
    }

    mapping(bytes32 => Record) private records;

    event ProceedReceiptAnchored(
        bytes32 indexed receiptHash,
        address indexed submitter,
        bytes32 indexed evidenceHash,
        bytes32 productRefHash,
        uint64 decidedAt,
        uint64 anchoredAt
    );

    error AlreadyAnchored(bytes32 receiptHash);
    error DecisionExpired();
    error FutureDecisionTime();
    error UnknownReceipt(bytes32 receiptHash);
    error ZeroValue();

    /// @notice Computes the only receipt-hash format accepted by anchorProceed.
    /// @dev The reviewer wallet is part of the preimage to prevent a front-runner
    ///      from occupying another wallet's receipt hash.
    function computeReceiptHash(
        bytes32 evidenceHash,
        bytes32 productRefHash,
        address reviewer,
        uint64 decidedAt,
        bytes32 nonce
    ) public pure returns (bytes32) {
        return keccak256(
            abi.encode(
                SCHEMA_VERSION_HASH,
                evidenceHash,
                productRefHash,
                reviewer,
                decidedAt,
                nonce
            )
        );
    }

    /// @notice Anchors a single explicit Proceed decision.
    /// @dev Hold decisions intentionally remain off-chain and cost no gas.
    function anchorProceed(
        bytes32 evidenceHash,
        bytes32 productRefHash,
        uint64 decidedAt,
        bytes32 nonce
    ) external returns (bytes32 receiptHash) {
        if (evidenceHash == bytes32(0) || productRefHash == bytes32(0) || nonce == bytes32(0)) {
            revert ZeroValue();
        }
        if (decidedAt > block.timestamp) revert FutureDecisionTime();
        if (block.timestamp - decidedAt > MAX_DECISION_AGE) revert DecisionExpired();

        receiptHash = computeReceiptHash(
            evidenceHash,
            productRefHash,
            msg.sender,
            decidedAt,
            nonce
        );
        if (records[receiptHash].submitter != address(0)) revert AlreadyAnchored(receiptHash);

        records[receiptHash] = Record({
            submitter: msg.sender,
            anchoredAt: uint64(block.timestamp),
            decidedAt: decidedAt,
            evidenceHash: evidenceHash,
            productRefHash: productRefHash
        });

        emit ProceedReceiptAnchored(
            receiptHash,
            msg.sender,
            evidenceHash,
            productRefHash,
            decidedAt,
            uint64(block.timestamp)
        );
    }

    function isAnchored(bytes32 receiptHash) external view returns (bool) {
        return records[receiptHash].submitter != address(0);
    }

    function getRecord(bytes32 receiptHash)
        external
        view
        returns (
            address submitter,
            uint64 anchoredAt,
            uint64 decidedAt,
            bytes32 evidenceHash,
            bytes32 productRefHash
        )
    {
        Record storage record = records[receiptHash];
        if (record.submitter == address(0)) revert UnknownReceipt(receiptHash);

        return (
            record.submitter,
            record.anchoredAt,
            record.decidedAt,
            record.evidenceHash,
            record.productRefHash
        );
    }
}
