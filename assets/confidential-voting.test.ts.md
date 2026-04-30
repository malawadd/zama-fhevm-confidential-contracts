# Confidential voting Hardhat test template

```ts
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("ConfidentialVoting", function () {
  it("counts encrypted yes and no votes", async function () {
    const [chairperson, alice, bob] = await ethers.getSigners();

    const factory = await ethers.getContractFactory("ConfidentialVoting");
    const voting = await factory.connect(chairperson).deploy(3600);
    await voting.waitForDeployment();

    const votingAddress = await voting.getAddress();

    const aliceInput = fhevm.createEncryptedInput(votingAddress, alice.address);
    aliceInput.addBool(true);
    const aliceEncrypted = await aliceInput.encrypt();
    await (await voting.connect(alice).castVote(aliceEncrypted.handles[0], aliceEncrypted.inputProof)).wait();

    const bobInput = fhevm.createEncryptedInput(votingAddress, bob.address);
    bobInput.addBool(false);
    const bobEncrypted = await bobInput.encrypt();
    await (await voting.connect(bob).castVote(bobEncrypted.handles[0], bobEncrypted.inputProof)).wait();

    const yesHandle = await voting.yesVotesHandle();
    const noHandle = await voting.noVotesHandle();

    const clearYes = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      yesHandle,
      votingAddress,
      chairperson,
    );
    const clearNo = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      noHandle,
      votingAddress,
      chairperson,
    );

    expect(clearYes).to.equal(1n);
    expect(clearNo).to.equal(1n);
  });
});
```

Extend this template when you need:

- duplicate-vote rejection tests
- time-based public reveal tests
- integration tests against a frontend or relayer-backed flow