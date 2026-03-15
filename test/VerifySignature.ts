import { expect } from "chai";
import "@nomicfoundation/hardhat-chai-matchers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

// 测试加签数据
const TEST_MESSAGE = "yangzhenyu";


// 全局加签方法：入参消息+签名者，返回生成的签名
async function generateSignature(message: string, signer: SignerWithAddress) {
  // 1. 消息转UTF-8字节数组
  const messageBytes = ethers.toUtf8Bytes(message);
  // 2. Keccak256哈希
  const messageHash = ethers.keccak256(messageBytes);
  // 3. 哈希转字节数组（适配signMessage接口）
  const messageHashBytes = ethers.toBeArray(messageHash);
  // 4. 签名并返回结果
  return await signer.signMessage(messageHashBytes);
}

describe("VerifySignature", function () {
  // 声明全局测试变量，所有用例复用，统一any类型
  let verifySignature: any;
  // 签名者账户
  let signer: SignerWithAddress;
  // 另外的账户
  let otherSigner: SignerWithAddress;


  // 前置钩子：每个用例执行前初始化，和你示例的beforeEach保持一致
  beforeEach(async function () {
    // 获取Hardhat本地测试账户（第一个作为签名者）
    [signer, otherSigner]  = await ethers.getSigners() as SignerWithAddress[];
    
    // 获取合约工厂，部署合约（完全对齐你示例的部署写法）
    const VerifySignature2Factory = await ethers.getContractFactory("VerifySignature");
    verifySignature = await VerifySignature2Factory.deploy();
    // 等待合约部署上链生效
    await verifySignature.waitForDeployment();
  });

  // 核心用例1：验证有效签名能正确恢复出签名者地址
  it("should recover correct signer address with valid signature", async function () {
    // 直接调用抽离的方法生成签名，一行搞定
    const signature = await generateSignature(TEST_MESSAGE, signer);
    // 合约验签
    const recoveredAddress = await verifySignature.recover(TEST_MESSAGE, signature);
    // 断言
    expect(recoveredAddress).to.equal(signer.address);
  });

  // 边界用例2：验证无效签名无法恢复出正确地址
  it("should not recover correct signer address with invalid signature", async function () {
    // 构造「格式合法但内容无效」的签名：用另一个账户签名相同消息
    const invalidSignature = await generateSignature(TEST_MESSAGE, otherSigner);
    // 合约验签
    const recoveredAddress = await verifySignature.recover(TEST_MESSAGE, invalidSignature);
    // 断言
    expect(recoveredAddress).to.not.equal(signer.address);
  });

  // 边界用例3：验证修改原始消息后，有效签名也会验签失败（覆盖消息篡改场景）
  it("should fail when message is tampered with valid signature", async function () {
    // 调用抽离方法生成有效签名
    const validSignature = await generateSignature(TEST_MESSAGE, signer);
    // 篡改原始消息
    const tamperedMessage = "yangzhenyu ";
    // 合约验签篡改后的消息
    const recoveredAddress = await verifySignature.recover(tamperedMessage, validSignature);
    // 断言
    expect(recoveredAddress).to.not.equal(signer.address);
  });
});