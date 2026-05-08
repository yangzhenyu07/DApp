import { ethers } from "ethers";

const abi = [
  "event CounterInc(uint256 counter)"
];

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";


async function main() {

  const URL = `http://127.0.0.1:8545`;
  const provider = new ethers.JsonRpcProvider(URL);
  // 连接到本地的 Hardhat 节点 ，并创建合约实例
  const counter = new ethers.Contract(contractAddress, abi, provider);
  
  // 获取当前区块高度
  const currentBlock = await provider.getBlockNumber();
  const block = currentBlock - 20;
  console.log("当前区块高度:", currentBlock);
  const fromBlock = currentBlock >= 20 ? currentBlock - 40 : 0;
  console.log("查询区块范围:", fromBlock, "到", block);
  // 查询过去 20 个区块内的 CounterInc 事件(查前 20 块安全防重组)
  const events = await counter.queryFilter(
    "CounterInc",
    fromBlock,
    block
  );
  console.log("找到事件数：", events.length);
  if (events.length > 0) {
    const lastEvent = events[events.length - 1];
    // 打印最后一个事件的 counter 参数值
    console.log(lastEvent);
    console.log("事件返回 count =", lastEvent.args.counter.toString());
  }

  

}

main().catch(console.error);
