// Hardhat 和 ethers.js 的「桥梁」，负责注册插件，让两者能协同工作；
import "@nomicfoundation/hardhat-ethers";
import { ethers } from "hardhat";

const CONTRACT_NAME = "Token";

// 部署合约
async function contract(){
  console.log(`开始部署 ${CONTRACT_NAME} 合约...`);
  // 获取合约工厂
  const factory = await ethers.getContractFactory("Token");
  // 关键：传入构造函数所需的初始发行量参数
  const initialSupply = ethers.parseEther("1000000"); // 初始发行量：100万枚（带18位小数
  // 部署合约
  const deploy = await factory.deploy(initialSupply);
  await deploy.waitForDeployment();
  // 获取地址方式
  const contractAddress = await deploy.getAddress();
  return contractAddress;
}

async function deploy() {

  const contractAddress = await contract();
  console.log(`${CONTRACT_NAME} 部署完成！`);
  console.log(`合约地址: ${contractAddress}`);
}

// 启动 本地网络  npx hardhat node
deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("部署失败:", error);
    process.exit(1);
  });