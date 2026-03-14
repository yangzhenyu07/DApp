import "@nomicfoundation/hardhat-toolbox";
// 注册 OpenZeppelin 升级插件（关键）
import "@openzeppelin/hardhat-upgrades";

import type { HardhatUserConfig } from 'hardhat/config';

import "hardhat-gas-reporter";
import path from 'path';
import dotenv from 'dotenv';
const NODE_ENV = process.env.NODE_ENV || 'dev';
dotenv.config({ path: path.resolve(__dirname, `.env.${NODE_ENV}`) });
console.log('=== 环境变量调试 ===', {
  NODE_ENV: process.env.NODE_ENV,
  DEBUG: process.env.DEBUG,
  isDebug: process.env.DEBUG === 'true' && process.env.NODE_ENV === 'dev'
});


// 极简通用配置：仅用Hardhat官方标准属性，无任何自定义/扩展
const config: HardhatUserConfig = {
  // Solidity编译配置：官方基础配置，适配0.8.28
  solidity: {
    version: "0.8.28",
    // 指定Hardhat的TS配置文件路径
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  

  // 网络配置：仅保留官方标准属性，剔除所有非通用项
  networks: {
    hardhat: {
      chainId: 31337 // Hardhat本地链官方默认链ID，无额外自定义
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      blockGasLimit: 16777216, // 提高硬hat节点区块gas上限
      gas: 16777216 // 全局默认gas limit
    }
    // sepolia_eth: {
    //   url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.TEST_ETH_API_KEY}`, // 以太坊的测试链
    //   accounts: process.env.PRIVATE_KEY 
    //             ? [process.env.PRIVATE_KEY] 
    //             : (() => {
    //                 console.warn('⚠️  未配置PRIVATE_KEY，无法连接Sepolia测试网');
    //                 return [];
    //               })()
    // }
  },

  // gasReporter：官方标准属性，剔除showTimeSpent等非通用项
  gasReporter: {
    enabled: true,
    currency: "USD",
    token: "ETH"
  }
};

export default config;