import { ethers } from "ethers";

const abi = [
  "function count() public",
  "function getCount() public view returns (uint256)"
]

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";


async function main() {

  const URL = `http://127.0.0.1:8545`;
  const provider = new ethers.JsonRpcProvider(URL);
  const signer = await provider.getSigner(); 
  // 连接到本地的 Hardhat 节点 ，并创建合约实例
  // 这里必须使用 signer 来创建合约实例，因为我们需要发送交易来调用 count 方法，这需要签名权限
  const counter = new ethers.Contract(contractAddress, abi, signer);
  // 获取当前 count 的值 ，并打印出来   
  const before = await counter.getCount();
  console.log("count 初始值:", before.toString());
  // 调用合约的 count 方法，并等待交易上链完成
  const tx = await counter.count();
  // 等待交易上链完成
  console.log("交易已发送，等待确认...");
  await tx.wait();
  console.log("交易上链完成：", tx.hash);
   

}

main().catch(console.error);
