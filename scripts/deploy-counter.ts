// Hardhat 和 ethers.js 的「桥梁」，负责注册插件，让两者能协同工作；
import "@nomicfoundation/hardhat-ethers";
import { ethers } from "hardhat";

// HelloWorld 合约
async function contract(){
  console.log("开始部署 Counter 合约...");
  // 获取合约工厂
  const Counter = await ethers.getContractFactory("Counter");
  // 部署合约
  const counter = await Counter.deploy();
//   const helloWorld = await HelloWorld.deploy({
//     gasPrice: ethers.parseUnits("1000", "gwei"), // 1 Gwei = 10^9 wei
//   });
  // 老师用的v6新版方法，替换旧的deployed()
  await counter.waitForDeployment();
  // v6新版获取地址方式
  const contractAddress = await counter.getAddress();
  return contractAddress;
}

async function deploy() {

  const contractAddress = await contract();
  console.log(`Counter 部署完成！`);
  console.log(`合约地址: ${contractAddress}`);
}

// 启动 本地网络  npx hardhat node
deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("部署失败:", error);
    process.exit(1);
  });