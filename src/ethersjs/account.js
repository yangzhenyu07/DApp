const path = require('path');

// 加载环境变量配置，根据当前环境自动选择 .env.dev 或 .env.prod 文件
require('dotenv').config({
  path: path.resolve(__dirname, '../../', '.env.test') // 这里假设你在项目根目录下有 .env.dev 和 .env.prod 文件，根据需要切换

});

// 引入 ethers 库，用来和以太坊区块链交互
const { ethers } = require("ethers");

// 拼接 Alchemy 的 RPC 节点地址，从环境变量中读取你的 API Key
const URL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ETH_API_KEY}`;

// 创建一个 JSON-RPC 连接对象，用来和以太坊节点通信
const provider = new ethers.JsonRpcProvider(URL);

// 要查询余额的以太坊钱包地址
const ADDRESS = "0x976EA74026E726554dB657fA54763abd0C3a0aa9";

// 定义一个异步函数 main，用来执行获取余额的逻辑
async function main() {
  // 调用 provider 的 getBalance 方法，获取地址的 ETH 余额（返回的是 Wei 单位）
  const balance = await provider.getBalance(ADDRESS);

  // 把 Wei 转换成 ETH（1 ETH = 10^18 Wei），并格式化打印
  console.log(
    `\nETH Balance of ${ADDRESS} -> ${ethers.formatUnits(balance, 18)} ETH\n`
  );
}

// 调用 main 函数
main();