# Confidential voting Solidity template

Use this as the default starting point for a simple encrypted yes or no voting contract.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, euint32, externalEbool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract ConfidentialVoting is ZamaEthereumConfig {
    error AlreadyVoted();
    error VotingClosed();
    error VotingStillOpen();
    error NotChairperson();

    address public immutable chairperson;
    uint64 public immutable endsAt;
    bool public resultPublic;

    mapping(address => bool) public hasVoted;

    euint32 private _yesVotes;
    euint32 private _noVotes;

    constructor(uint64 durationSeconds) {
        chairperson = msg.sender;
        endsAt = uint64(block.timestamp) + durationSeconds;
    }

    function castVote(externalEbool encryptedSupport, bytes calldata inputProof) external {
        if (block.timestamp >= endsAt) revert VotingClosed();
        if (hasVoted[msg.sender]) revert AlreadyVoted();

        _ensureTalliesInitialized();

        ebool support = FHE.fromExternal(encryptedSupport, inputProof);
        euint32 one = FHE.asEuint32(1);
        euint32 zero = FHE.asEuint32(0);

        _yesVotes = FHE.add(_yesVotes, FHE.select(support, one, zero));
        _noVotes = FHE.add(_noVotes, FHE.select(support, zero, one));
        hasVoted[msg.sender] = true;

        FHE.allowThis(_yesVotes);
        FHE.allowThis(_noVotes);
        FHE.allow(_yesVotes, chairperson);
        FHE.allow(_noVotes, chairperson);
    }

    function makeResultsPublic() external {
        if (msg.sender != chairperson) revert NotChairperson();
        if (block.timestamp < endsAt) revert VotingStillOpen();
        if (resultPublic) return;

        _ensureTalliesInitialized();

        _yesVotes = FHE.makePubliclyDecryptable(_yesVotes);
        _noVotes = FHE.makePubliclyDecryptable(_noVotes);
        resultPublic = true;
    }

    function yesVotesHandle() external view returns (euint32) {
        return _yesVotes;
    }

    function noVotesHandle() external view returns (euint32) {
        return _noVotes;
    }

    function _ensureTalliesInitialized() internal {
        if (!FHE.isInitialized(_yesVotes)) {
            _yesVotes = FHE.asEuint32(0);
            FHE.allowThis(_yesVotes);
            FHE.allow(_yesVotes, chairperson);
        }

        if (!FHE.isInitialized(_noVotes)) {
            _noVotes = FHE.asEuint32(0);
            FHE.allowThis(_noVotes);
            FHE.allow(_noVotes, chairperson);
        }
    }
}
```

Notes:

- this pattern keeps vote choice confidential, not voter addresses
- the chairperson is allowed to user-decrypt the tallies
- `makeResultsPublic` is optional and demonstrates a public reveal flow