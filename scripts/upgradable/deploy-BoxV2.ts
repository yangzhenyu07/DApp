// Hardhat 和 ethers.js 的「桥梁」，负责注册插件，让两者能协同工作；
import "@nomicfoundation/hardhat-ethers";
import { ethers } from "hardhat";

const CONTRACT_NAME = "BoxV2";

// 部署合约
async function contract(){
  console.log(`开始部署 ${CONTRACT_NAME} 合约...`);
  // 获取合约工厂
  const factory = await ethers.getContractFactory("BoxV2");
  // 关键：传入构造函数所需的初始发行量参数
  const initialSupply = ethers.parseEther("1000000"); // 初始发行量：100万枚（带18位小数
  // 部署合约
  const deploy = await factory.deploy(initialSupply);
  await deploy.waitForDeployment();
  // 获取地址方式
  const contractAddress = await deploy.getAddress();
  return { contractInstance: deploy, contractAddress }; // 同时返回实例和地址，方便后续调用方法

}

async function deploy() {

  const { contractInstance, contractAddress }  = await contract();
  console.log(`${CONTRACT_NAME} 部署完成！`);
  console.log(`合约地址: ${contractAddress}`);
  // 部署完成后，调用showInvoke方法
  console.log(`开始调用 ${CONTRACT_NAME} 的 showInvoke 方法,供代理合约初始化使用:`);
  try {
    // 调用外部pure方法，无需发送交易，直接call即可
    const showInvokeResult = await contractInstance.showInvoke();
    console.log(`showInvoke 方法调用成功！返回结果(bytes):`, showInvokeResult);
    // 可选：格式化打印，方便查看selector和参数
    console.log(`返回结果(十六进制):`, showInvokeResult.toString());
  } catch (error) {
    console.error(`showInvoke 方法调用失败:`, error);
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