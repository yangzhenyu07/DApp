// Hardhat 和 ethers.js 的桥梁，注册插件让两者协同工作
import "@nomicfoundation/hardhat-ethers";
// 导入hardhat核心
import hre from "hardhat";
import { Signer } from "ethers";

// 定义TPUProxy合约的类型接口（包含所有核心方法，类型严格）
interface TPUProxyContract {
  upgradeTo: (newImplementation: string) => Promise<any>;
  upgradeToAndCall: (newImplementation: string, data: string) => Promise<any>;
  getImplementation: () => Promise<string>;
  proxyAdmin: () => Promise<string>;
  connect: (signer: Signer) => TPUProxyContract;
}

// 公共变量：需手动配置（根据实际部署情况修改 ✅ 必改）
const PROXY_CONTRACT_NAME = "TPUProxy"; // 代理合约名（和部署脚本一致）
const NEW_LOGIC_CONTRACT_NAME = "LogicV2"; // 新的实现合约名（如LogicV2/LogicV3）
const PROXY_ADDRESS = ""; // 【必改】首次部署的TPUProxy代理地址
const INIT_DATA = ""; // 【可选】V2新状态初始化数据，无则留空

// 升级TPUProxy可升级合约核心方法
async function upgradeTPUProxyUpgradeable() {
  console.log(`开始升级 ${PROXY_CONTRACT_NAME} 代理合约...`);
  // 获取管理员账户（必须是TPUProxy的管理员，否则无升级权限）
  const [admin] = await hre.ethers.getSigners();
  const adminAddress = admin.address;
  console.log(`执行升级的管理员地址: ${adminAddress}`);

  // 1. 部署新的实现合约（✅ 补全真实场景：自动部署新逻辑合约，无需手动填地址）
  console.log(`开始部署新实现合约 ${NEW_LOGIC_CONTRACT_NAME}...`);
  const newLogicFactory = await hre.ethers.getContractFactory(NEW_LOGIC_CONTRACT_NAME);
  const newLogicContract = await newLogicFactory.deploy();
  await newLogicContract.waitForDeployment();
  const NEW_LOGIC_ADDRESS = await newLogicContract.getAddress(); // ✅ 修正变量名拼写
  console.log(`✅ 新实现合约 ${NEW_LOGIC_CONTRACT_NAME} 部署完成，地址: ${NEW_LOGIC_ADDRESS}`);

  // 2. 加载已部署的TPUProxy代理合约 + 类型断言
  console.log(`加载已部署的代理合约 ${PROXY_CONTRACT_NAME}，地址: ${PROXY_ADDRESS}...`);
  const proxyFactory = await hre.ethers.getContractFactory(PROXY_CONTRACT_NAME);
  // 类型断言为自定义接口，解决BaseContract无upgrade方法的报错
  const proxyContract = proxyFactory.attach(PROXY_ADDRESS) as unknown as TPUProxyContract;

  // 3. 执行升级操作（分无/有初始化数据）
  console.log(`开始将代理合约指向新实现合约...`);
  if (INIT_DATA) {
    // 有初始化数据：升级同时执行新状态初始化
    await proxyContract.connect(admin).upgradeToAndCall(NEW_LOGIC_ADDRESS, INIT_DATA);
    console.log(`√ 升级并执行新合约初始化完成`);
  } else {
    // 无初始化数据：仅切换实现合约地址
    await proxyContract.connect(admin).upgradeTo(NEW_LOGIC_ADDRESS);
    console.log(`√ 升级完成，仅切换实现合约地址`);
  }

  // 4. 验证升级结果（核心校验：代理绑定的实现地址是否为新地址）
  console.log(`验证 ${PROXY_CONTRACT_NAME} 升级结果...`);
  const currentLogic = await proxyContract.getImplementation();
  const proxyAdmin = await proxyContract.proxyAdmin();
  console.log(`√ 代理合约当前绑定实现地址: ${currentLogic}`);
  console.log(`√ 代理合约管理员地址（未变更）: ${proxyAdmin}`);

  // 校验升级是否成功，不一致则抛出错误
  if (currentLogic !== NEW_LOGIC_ADDRESS) {
    throw new Error(`升级失败：代理绑定的实现地址与新逻辑地址不一致`);
  }
  return { proxyAddress: PROXY_ADDRESS, newLogicAddress: NEW_LOGIC_ADDRESS };
}

// 主执行函数
async function upgrade() {
  // 判空校验（新增：避免手动配置为空导致的部署失败）
  if (!PROXY_ADDRESS) {
    throw new Error("请先配置PROXY_ADDRESS：填写首次部署的TPUProxy代理合约地址");
  }
  if (!NEW_LOGIC_CONTRACT_NAME) {
    throw new Error("请先配置NEW_LOGIC_CONTRACT_NAME：填写新的实现合约名（如LogicV2）");
  }

  const { proxyAddress, newLogicAddress } = await upgradeTPUProxyUpgradeable();
  console.log(`${PROXY_CONTRACT_NAME} 代理合约升级成功！`);
  console.log(`√ 代理合约地址（不变）: ${proxyAddress}`);
  console.log(`√ 新实现合约地址: ${newLogicAddress}`);
  console.log(`√ 所有用户/合约仍使用上述代理地址交互，逻辑已切换为新实现！`);
  console.log(`√ 旧实现合约可保留，无需删除，仅作为历史版本！`);
}

// 升级命令参考：
// 本地节点：npx hardhat run scripts/upgrade-TPUProxy.ts --network localhost
// 测试网：npx hardhat run scripts/upgrade-TPUProxy.ts --network sepolia
upgrade()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${PROXY_CONTRACT_NAME} 代理合约升级失败:`, error);
    process.exit(1);
  });