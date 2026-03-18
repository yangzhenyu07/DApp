// 引入chai的断言库，用于测试结果校验
import { expect } from "chai";
// 引入hardhat核心库，用于获取ethers、网络提供者等
import hre from "hardhat";
// 引入hardhat的ethers插件，让hardhat支持ethers.js操作
import "@nomicfoundation/hardhat-ethers";

// 测试套件：命名为"Timelock Demo"，包裹所有相关测试用例
describe("Timelock Demo", function () {
  // 单个测试用例：测试"应该能执行延迟操作"
  it("should execute delayed operation", async function () {
    // 从hardhat中解构出ethers对象，用于合约部署、签名者操作等
    const { ethers } = hre;
    // 获取签名者列表，[deployer]表示取第一个签名者（部署合约的账户）
    const [deployer] = await ethers.getSigners();

    // 1. 部署Box合约：一个简易的存值/取值合约，作为被时间锁控制的目标合约
    const Box = await ethers.getContractFactory("Box"); // 获取Box合约的工厂类
    const box = await Box.deploy(deployer.address); // 部署Box合约

    await box.waitForDeployment(); // 等待合约部署上链完成

    // 2. 部署自定义的MyTimelock时间锁合约
    const minDelay = 60; // 时间锁的最小延迟时间：60秒（操作必须等待60秒才能执行）
    const proposers = [deployer.address]; // 提案者地址：只有这个地址能发起时间锁操作
    const executors = [deployer.address]; // 执行者地址：只有这个地址能执行已到时间的操作
    const Timelock = await ethers.getContractFactory("MyTimelock"); // 获取MyTimelock合约工厂类
    const timelock = await Timelock.deploy(
      minDelay,
      proposers,
      executors
    ); // 部署时间锁合约，传入构造函数参数
    await timelock.waitForDeployment(); // 等待时间锁合约部署上链完成

    // 3. 将Box合约的所有权转移给时间锁合约
    // 转移后，普通账户无法直接操作Box的受限方法（如setValue），必须通过时间锁执行
    await (await box.transferOwnership(await timelock.getAddress())).wait();

    // 4. 编码要通过时间锁执行的函数调用：对Box的setValue(42)方法进行ABI编码
    // 因为时间锁执行的是"原始的字节码调用"，需要先把函数名+参数编码成bytes格式
    const iface = new ethers.Interface(["function setValue(uint256)"]); // 构建Box合约的接口（指定要调用的函数）
    const data = iface.encodeFunctionData("setValue", [42]); // 编码函数：参数为42，得到调用的字节码
    const target = await box.getAddress(); // 目标合约地址：要操作的Box合约地址
    const value = 0; // 调用合约时发送的ETH数量：0（因为setValue不需要ETH）
    const predecessor = ethers.ZeroHash; // 前置操作哈希：0x0（表示无前置操作，独立的操作）
    const salt = ethers.id("test-operation"); // 操作的盐值：唯一标识这个时间锁操作，防止重复

    // 5. 向时间锁中**调度（queue）** 这个操作：将操作加入时间锁的待执行队列
    await timelock.schedule(
      target,
      value,
      data,
      predecessor,
      salt,
      minDelay
    );

    // ❌ 测试：未到延迟时间执行操作，应该被回滚（失败）
    await expect(
      timelock.execute(target, value, data, predecessor, salt) // 尝试执行操作
    ).to.be.reverted; // 断言：该操作会被合约回滚

    // ⏩ 借助Hardhat的本地网络插件，快进区块链时间（仅本地测试可用，主网不可行）
    await hre.network.provider.send("evm_increaseTime", [70]); // 快进70秒（超过最小延迟60秒）
    await hre.network.provider.send("evm_mine"); // 强制挖矿一个区块，让时间快进生效

    // ✅ 测试：达到延迟时间后，执行时间锁中的操作
    await timelock.execute(
      target,
      value,
      data,
      predecessor,
      salt
    );

    // 校验最终结果：Box合约中的值是否被成功修改为42
    expect(await box.getValue()).to.equal(42);
  });
});