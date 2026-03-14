// Hardhat 和 ethers.js 的「桥梁」，负责注册插件，让两者能协同工作；
import "@nomicfoundation/hardhat-ethers";
import { ethers } from "hardhat";

// HelloWorld 合约
async function contract(){
  console.log("开始部署 HelloWorld 合约...");
  // 获取合约工厂
  const HelloWorld = await ethers.getContractFactory("HelloWorld");
  // 部署合约
  // const helloWorld = await HelloWorld.deploy();
  const helloWorld = await HelloWorld.deploy({
    gasPrice: ethers.parseUnits("1000", "gwei"), // 1 Gwei = 10^9 wei
  });
  await helloWorld.waitForDeployment();
  // v6新版获取地址方式
  const contractAddress = await helloWorld.getAddress();
  return contractAddress;
}

async function deploy() {

  const contractAddress = await contract();
  console.log(`HelloWorld 部署完成！`);
  console.log(`合约地址: ${contractAddress}`);
}

// 启动 本地网络  npx hardhat node
// 执行 npx hardhat run ./scripts/deploy-helloWorld.ts --network localhost
deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("部署失败:", error);
    process.exit(1);
  });