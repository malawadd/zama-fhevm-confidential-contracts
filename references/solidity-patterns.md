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

## Ciphertext state mutation and re-allowing

Every assignment that stores the result of an FHE operation creates a new ciphertext handle.
Treat that new handle as a fresh ACL object, even if the variable name did not change.

```solidity
function increment(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
    euint64 delta = FHE.fromExternal(encryptedAmount, inputProof);

    if (!FHE.isInitialized(_counter)) {
        _counter = FHE.asEuint64(0);
        FHE.allowThis(_counter);
    }

    _counter = FHE.add(_counter, delta);

    FHE.allowThis(_counter);
    FHE.allow(_counter, msg.sender);
}
```

Apply the same rule after `FHE.sub`, `FHE.select`, `FHE.min`, `FHE.max`, or any helper that replaces encrypted state.
If another contract needs the handle only inside the same transaction, use `FHE.allowTransient` on the new handle before the call.

## Operations to prefer

Common operations on encrypted values:

- arithmetic: `FHE.add`, `FHE.sub`, `FHE.mul`, `FHE.div`, `FHE.rem`, `FHE.min`, `FHE.max`
- comparisons: `FHE.eq`, `FHE.ne`, `FHE.lt`, `FHE.le`, `FHE.gt`, `FHE.ge`
- conditionals: `FHE.select`
- bitwise: `FHE.and`, `FHE.or`, `FHE.xor`, `FHE.not`, `FHE.shl`, `FHE.shr`
- randomness: `FHE.randEuintX` where the use case truly needs onchain random ciphertexts

Use plaintext scalars where supported. It is cheaper than wrapping constants into encrypted values unnecessarily.

## Plaintext scalar inputs with FHE-enforced checks

Not every user-controlled value must arrive as an encrypted input.
If the privacy boundary is the stored ciphertext state rather than the submitted scalar, keep the scalar plaintext and enforce the business rule with FHE comparisons or selection logic.

```solidity
function withdraw(uint64 amount) external {
    euint64 currentBalance = _balances[msg.sender];
    euint64 nextBalance = FHE.sub(currentBalance, amount);
    ebool enoughBalance = FHE.ge(currentBalance, amount);

    _balances[msg.sender] = FHE.select(enoughBalance, nextBalance, currentBalance);

    FHE.allowThis(_balances[msg.sender]);
    FHE.allow(_balances[msg.sender], msg.sender);
}
```

Use this pattern when all of the following are true:

- the plaintext scalar itself does not need confidentiality
- the confidential state remains encrypted throughout the decision
- the result is still written back as encrypted state with fresh ACL grants

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

When batching multiple updates, bound the loop with plaintext counters and grant permissions only to the actors that truly need the resulting handles later.

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

## Hybrid encrypted and plaintext state

Real FHEVM applications often split state deliberately:

- encrypted values for balances, tallies, limits, or eligibility results
- plaintext values for membership flags, roles, timestamps, loop bounds, and counts

This keeps gas and control flow manageable while preserving confidentiality where it matters.
Do not encrypt a flag, counter, or timestamp unless the privacy model actually requires that field to remain confidential.

Typical examples:

- a private payroll amount with a plaintext employee registry
- an encrypted vote tally with plaintext election timing and voter participation flags
- an encrypted credit limit with plaintext loan status and repayment timestamps

## Common mistakes

- forgetting `FHE.allowThis` after replacing stored encrypted state
- assuming a reassigned ciphertext keeps the old ACL grants automatically
- forgetting `FHE.allow` for the user or operator expected to decrypt later
- encrypting membership flags, loop bounds, or timestamps without a real privacy need
- forcing a plaintext workflow into an `externalE...` interface or the reverse
- using an encrypted divisor in `FHE.div` or `FHE.rem`
- returning encrypted handles and describing them as plaintext results
- using `euint256` when `euint32` or `euint64` would be enough
- writing new code with deprecated `TFHE` or `einput` patterns