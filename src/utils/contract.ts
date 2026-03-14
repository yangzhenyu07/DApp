import { ethers, Contract } from 'ethers';
import { logInfo, logError } from './log';
import { detectWallet } from './wallet';

// 合约核心工具类
export class ContractUtil {
  // 创建合约实例（通用方法，所有合约可复用）
  static async createContractInstance(contractAddress: string, abi: any) {
    logInfo('【合约工具】开始创建合约实例', { contractAddress });
    const eth = await detectWallet();
    if (!eth) {
      logError('【合约工具】钱包检测失败，未找到ethereum提供者');
      throw new Error('钱包检测失败，请安装并连接MetaMask');
    }
    // 创建ethers提供者和签名者
    const provider = new ethers.BrowserProvider(eth);
    const signer = await provider.getSigner();
    // 创建合约实例
    const contract = new Contract(contractAddress, abi, signer);
    logInfo('【合约工具】合约实例创建成功');
    return { contract, provider, signer };
  }
 

  // 调用合约只读方法（无Gas，无需上链）
  static async callReadMethod(contract: Contract, methodName: string, ...args: any[]) {
    logInfo(`【合约工具】调用只读方法：${methodName}，参数：`, args);
    try {
      const result = await contract[methodName](...args);
      logInfo(`【合约工具】方法${methodName}调用成功，结果：`, result);
      return result;
    } catch (error) {
      logError(`【合约工具】方法${methodName}调用失败`, error);
      throw new Error(`合约方法${methodName}调用失败：${(error as Error).message}`);
    }
  }

  // 调用合约写方法（有Gas，需要上链并等待确认）
  static async callWriteMethod(contract: Contract, methodName: string, ...args: any[]) {
    logInfo(`【合约工具】调用写方法：${methodName}，参数：`, args);
    try {
      // 发起交易 transation提交
      const tx = await contract[methodName](...args);
      logInfo(`【合约工具】交易已发起，交易哈希：`, tx.hash);
      // 等待交易上链确认（默认1个区块确认）
      const receipt = await tx.wait(); // 等等transation 完成
      if (receipt.status === 1) {
        logInfo(`【合约工具】交易上链成功，区块号：`, receipt.blockNumber);
        return { tx, receipt, success: true };
      } else {
        logError(`【合约工具】交易上链失败`, receipt);
        throw new Error('交易上链失败，可能是Gas不足或链上错误');
      }
    } catch (error) {
      logError(`【合约工具】方法${methodName}交易失败`, error);
      throw new Error(`合约方法${methodName}交易失败：${(error as Error).message}`);
    }
  }
}

// 导出便捷调用方法
export const createContractInstance = ContractUtil.createContractInstance;
export const callReadMethod = ContractUtil.callReadMethod;
export const callWriteMethod = ContractUtil.callWriteMethod;