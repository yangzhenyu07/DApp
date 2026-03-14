// Hardhat 和 ethers.js 的桥梁，注册插件让两者协同工作
import "@nomicfoundation/hardhat-ethers";
// 导入hardhat核心
import hre from "hardhat";

// 公共变量：合约名称，后续修改只需改这里
const CONTRACT_NAME = "TokenUpgradeable";

// 部署可升级合约核心方法 【首次部署】
async function deployUpgradeableContract() {
  console.log(`开始部署 ${CONTRACT_NAME} 可升级合约【首次部署】...`);
  const factory = await hre.ethers.getContractFactory(CONTRACT_NAME);
  // @ts-ignore
  // 手动指定 gas limit，解决gas cap超限问题
  const proxyContract = await hre.upgrades.deployProxy(
    factory, 
    [1000], 
    { 
      initializer: 'initialize'
    }
  );

  await proxyContract.waitForDeployment();
  const proxyAddress = await proxyContract.getAddress();
  return proxyAddress;
}

// 主执行函数
async function deploy() {
  const contractAddress = await deployUpgradeableContract();
  console.log(`${CONTRACT_NAME} 可升级合约部署完成！`);
  console.log(`✅ 代理合约地址（唯一交互地址）: ${contractAddress}`);
  console.log(`💡 后续升级请执行 upgrade-TokenUpgradeable.ts 脚本，不要重复执行此部署脚本！`);
}

// 启动本地节点：npx hardhat node
// 部署命令：npx hardhat run scripts/deploy-TokenUpgradeable.ts --network localhost
deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${CONTRACT_NAME} 可升级合约部署失败:`, error);
    process.exit(1);
  });