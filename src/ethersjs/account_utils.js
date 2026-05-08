const { ethers } = require("ethers");

// 本地测试节点地址
const URL = "http://127.0.0.1:8545/";
const provider = new ethers.JsonRpcProvider(URL);

// 要查询余额的以太坊钱包地址
const ADDRESS = process.argv[2];

// 检查有没有传地址
if (!ADDRESS) {
  console.log("【error】使用方法: node account_utils.js 钱包地址\n");
  process.exit(1);
}

async function main() {
  try {
    // 调用 provider 的 getBalance 方法，获取地址的 ETH 余额（返回的是 Wei 单位）
    const balance = await provider.getBalance(ADDRESS);
    // 把 Wei 转换成 ETH（1 ETH = 10^18 Wei），并格式化打印
    console.log(`\n ETH Balance: ${ethers.formatUnits(balance, 18)} ETH\n`);
  } catch (err) {
    // 打印错误信息
    console.log("\n 【error】查询失败：", err.message);
  }
}
// node .\account-test.js 0x976EA74026E726554dB657fA54763abd0C3a0aa9
main();