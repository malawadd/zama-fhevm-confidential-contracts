# Troubleshooting

## Common failure signatures

### Decryption fails even though the handle exists

Likely causes:

- the contract never called `FHE.allow(ciphertext, user)`
- the contract replaced stored ciphertext and forgot to call `FHE.allowThis` on the new value
- the wrong contract address was supplied to the relayer or Hardhat decryption helper

Fix by tracing the full ciphertext lifecycle and re-granting ACL permissions on every new handle.

### Contract call reverts when importing an encrypted input

Likely causes:

- the `inputProof` does not match the uploaded ciphertext handles
- the frontend used the wrong contract address or user address in `createEncryptedInput`
- the Solidity signature does not use the matching `externalE...` type

Fix by regenerating the encrypted buffer and verifying type alignment on both sides.

### The code returns an encrypted handle from a view function and the UI shows garbage

That is expected. A `view` function returns a ciphertext handle, not plaintext. The frontend must perform user decryption or public decryption.

### The code uses `TFHE`, `einput`, or old gateway-request APIs

This is legacy code. Update it to:

- `FHE`
- `externalEuint...`, `externalEbool`, `externalEaddress`
- relayer-based user or public decryption flows

### Arithmetic silently wraps

Encrypted arithmetic does not automatically surface overflow. Guard sensitive state transitions with `FHE.select` and comparison checks.

### Cross-contract confidential call fails inside the same transaction

You probably needed `FHE.allowTransient` before passing a ciphertext to another contract for same-transaction use.

### Public decryption works offchain but onchain finalization fails

The contract likely forgot to:

- call `FHE.makePubliclyDecryptable`
- validate the returned proof with `FHE.checkSignatures`
- match the handles and ABI-encoded cleartext in the same order used by the relayer

### ERC-7984 transfer logic is wrong around operators

Remember:

- operator approval is time-based, not amount-based
- operators do not automatically get decrypt rights
- callback variants need reentrancy review

### Hardhat behaves unexpectedly with a recent Node.js version

Check the runtime version first. Hardhat expects an even-numbered Node.js LTS line.

### Deployment reverts in the constructor around `FHE.asEuintX(...)` or `trivialEncrypt`

This usually means the deployment path cannot safely perform that encrypted initialization inside the constructor, even if a direct factory deployment in tests appears to work.

Fix by:

- lazily initializing encrypted state in the first state-changing call that needs it
- assigning the returned handle back to storage when using helpers such as `FHE.allow`, `FHE.allowThis`, or `FHE.makePubliclyDecryptable` on previously uninitialized values
- re-running both the deploy command and the focused test after the change

### The agent claims the token is fully private

Reject that wording unless the design hides more than the amount. ERC-7984 and FHEVM keep amounts confidential, but addresses and transaction metadata remain visible onchain.