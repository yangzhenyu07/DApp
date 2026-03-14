import { expect } from "chai";
import { ethers } from "hardhat";

describe("MyC20", function () {
  it("Test contract", async function () {
    const ContractFactory = await ethers.getContractFactory("MyC20");

    const recipient = (await ethers.getSigners())[0].address;
    const initialOwner = (await ethers.getSigners())[1].address;

    const instance = await ContractFactory.deploy(recipient, initialOwner);
    await instance.waitForDeployment();

    expect(await instance.name()).to.equal("MyC20");
  });
});
