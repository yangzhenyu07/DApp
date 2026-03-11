import "@nomicfoundation/hardhat-toolbox";
import type { HardhatUserConfig } from 'hardhat/config';

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
      chainId: 31337
    },
    sepolia: {
      url: process.env.ALCHEMY_API_KEY ? `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` : "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },

  // gasReporter：官方标准属性，剔除showTimeSpent等非通用项
  gasReporter: {
    enabled: true,
    currency: "USD",
    token: "ETH"
  }
};

export default config;