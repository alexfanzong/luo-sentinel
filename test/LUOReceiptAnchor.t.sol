// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {LUOReceiptAnchor} from "../contracts/LUOReceiptAnchor.sol";

interface Vm {
    function prank(address caller) external;
    function warp(uint256 newTimestamp) external;
    function expectRevert(bytes4 revertData) external;
    function expectRevert(bytes calldata revertData) external;
}

contract LUOReceiptAnchorTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    LUOReceiptAnchor private anchor;
    address private constant REVIEWER = address(0xA11CE);
    address private constant FRONT_RUNNER = address(0xB0B);
    bytes32 private constant EVIDENCE_HASH = keccak256("reviewed-rwa-evidence-v1");
    bytes32 private constant PRODUCT_REF_HASH = keccak256("ondo-ousg-rwa-sample-v0");
    bytes32 private constant NONCE = bytes32(uint256(42));
    address private constant BROWSER_VECTOR_REVIEWER = 0x00000000000000000000000000000000000A11cE;
    uint64 private constant BROWSER_VECTOR_DECISION_TIME = 1_782_087_000;
    bytes32 private constant BROWSER_VECTOR_EVIDENCE_HASH =
        0xd3f1445b3056ff6df2ff807470a73de05a954f6f0b3a6e84514174f8406c1feb;
    bytes32 private constant BROWSER_VECTOR_PRODUCT_REF_HASH =
        0x0e2a67482db97d22a92681869a6cc6c3e8a2efd19d51cd49c239539a7006c841;
    bytes32 private constant BROWSER_VECTOR_NONCE = bytes32(uint256(42));
    bytes32 private constant BROWSER_VECTOR_RECEIPT_HASH =
        0x62a3ba15af26a092095f1580b084d0142b6c551b57bdf74b97c98b7d1949bc15;

    function setUp() public {
        anchor = new LUOReceiptAnchor();
        vm.warp(1_750_000_000);
    }

    function testAnchorProceedRecomputesHashAndBindsCaller() public {
        uint64 decidedAt = uint64(block.timestamp);
        bytes32 expectedHash = anchor.computeReceiptHash(
            EVIDENCE_HASH,
            PRODUCT_REF_HASH,
            REVIEWER,
            decidedAt,
            NONCE
        );

        vm.prank(REVIEWER);
        bytes32 receiptHash = anchor.anchorProceed(
            EVIDENCE_HASH,
            PRODUCT_REF_HASH,
            decidedAt,
            NONCE
        );

        require(receiptHash == expectedHash, "receipt hash must be contract-derived");
        (
            address submitter,
            uint64 anchoredAt,
            uint64 storedDecisionTime,
            bytes32 storedEvidenceHash,
            bytes32 storedProductRefHash
        ) = anchor.getRecord(receiptHash);

        require(submitter == REVIEWER, "receipt must bind caller");
        require(anchoredAt == uint64(block.timestamp), "anchor time mismatch");
        require(storedDecisionTime == decidedAt, "decision time mismatch");
        require(storedEvidenceHash == EVIDENCE_HASH, "evidence hash mismatch");
        require(storedProductRefHash == PRODUCT_REF_HASH, "product hash mismatch");
    }

    function testMatchesThePinnedBrowserReceiptVector() public view {
        bytes32 receiptHash = anchor.computeReceiptHash(
            BROWSER_VECTOR_EVIDENCE_HASH,
            BROWSER_VECTOR_PRODUCT_REF_HASH,
            BROWSER_VECTOR_REVIEWER,
            BROWSER_VECTOR_DECISION_TIME,
            BROWSER_VECTOR_NONCE
        );

        require(receiptHash == BROWSER_VECTOR_RECEIPT_HASH, "browser and contract vectors must match");
    }

    function testSameInputsFromAnotherWalletProduceAnotherReceipt() public {
        uint64 decidedAt = uint64(block.timestamp);

        vm.prank(FRONT_RUNNER);
        bytes32 attackerReceipt = anchor.anchorProceed(
            EVIDENCE_HASH,
            PRODUCT_REF_HASH,
            decidedAt,
            NONCE
        );

        vm.prank(REVIEWER);
        bytes32 reviewerReceipt = anchor.anchorProceed(
            EVIDENCE_HASH,
            PRODUCT_REF_HASH,
            decidedAt,
            NONCE
        );

        require(attackerReceipt != reviewerReceipt, "caller must be part of receipt hash");
        require(anchor.isAnchored(reviewerReceipt), "reviewer receipt must remain anchorable");
    }

    function testRejectsFutureAndExpiredDecisions() public {
        uint64 futureTime = uint64(block.timestamp + 1);
        vm.expectRevert(LUOReceiptAnchor.FutureDecisionTime.selector);
        vm.prank(REVIEWER);
        anchor.anchorProceed(EVIDENCE_HASH, PRODUCT_REF_HASH, futureTime, NONCE);

        uint64 expiredTime = uint64(block.timestamp - anchor.MAX_DECISION_AGE() - 1);
        vm.expectRevert(LUOReceiptAnchor.DecisionExpired.selector);
        vm.prank(REVIEWER);
        anchor.anchorProceed(EVIDENCE_HASH, PRODUCT_REF_HASH, expiredTime, NONCE);
    }

    function testRejectsDuplicateReceiptFromTheSameWallet() public {
        uint64 decidedAt = uint64(block.timestamp);
        bytes32 receiptHash = anchor.computeReceiptHash(
            EVIDENCE_HASH,
            PRODUCT_REF_HASH,
            REVIEWER,
            decidedAt,
            NONCE
        );
        vm.prank(REVIEWER);
        anchor.anchorProceed(EVIDENCE_HASH, PRODUCT_REF_HASH, decidedAt, NONCE);

        vm.expectRevert(
            abi.encodeWithSelector(LUOReceiptAnchor.AlreadyAnchored.selector, receiptHash)
        );
        vm.prank(REVIEWER);
        anchor.anchorProceed(EVIDENCE_HASH, PRODUCT_REF_HASH, decidedAt, NONCE);
    }
}
