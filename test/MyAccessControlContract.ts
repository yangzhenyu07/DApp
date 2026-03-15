import { expect } from "chai";
import "@nomicfoundation/hardhat-chai-matchers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

// 声明合约中自定义的角色（和你的Solidity合约角色名保持一致）
const ROLE_MANAGER = ethers.keccak256(ethers.toUtf8Bytes("ROLE_MANAGER"));
const ROLE_NORMAL = ethers.keccak256(ethers.toUtf8Bytes("ROLE_NORMAL"));
// 内置默认管理员角色（AccessControl 原生常量）
const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;

describe("MyAccessControlContract", function () {
  // 全局测试变量，复用+any类型对齐原示例
  let myContract: any;
  // 合约部署者（默认拥有DEFAULT_ADMIN_ROLE）
  let deployer: SignerWithAddress;
  // 测试用账户：管理员角色、普通角色、无权限角色
  let manager: SignerWithAddress;
  let normalUser: SignerWithAddress;
  let noRoleUser: SignerWithAddress;

  // 前置钩子：每个用例执行前初始化合约+账户，对齐原示例beforeEach
  beforeEach(async function () {
    // 获取Hardhat本地测试账户，按用途分配
    [deployer, manager, normalUser, noRoleUser] = await ethers.getSigners() as SignerWithAddress[];
    
    // 部署合约：完全对齐原示例的工厂部署写法
    const MyContractFactory = await ethers.getContractFactory("MyAccessControlContract");
    myContract = await MyContractFactory.deploy();
    await myContract.waitForDeployment(); // 等待上链生效

    // 公共权限初始化：部署者给manager授ROLE_MANAGER，再设置ROLE_NORMAL的管理员为ROLE_MANAGER
    await myContract.grantRole(ROLE_MANAGER, manager.address);
    await myContract.setRoleAdmin(); // 调用合约内的角色管理员设置方法
  });

  // 核心用例1：验证部署者默认拥有最高权限DEFAULT_ADMIN_ROLE
  it("should make deployer own DEFAULT_ADMIN_ROLE by default", async function () {
    const hasAdminRole = await myContract.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    expect(hasAdminRole).to.be.true;
  });

  // 核心用例2：验证角色授予/检查功能正常（deployer给manager授ROLE_MANAGER）
  it("should grant ROLE_MANAGER to target address successfully", async function () {
    const hasManagerRole = await myContract.hasRole(ROLE_MANAGER, manager.address);
    expect(hasManagerRole).to.be.true;
  });

  // 核心用例3：验证角色管理员设置生效（ROLE_MANAGER可给他人授ROLE_NORMAL）
  it("should allow ROLE_MANAGER to grant ROLE_NORMAL", async function () {
    // 用manager账户调用合约（原示例签名风格的账户切换）
    await myContract.connect(manager).grantRole(ROLE_NORMAL, normalUser.address);
    const hasNormalRole = await myContract.hasRole(ROLE_NORMAL, normalUser.address);
    expect(hasNormalRole).to.be.true;
  });

  // 边界用例1：无权限账户无法调用受保护函数（noRoleUser调用normalThing）
  it("should reject no-role user to call ROLE_NORMAL protected function", async function () {
    // 断言：调用会被revert（AccessControl 原生的权限校验失败回滚）
    await expect(myContract.connect(noRoleUser).normalThing())
      .to.be.revertedWithCustomError(myContract, "AccessControlUnauthorizedAccount")
      .withArgs(noRoleUser.address, ROLE_NORMAL);
  });

  // 边界用例2：普通角色无法调用管理员角色的受保护函数（normalUser调用specialThing）
  it("should reject ROLE_NORMAL user to call ROLE_MANAGER protected function", async function () {
    // 先给normalUser授普通角色
    await myContract.connect(manager).grantRole(ROLE_NORMAL, normalUser.address);
    // 断言调用失败
    await expect(myContract.connect(normalUser).specialThing())
      .to.be.revertedWithCustomError(myContract, "AccessControlUnauthorizedAccount")
      .withArgs(normalUser.address, ROLE_MANAGER);
  });

  // 边界用例3：非默认管理员无法修改角色管理员配置（manager调用setRoleAdmin）
  it("should reject non-DEFAULT_ADMIN to call setRoleAdmin", async function () {
    await expect(myContract.connect(manager).setRoleAdmin())
      .to.be.revertedWithCustomError(myContract, "AccessControlUnauthorizedAccount")
      .withArgs(manager.address, DEFAULT_ADMIN_ROLE);
  });


  // 边界用例4：角色撤销功能生效（撤销后无法调用受保护函数）
  it("should revoke role and reject protected function call", async function () {
  // 授予角色→验证可调用→撤销角色→验证不可调用
  await myContract.connect(manager).grantRole(ROLE_NORMAL, normalUser.address);
  expect(await myContract.hasRole(ROLE_NORMAL, normalUser.address)).to.be.true;
    
  // 关键修改：用ROLE_MANAGER（manager账户）撤销，而非deployer
  await myContract.connect(manager).revokeRole(ROLE_NORMAL, normalUser.address);
  await expect(myContract.connect(normalUser).normalThing())
      .to.be.revertedWithCustomError(myContract, "AccessControlUnauthorizedAccount")
      .withArgs(normalUser.address, ROLE_NORMAL);
  });
});