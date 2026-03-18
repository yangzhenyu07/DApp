// 引入chai断言库，用于测试结果的校验
import { expect } from "chai";
// 引入Hardhat核心库，用于获取ethers、操作区块链网络等
import hre from "hardhat";
// 引入Hardhat的ethers插件，让Hardhat支持ethers.js的语法
import "@nomicfoundation/hardhat-ethers";

// 定义测试套件，名称为"Vesting Demo"（锁仓释放演示）
describe("Vesting Demo", function () {
  // 单个测试用例：测试代币是否会随时间正确释放
  it("should release tokens over time", async function () {
    // 从hardhat中解构出ethers对象，用于合约部署、签名、交易等操作
    const { ethers } = hre;
    // 获取测试账户：deployer（部署者）、user（锁仓代币的接收用户）
    const [deployer, user] = await ethers.getSigners();

    // 1. 部署自定义ERC20代币合约（MyToken）
    const Token = await ethers.getContractFactory("MyToken"); // 加载合约工厂
    const token = await Token.deploy(); // 部署合约
    await token.waitForDeployment(); // 等待部署交易上链确认
    // 代币合约地址	
    const tokenAddress = await token.getAddress(); // 提前获取代币地址，避免重复调用

    // 2. 获取当前区块链的最新区块信息，提取区块时间戳（链上时间）
    const block = await ethers.provider.getBlock("latest");
    // 移除非空断言，做空值判断，避免运行时错误
    if (!block) throw new Error("Failed to get latest block");
    const now = block.timestamp; 
    const start = now + 10; // 锁仓释放的**起始时间**：当前时间10秒后
    const duration = 100;   // 锁仓释放的**持续时间**：从start开始，100秒内释放完毕

    // 3. 部署锁仓释放合约（MyVesting）
    const Vesting = await ethers.getContractFactory("MyVesting"); // 加载锁仓合约工厂
    const vesting = await Vesting.deploy(
      user.address, // 目标接收用户地址
      start,        // 释放起始时间戳
      duration      // 释放持续时间
    );
    await vesting.waitForDeployment(); // 等待锁仓合约部署上链
    const vestingAddress = await vesting.getAddress(); // 提前获取锁仓合约地址

    // 4. 给锁仓合约转入代币（作为待释放的代币池）
    const totalAmount = ethers.parseEther("1000"); // 转入1000个代币（wei单位）
    await (await token.transfer(vestingAddress, totalAmount)).wait(); // 转账并等待上链

    // ✅ 核心修复：用显式函数签名调用，解决重载歧义（替代粗暴的as any）
    // 定义合约方法的签名调用方式，避免ethers.js无法区分同名不同参的函数
    const getReleasable = (tokenAddr: string) => 
      vesting["releasable(address)"](tokenAddr); // 明确调用带address参数的releasable
    const releaseToken = async (tokenAddr: string) => {
      const contract = vesting.connect(user) as any;
      return contract["release(address)"](tokenAddr);
    }; // 明确调用带address参数的release
    // 🧪 测试1：释放起始时间**之前**，可释放代币量应为0
    const releasable0 = await getReleasable(tokenAddress);
    expect(releasable0).to.equal(0n); // 断言：可释放量等于0（BigInt类型）

    // ⏩ 手动推进区块链时间（测试链专属操作，主网不可用）：推进20秒
    await hre.network.provider.send("evm_increaseTime", [20]);
    await hre.network.provider.send("evm_mine"); // 挖矿生成新块，让时间推进生效

    // 🧪 测试2：推进时间后（已过起始时间10秒），应有**部分代币**可释放
    const releasable1 = await getReleasable(tokenAddress);
    expect(releasable1).to.be.gt(0n); // 断言：可释放量大于0（BigInt类型）

    // 执行代币释放操作：由目标用户发起释放交易（指定代币地址）
    await releaseToken(tokenAddress);
    // 检查用户钱包的代币余额，确认释放成功
    const balance1 = await token.balanceOf(user.address);
    expect(balance1).to.be.gt(0n); // 断言：用户余额大于0

    // ⏩ 再次推进区块链时间：再推进200秒（累计推进220秒，远超100秒的释放周期）
    await hre.network.provider.send("evm_increaseTime", [200]);
    await hre.network.provider.send("evm_mine"); // 挖矿让时间生效

    // 再次执行释放操作：释放剩余所有代币
    await releaseToken(tokenAddress);
    // 检查用户钱包最终余额
    const balance2 = await token.balanceOf(user.address);
    expect(balance2).to.equal(totalAmount); // 断言：用户余额等于最初转入的1000个代币（全部释放）
  });
});