// Hardhat 和 ethers.js 的「桥梁」，负责注册插件，让两者能协同工作；
import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";

const CONTRACT_NAME = "UupsV2";
const PROXY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
// 部署合约
async function contract(){
  console.log(`开始升级 ${CONTRACT_NAME} 代理合约...`);
  // 获取合约工厂
  const factory = await hre.ethers.getContractFactory("UupsV2");
  const proxy = await hre.upgrades.upgradeProxy(PROXY_ADDRESS,factory);

  // 获取代理合约地址方式
  const contractAddress = await proxy.getAddress();
  return { contractInstance: proxy, contractAddress }; // 同时返回实例和地址，方便后续调用方法

}

async function deploy() {

  const { contractInstance, contractAddress }  = await contract();
  console.log(`${CONTRACT_NAME} 部署完成！`);
  console.log(`代理合约地址: ${contractAddress}`);
  console.log(`验证: 调用代理合约-${CONTRACT_NAME} 的 call 方法`);
  try {
    await contractInstance.call();
    console.log(`验证: x:`, await contractInstance.x());
   
  } catch (error) {
    console.error(`代理合约-${CONTRACT_NAME}的 方法调用失败:`, error);
    process.exit(1);
  }
}

// 启动 本地网络  npx hardhat node
deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("部署失败:", error);
    process.exit(1);
  });