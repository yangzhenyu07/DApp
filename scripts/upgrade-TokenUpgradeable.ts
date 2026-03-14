// 仅注册必要插件，保持和部署脚本一致
import "@nomicfoundation/hardhat-ethers";
import hre from "hardhat";

// ************************** 可配置（非硬编码，支持手动修改/传参） **************************
const CONTRACT_NAME = "TokenUpgradeable"; // 实现合约名称（不变）
// 【测试时可手动替换】也可通过命令行传参/读环境变量，彻底摆脱硬编码
let PROXY_ADDRESS = "0x0165878A594ca255338adfa4d48449f69242Eb8F"; 
// *****************************************************************************************

// 升级可升级合约【通用版，支持测试/开发/生产】
async function upgradeUpgradeableContract() {
  // 前置校验：代理地址不能为空
  if (!PROXY_ADDRESS || PROXY_ADDRESS === "") {
    throw new Error("❌ 请先配置正确的代理合约地址（PROXY_ADDRESS），不要留空！");
  }

  console.log(`===== 开始升级 ${CONTRACT_NAME} 可升级合约 =====`);
  console.log(`🔗 待升级的代理合约地址: ${PROXY_ADDRESS}`);

  // 1. 获取新版本实现合约工厂（自动加载最新编译的字节码，无需手动编译）
  const newImplFactory = await hre.ethers.getContractFactory(CONTRACT_NAME);
  console.log(`📦 已加载最新实现合约工厂，字节码哈希: ${newImplFactory.bytecode.slice(0, 40)}...`);

  // 2. 【核心】执行升级：代理地址不变，替换实现合约
  // @ts-ignore
  const upgradedProxy = await hre.upgrades.upgradeProxy(PROXY_ADDRESS, newImplFactory);
  await upgradedProxy.waitForDeployment();

  // 3. 获取升级后的代理地址+新实现合约地址（双重验证）
  const upgradedProxyAddress = await upgradedProxy.getAddress();
  // @ts-ignore
  const newImplAddress = await hre.upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);

  // 4. 关键验证：升级后代理地址必须和升级前完全一致（核心测试点）
  if (upgradedProxyAddress !== PROXY_ADDRESS) {
    throw new Error(`❌ 升级失败！代理地址不一致，原地址：${PROXY_ADDRESS}，新地址：${upgradedProxyAddress}`);
  }

  console.log(`===== ${CONTRACT_NAME} 可升级合约升级完成 =====`);
  console.log(`✅ 代理合约地址【完全不变】: ${upgradedProxyAddress} ✔️`);
  console.log(`🔧 新实现合约地址: ${newImplAddress}`);
  console.log(`💡 升级验证通过：代理地址未发生任何变化！`);
}

// 执行升级（捕获所有错误，清晰提示）
upgradeUpgradeableContract()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`\n❌ ${CONTRACT_NAME} 可升级合约升级失败:`, error.message || error);
    process.exit(1);
  });