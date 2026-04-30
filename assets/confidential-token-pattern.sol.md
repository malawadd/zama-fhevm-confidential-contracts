# Confidential token Solidity template

Use this when the user asks for a confidential fungible token based on OpenZeppelin and ERC-7984.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";

contract PrivateTreasuryToken is ERC7984, Ownable, ZamaEthereumConfig {
    constructor(address owner_)
        ERC7984("Private Treasury Token", "PTT", "ipfs://private-treasury-token")
        Ownable(owner_)
    {}

    function mint(address to, externalEuint64 amount, bytes calldata inputProof) external onlyOwner {
        _mint(to, FHE.fromExternal(amount, inputProof));
    }

    function burn(address from, externalEuint64 amount, bytes calldata inputProof) external onlyOwner {
        _burn(from, FHE.fromExternal(amount, inputProof));
    }
}
```

Design notes:

- ERC-7984 is draft and not ERC-20 compatible
- operators are time-bounded and are not decrypt approvals
- for wrap and unwrap flows, pair this token with an ERC-20 wrapper or bridge that explicitly handles proof verification and public finalization where needed