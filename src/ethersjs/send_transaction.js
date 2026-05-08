// 引入 ethers 库，用来和以太坊交互
const { ethers } = require("ethers");
const path = require('path');

// 引入一个自定义工具函数：运行时提示用户输入私钥（避免硬编码）
const { promptForKey } = require(path.resolve(__dirname, 'key.js'));
// 本地测试节点地址
const URL = "http://127.0.0.1:8545/";

// 创建 RPC 连接对象
const provider = new ethers.JsonRpcProvider(URL);

// 转账的目标地址（接收方）
const RECEIVER = "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955";

const ETH = process.argv[2];

// 检查有没有传转账金额
if (!ETH) {
  console.log("【error】使用方法: node send_transaction.js 转账金额（单位：ETH）\n");
  process.exit(1);
}


async function main() {
  // 运行时提示用户输入私钥
  const privateKey = await promptForKey();
  // 用私钥和 provider 创建一个钱包对象，用来签名交易
  const wallet = new ethers.Wallet(privateKey, provider);
  // 发送交易，指定接收地址和转账金额（这里转账 160 ETH）
  const transactionResponse = await wallet.sendTransaction({
    to: RECEIVER,
    value: ethers.parseEther(ETH) // 转账金额，单位是 ETH
  });
  // 等待交易被矿工打包并确认
  const receipt = await transactionResponse.wait();
  // 打印交易响应和收据，查看交易详情
  console.log(transactionResponse);
  // 打印交易收据，查看交易状态、区块号等信息
  console.log(receipt);

  // 发送交易并等待确认后，打印交易哈希
  console.log("Transaction successful with hash:", transactionResponse.hash);

}

// 调用 main 函数
main();