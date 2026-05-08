const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../', '.env.test')
});

const { promptForKey } = require(path.resolve(__dirname, 'key.js'));
const { ethers } = require("ethers");

// ====================== 核心配置======================
const RPC_URL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ETH_API_KEY}`;
const provider = new ethers.JsonRpcProvider(RPC_URL);

// ETH 主网 USDT 合约（正确）
const ERC20_ADDRESS = "0xdAC17F958D2ee523a2206206994597c13D831EC7";
const ERC20_ABI = [
  "function name() public view returns (string)",
  "function symbol() public view returns (string)",
  "function decimals() public view returns (uint8)",
  "function balanceOf(address _owner) public view returns (uint256 balance)",
  "function transfer(address _to, uint256 _value) public returns (bool success)",
  "event Transfer(address indexed _from, address indexed _to, uint256 _value)"
];
// 转账的目标地址（接收方）
const TO_ADDRESS = "0xAc87bc317e0BC8699C718fC5f15393B68f7e3D76";

// ====================== 金额参数（修复：USDT 不是 ETH）======================
const amountStr = process.argv[2];
if (!amountStr) {
  console.log("【错误】用法: node erc20_transfer.js 转账金额(USDT)");
  process.exit(1);
}

// ====================== 主函数（安全版）======================
async function main() {
  try {
    // 创建合约实例
    const contract = new ethers.Contract(ERC20_ADDRESS, ERC20_ABI, provider);
    // 获取合约名称
    const name = await contract.name();
    // 获取合约小数位数 
    const decimals = await contract.decimals();
    //  获取代币符号（USDT）
    const symbol = await contract.symbol();

    console.log(`\n[链信息] ${symbol} 小数位: ${decimals}`);

    // 1. 输入私钥并加载钱包
    const privateKey = await promptForKey();
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`[发送地址] ${wallet.address}`);

    // 2. 校验发送者余额
    const balanceWei = await contract.balanceOf(wallet.address);
    // 格式化余额（10^6 Wei = 1 USDT）
    const balance = ethers.formatUnits(balanceWei, decimals);
    console.log(` ${wallet.address} [发送账户余额] ${balance} ${symbol}`);

    // 3. 转换金额（10^6 Wei = 1 USDT）
    const amountWei = ethers.parseUnits(amountStr, decimals);
    if (amountWei > balanceWei) {
      console.log("【错误】余额不足");
      process.exit(1);
    }

    // 4. 转账（带 Gas 配置）
    console.log(`${wallet.address} 开始转账：${amountStr} ${symbol} → ${TO_ADDRESS}`);
    // 获取当前的 Gas 价格和网络信息
    const feeData = await provider.getFeeData();
    // 获取当前 nonce（交易计数器）
    const nonce = await provider.getTransactionCount(wallet.address);
    console.log(`当前 nonce: ${nonce}`);
    // 获取当前 Gas 价格（单位：Wei/gas）
    const gasPrice = await provider.getGasPrice();
    // 获取当前网络信息
    const network = await provider.getNetwork().then(network => {
      console.log(`当前网络: ${network.name} (chainId: ${network.chainId})`);
    } );  
 
  
    console.log(`当前 gasPrice: ${gasPrice}`);
    // 转账交易（ERC20 转账需要调用合约的 transfer 方法，并且需要设置 gasLimit 和 EIP-1559 的 maxFeePerGas 和 maxPriorityFeePerGas）
    // ERC20 transfer 合约调用（EIP-1559 标准交易）
    // gasLimit: 100000 对 USDT 足够安全
    // maxFeePerGas / maxPriorityFeePerGas 从网络自动获取，无需手动改
    // nonce 由 getTransactionCount 自动获取下一个可用值，直接使用即可s
    const tx = await contract.connect(wallet).transfer(TO_ADDRESS, amountWei, {
      gasLimit: 100000,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      nonce: nonce
    });


    console.log("交易发送：", tx.hash);


    
  } catch (err) {
    console.error("\n❌ 失败：", err.message);
    process.exit(1);
  }
}

main();