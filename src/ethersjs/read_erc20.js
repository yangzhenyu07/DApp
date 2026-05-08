
const path = require('path');

// 加载环境变量配置，根据当前环境自动选择 .env.dev 或 .env.prod 文件
require('dotenv').config({
  path: path.resolve(__dirname, '../../', '.env.test')

});

// 引入 ethers 库，用来和以太坊区块链交互
const { ethers } = require("ethers");

// 拼接 Alchemy 的 RPC 节点地址，从环境变量中读取你的 API Key
const URL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ETH_API_KEY}`;
const provider = new ethers.JsonRpcProvider(URL);
const ERC20_ABI = [
  "function name() public view returns (string)",
  "function symbol() public view returns (string)",
  "function decimals() public view returns (uint8)",
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address _owner) public view returns (uint256 balance)",
];


// USDT 合约地址
const ERC20_ADDRESS = "0xdac17f958d2ee523a2206206994597c13d831ec7";
// 创建一个合约实例，传入合约地址、ABI 和 provider
const contract = new ethers.Contract(ERC20_ADDRESS, ERC20_ABI, provider);

async function main() {
    // name、symbol、decimals、totalSupply 都是 ERC20 标准接口定义的方法，可以直接调用
    const name = await contract.name(); // 获取合约名称
    const symbol = await contract.symbol(); // 获取合约符号
    const decimals = await contract.decimals(); // 获取合约小数位数 
    const totalSupply = await contract.totalSupply(); // 获取合约总供应量

    console.log(`\nReading from ${ERC20_ADDRESS}\n`);
    console.log(`Name: ${name}`);
    console.log(`Symbol: ${symbol}`);
    console.log(`Decimals: ${decimals}`);
    console.log(`Total Supply: ${totalSupply}`);
    // balanceOf 方法需要传递用户地址作为参数
    const USER_ADDRESS = "0x4fAC9d83fFAd797072dB8bd72cC544aD5eC45E4F";
    const balance = await contract.balanceOf(USER_ADDRESS);

    console.log(`Balance Returned: ${balance}`);
}

main();