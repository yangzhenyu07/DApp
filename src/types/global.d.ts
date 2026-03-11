// src/global.d.ts 修复版（仅加2行，其余完全保留你的精细类型）
declare global { // 新增：包裹全局类型扩展，告知TS这是全局声明
  // 扩展Window类型，添加钱包和全局监听标识（你的原有代码，完全保留）
  interface Window {
    ethereum: {
      request: (params: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
    walletListenerInited: boolean; // 钱包事件监听标识，避免重复绑定
  }
}

// 扩展环境变量类型，让process.env有代码提示（你的原有代码，完全保留）
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'dev' | 'prod';
    CONTRACT_ADDRESS: string;
    DEBUG: 'true' | 'false';
    TARGET_CHAIN_ID: string; // 目标链ID（Hardhat/测试网/主网）
  }
}

export {}; // 新增：告知TS这是模块声明文件，全局类型才会生效