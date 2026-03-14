import { expect } from "chai";
// 导入Hardhat-Chai扩展匹配器，让TS识别区块链专属断言（revertedWith/emit等）
import "@nomicfoundation/hardhat-chai-matchers";
// 从Hardhat获取ethers实例，用于合约部署、账户操作、区块链交互
import { ethers } from "hardhat";
// 导入Hardhat专属签名者类型，包含地址+私钥签名能力，适配测试账户
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
// 从Ethers v6导入核心常量/类型：最大无符号整数（永不过期/无限授权）、标准签名对象
import { MaxUint256, Signature } from "ethers";

/**
 * 生成ERC20Permit专属EIP-712结构化签名
 * 作用：替代传统approve授权，离线生成签名后，由被授权方提交链上完成授权，无需授权者发交易
 * @param wallet 签名者（代币持有者，必须是带私钥的SignerWithAddress）
 * @param token 目标ERC20Permit合约实例
 * @param spender 被授权地址（可使用代币的账户/合约）
 * @param value 授权额度，默认MaxUint256（无限授权）
 * @param deadline 签名过期时间戳，默认MaxUint256（永不过期）
 * @returns Signature Ethers v6标准签名对象，含v/r/s三个验签核心参数
 */
async function getPermitSignature(
  wallet: SignerWithAddress,
  token: any,
  spender: string,
  value: bigint = MaxUint256,
  deadline: bigint = MaxUint256
): Promise<Signature> {
  // 并行获取Permit签名三大必需参数，提升执行效率（Promise.all无先后依赖）
  const [nonce, name, chainId] = await Promise.all([
    token.nonces(wallet.address), // 签名者在该合约的防重放随机数（递增，防止签名被复用）
    token.name(), // 代币名称（EIP-712域分隔符必需，必须与合约内定义一致）
    // 获取当前链ID（防止跨链复用签名），转为bigint适配Ethers v6数值类型规范
    wallet.provider.getNetwork().then(network => BigInt(network.chainId))
  ]);

  // 调用钱包EIP-712结构化签名方法，**离线生成签名**（不上链、零Gas消耗）
  const signatureRaw = await wallet.signTypedData(
    // EIP-712域分隔符：区分不同合约/链/版本，确保签名唯一性
    {
      name: name, // 代币名称
      version: "1", // EIP-712版本号，ERC20Permit标准固定为1
      chainId: chainId, // 当前区块链ID（如测试网31337、主网1）
      verifyingContract: await token.getAddress() // 目标合约地址，签名仅对该合约有效
    },
    // EIP-712类型定义：声明签名字段及类型，必须与合约permit方法参数完全匹配
    {
      Permit: [
        { name: "owner", type: "address" }, // 签名者（代币持有者）地址
        { name: "spender", type: "address" }, // 被授权地址
        { name: "value", type: "uint256" }, // 授权额度（wei单位）
        { name: "nonce", type: "uint256" }, // 防重放随机数
        { name: "deadline", type: "uint256" } // 签名过期时间戳（秒级）
      ]
    },
    // 实际签名的业务数据：与上述类型定义一一对应，为本次授权的具体信息
    { owner: wallet.address, spender, value, nonce, deadline }
  );

  // 将原生签名字符串解析为Ethers v6标准Signature对象（拆分为v/r/s），供合约permit方法验签
  return Signature.from(signatureRaw);
}

// 测试套件：分组管理MyC20Permit合约的所有测试用例，命名与合约名一致
describe("MyC20Permit", function () {
  // 声明全局测试变量，所有用例复用，避免重复初始化
  let myC20Permit: any; // 待测试的MyC20Permit合约实例
  let owner: SignerWithAddress; // 合约部署者/代币接收者（合约构造函数给该地址mint100代币）
  let spender: SignerWithAddress; // 被授权者（使用代币的账户）
  let receiver: SignerWithAddress; // 代币接收者（被授权者转账的目标账户）

  // 前置钩子函数：**每个测试用例执行前自动运行**，初始化合约和测试账户
  beforeEach(async function () {
    // 获取Hardhat本地测试网的前3个测试账户（带签名能力）
    [owner, spender, receiver] = await ethers.getSigners() as SignerWithAddress[];
    // 根据合约名获取合约工厂（Hardhat自动根据Solidity代码生成，用于部署合约）
    const MyC20PermitFactory = await ethers.getContractFactory("MyC20Permit");
    // 匹配合约实际构造函数，仅传1个参数（owner.address），合约会给该地址mint100代币
    myC20Permit = await MyC20PermitFactory.deploy(owner.address);
    // 等待合约部署上链完成（Ethers v6必需步骤，确保后续操作合约已生效）
    await myC20Permit.waitForDeployment();
  });

  // 测试用例1：验证合约基础部署功能
  // 核心校验：合约是否成功部署、合约名称/代币总量是否与预期一致（基础兜底测试）
  it("should deploy with correct contract name and total supply", async function () {
    expect(await myC20Permit.name()).to.equal("MyC20Permit");
    // 额外校验：合约给部署者mint了100个代币（适配18位小数，parseEther转换）
    expect(await myC20Permit.balanceOf(owner.address)).to.equal(ethers.parseEther("100"));
  });

  // 测试用例2：ERC20Permit核心功能 - 签名授权+被授权者转账
  // 核心校验：离线签名有效、链上验签授权成功、被授权者可使用额度转账、授权额度自动扣减
  it("should support permit signature approval and transferFrom", async function () {
    // 定义授权额度：50个代币（不超过owner的100个余额）
    const permitAmount = ethers.parseEther("50");
    // 调用工具函数生成Permit签名，授权spender使用owner的50个代币
    const signature = await getPermitSignature(owner, myC20Permit, spender.address, permitAmount);

    // 调用合约permit方法：链上验签并完成授权
    await myC20Permit.permit(
      owner.address,
      spender.address,
      permitAmount,
      MaxUint256,
      signature.v,
      signature.r,
      signature.s
    );

    // 断言1：授权后，spender对owner代币的授权额度等于预期的50个
    expect(await myC20Permit.allowance(owner.address, spender.address)).to.equal(permitAmount);

    // 定义转账额度：20个代币（从授权额度中扣除）
    const transferAmount = ethers.parseEther("20");
    // 被授权者spender调用transferFrom转账
    await (myC20Permit.connect(spender) as any).transferFrom(
      owner.address,
      receiver.address,
      transferAmount
    );

    // 断言2：接收者余额等于转账额度
    expect(await myC20Permit.balanceOf(receiver.address)).to.equal(transferAmount);
    // 断言3：剩余授权额度=总授权-已转账
    expect(await myC20Permit.allowance(owner.address, spender.address)).to.equal(permitAmount - transferAmount);
    // 断言4：owner剩余余额=初始100个-转账20个
    expect(await myC20Permit.balanceOf(owner.address)).to.equal(ethers.parseEther("80"));
  });

  // 测试用例3：ERC20Permit边界测试 - 过期签名调用permit应回滚
  it("should revert when permit with expired deadline", async function () {
    const permitAmount = ethers.parseEther("30");
    const latestBlock = await ethers.provider.getBlock('latest');
    const expiredDeadline = BigInt(latestBlock!.timestamp - 1000); // 延长过期时间差（避免偶发问题）

    const signature = await getPermitSignature(
      owner,
      myC20Permit,
      spender.address,
      permitAmount,
      expiredDeadline
    );

    // Hardhat + Chai 测试框架中的 交易回滚断言
    await expect(
      myC20Permit.permit(
        owner.address,
        spender.address,
        permitAmount,
        expiredDeadline,
        signature.v,
        signature.r,
        signature.s
      )
    ).to.be.reverted;
  });

  // 测试用例4：边界测试 - 转账额度超过余额应回滚
  it("should revert when transfer amount exceeds owner's balance", async function () {
    const permitAmount = ethers.parseEther("150"); // 授权额度超过owner余额
    const signature = await getPermitSignature(owner, myC20Permit, spender.address, permitAmount);

    // 授权成功（permit不校验余额）
    await myC20Permit.permit(
      owner.address,
      spender.address,
      permitAmount,
      MaxUint256,
      signature.v,
      signature.r,
      signature.s
    );

    const transferAmount = ethers.parseEther("120"); // 转账额度超过owner余额
    // Hardhat + Chai 测试框架中的 交易回滚断言，核心作用是 验证 “超额转账” 场景下，合约会拒绝交易并回滚，确保合约的余额校验逻辑生效
    await expect(
      (myC20Permit.connect(spender) as any).transferFrom(
        owner.address,
        receiver.address,
        transferAmount
      )
    ).to.be.reverted;
  });
});