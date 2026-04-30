# Solidity patterns

## Core encrypted types

Use the smallest encrypted type that matches the business domain:

- `ebool`
- `euint8`
- `euint16`
- `euint32`
- `euint64`
- `euint128`
- `euint256`
- `eaddress`

For fresh user inputs, use the external variants such as `externalEbool`, `externalEuint32`, or `externalEaddress`.

## Canonical import block

```solidity
pragma solidity ^0.8.24;

import {
    FHE,
    ebool,
    euint32,
    euint64,
    externalEbool,
    externalEuint64
} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
```

## Minimal contract skeleton

```solidity
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract ConfidentialCounter is ZamaEthereumConfig {
    euint64 private _counter;

    function increment(externalEuint64 amount, bytes calldata inputProof) external {
        if (!FHE.isInitialized(_counter)) {
            _counter = FHE.asEuint64(0);
            FHE.allowThis(_counter);
        }

        euint64 delta = FHE.fromExternal(amount, inputProof);
        _counter = FHE.add(_counter, delta);

        FHE.allowThis(_counter);
        FHE.allow(_counter, msg.sender);
    }

    function counterHandle() external view returns (euint64) {
        return _counter;
    }
}
```

## Fresh encrypted inputs and proofs

Every fresh encrypted value created offchain must arrive as:

- an `externalE...` Solidity argument
- a matching `bytes calldata inputProof`

Import it like this:

```solidity
euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
```

If multiple external ciphertexts were created in the same input buffer, they can share the same `inputProof`.

## Operations to prefer

Common operations on encrypted values:

- arithmetic: `FHE.add`, `FHE.sub`, `FHE.mul`, `FHE.div`, `FHE.rem`, `FHE.min`, `FHE.max`
- comparisons: `FHE.eq`, `FHE.ne`, `FHE.lt`, `FHE.le`, `FHE.gt`, `FHE.ge`
- conditionals: `FHE.select`
- bitwise: `FHE.and`, `FHE.or`, `FHE.xor`, `FHE.not`, `FHE.shl`, `FHE.shr`
- randomness: `FHE.randEuintX` where the use case truly needs onchain random ciphertexts

Use plaintext scalars where supported. It is cheaper than wrapping constants into encrypted values unnecessarily.

## ACL rules

The ACL is required for any ciphertext that will be reused or decrypted later.

- `FHE.allow(ciphertext, account)`: persistent access
- `FHE.allowThis(ciphertext)`: shorthand for allowing the current contract
- `FHE.allowTransient(ciphertext, account)`: same-transaction access only
- `FHE.makePubliclyDecryptable(ciphertext)`: opt-in public reveal

Example for same-transaction cross-contract calls:

```solidity
euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
FHE.allowTransient(amount, address(token));
token.confidentialTransfer(to, amount);
```

## Conditional logic and overflow defense

Encrypted arithmetic wraps on overflow. Guard important state transitions explicitly:

```solidity
euint32 nextTotal = FHE.add(totalVotes, delta);
ebool overflowed = FHE.lt(nextTotal, totalVotes);
totalVotes = FHE.select(overflowed, totalVotes, nextTotal);
```

## View functions

View functions can return encrypted handles, not cleartext values.

```solidity
function balanceHandle(address account) external view returns (euint64) {
    return _balances[account];
}
```

Do not promise that a `view` call reveals plaintext onchain. Plaintext recovery happens offchain through user decryption or public decryption.

## Initialization checks

If a ciphertext may be conditionally initialized, guard it before use:

```solidity
require(FHE.isInitialized(counter), "Counter not initialized");
```

Prefer lazy initialization for encrypted state unless you have already verified that constructor-time FHE operations are safe in the exact deployment path you are using.

## Common mistakes

- forgetting `FHE.allowThis` after replacing stored encrypted state
- forgetting `FHE.allow` for the user or operator expected to decrypt later
- using an encrypted divisor in `FHE.div` or `FHE.rem`
- returning encrypted handles and describing them as plaintext results
- using `euint256` when `euint32` or `euint64` would be enough
- writing new code with deprecated `TFHE` or `einput` patterns