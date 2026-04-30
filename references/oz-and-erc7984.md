# OpenZeppelin and ERC-7984

## What ERC-7984 is

ERC-7984 is a draft confidential fungible token standard. It is built around pointer-based confidential amounts represented as `bytes32` handles. It is inspired by ERC-20 but is not ERC-20 compatible.

Call out these facts whenever you use it:

- balances and transfer amounts are confidential handles, not plaintext integers
- addresses remain public onchain unless the broader protocol hides them elsewhere
- operator approval is time-bounded and not the same as an ERC-20 allowance
- callbacks add utility but also reentrancy and gas-griefing risk

## Core ERC-7984 methods

The key methods an agent should understand are:

- `confidentialTotalSupply()`
- `confidentialBalanceOf(address)`
- `isOperator(address,address)`
- `setOperator(address,uint48)`
- `confidentialTransfer(...)`
- `confidentialTransferFrom(...)`
- `confidentialTransferAndCall(...)`
- `confidentialTransferFromAndCall(...)`

The `bytes data` parameter is where implementation-specific proof material goes.

## Recommended OpenZeppelin primitives

When the user wants a standard confidential token, prefer OpenZeppelin's confidential contracts package and start from `ERC7984`.

Minimal privileged mint and burn pattern:

```solidity
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

## Wrap and unwrap between ERC-20 and ERC-7984

The standard wrap flow is:

1. transfer in the underlying ERC-20 amount
2. normalize the amount against the wrapper's rate if required
3. mint the confidential ERC-7984 amount to the recipient

The standard unwrap or disclose-to-ERC-20 flow is more complex:

1. accept a confidential amount plus proof material
2. move or burn the confidential amount
3. make the realized amount publicly decryptable if an offchain finalize step is needed
4. verify the decryption proof onchain with `FHE.checkSignatures`
5. release the underlying ERC-20 amount

Use the wrapper utilities from OpenZeppelin when they match the task. If you build a custom bridge or swap, be explicit about who is allowed to decrypt and when finalization happens.

## Operators and callbacks

Important semantics:

- `setOperator` uses an expiration timestamp, not a numeric allowance
- an operator can move tokens but does not automatically gain the right to decrypt balances
- callback receivers must implement `onConfidentialTransferReceived`
- callback variants should use reentrancy protection or other defensive patterns

## OpenZeppelin-specific caution

OpenZeppelin's confidential contracts docs explicitly say the library moves quickly, is not formally audited in the same way as their mainline contracts, and does not promise backward compatibility. Treat it as powerful but version-sensitive.

## App-side caveat

Some OpenZeppelin examples still mention `fhevm-js` for creating confidential amounts. For new application code in this skill, prefer `@zama-fhe/relayer-sdk` unless the target codebase is already pinned to older tooling.