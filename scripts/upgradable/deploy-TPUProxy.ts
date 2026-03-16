// Hardhat 和 ethers.js 的桥梁，注册插件让两者协同工作
import "@nomicfoundation/hardhat-ethers";
// 导入hardhat核心
import hre from "hardhat";
// 公共变量：合约名称，后续修改只需改这里
const PROXY_CONTRACT_NAME = "TPUProxy"; // 代理合约名

const LOGIC_ADRESS = ""; // 逻辑合约地址
const INIT_DATA = ""; //逻辑合约初始化

// 部署TPUProxy可升级合约核心方法 【首次部署】
async function deployTPUProxyUpgradeable() {
  console.log(`开始部署 ${PROXY_CONTRACT_NAME} 代理合约【首次部署】...`);



  // 自动获取部署账户（作为TPUProxy初始管理员，唯一拥有升级权限）
  const [deployer] = await hre.ethers.getSigners();
  const initialOwner = deployer.address;
  console.log(`TPUProxy 初始管理员地址（部署账户）: ${initialOwner}`);


  // 部署TPUProxy代理合约（核心：传入实现地址、初始管理员、初始化数据）
  console.log(`开始部署 ${PROXY_CONTRACT_NAME} 代理合约...`);
  const proxyFactory = await hre.ethers.getContractFactory(PROXY_CONTRACT_NAME);
  const proxyContract = await proxyFactory.deploy(
    LOGIC_ADRESS,  // _logic: 实现合约地址
    initialOwner,  // initialOwner: 初始管理员地址
    INIT_DATA       // _data: 实现合约初始化编码数据
  );
  await proxyContract.waitForDeployment();
  const proxyAddress = await proxyContract.getAddress();

  // 5. 验证代理合约核心配置
  console.log(`验证TPUProxy代理合约配置...`);
  const currentLogic = await proxyContract.getImplementation();
  const proxyAdmin = await proxyContract.proxyAdmin();
  console.log(`✅ 代理合约绑定实现地址: ${currentLogic}`);
  console.log(`✅ 代理合约管理员地址: ${proxyAdmin}`);

  return proxyAddress;
}

// 主执行函数
async function deploy() {
  const proxyAddress = await deployTPUProxyUpgradeable();
  console.log(`\n🎉 ${PROXY_CONTRACT_NAME} 可升级代理合约部署完成！`);
  console.log(`✅ 代理合约地址（唯一交互地址）: ${proxyAddress}`);
  console.log(`💡 后续升级请执行专属升级脚本，不要重复执行此部署脚本！`);
  console.log(`💡 所有用户/合约交互请使用上述代理地址，实现合约地址仅内部关联！`);
}

// 部署命令参考：
// 本地节点：npx hardhat run scripts/deploy-TPUProxy.ts --network localhost
// 测试网：npx hardhat run scripts/deploy-TPUProxy.ts --network sepolia
deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${PROXY_CONTRACT_NAME} 可升级合约部署失败:`, error);
    process.exit(1);
  });