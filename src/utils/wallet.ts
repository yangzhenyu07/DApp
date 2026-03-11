import { logInfo, logWarn, logError } from './log';
// 全局防抖锁
let isChainOperationPending = false;

export class WalletUtil {
  // 检测钱包是否安装
  static async detectWallet() {
    logInfo('【钱包工具】开始检测以太坊钱包');
    if (!window.ethereum) {
      logError('【钱包工具】未检测到MetaMask等以太坊钱包');
      throw new Error('请安装MetaMask钱包并打开后重试');
    }
    logInfo('【钱包工具】成功检测到以太坊钱包');
    return window.ethereum;
  }

  // 检查用户是否已授权钱包
  static async checkAuth() {
    const eth = await WalletUtil.detectWallet();
    logInfo('【钱包工具】检查用户钱包授权状态');
    const accounts = await eth.request({ method: 'eth_accounts' }) as string[];
    const isAuth = accounts.length > 0;
    if (isAuth) {
      logInfo('【钱包工具】用户已授权，当前钱包地址：', accounts[0]);
    } else {
      logWarn('【钱包工具】用户尚未授权钱包账户');
    }
    return { isAuth, address: accounts[0] || '' };
  }

  // 请求用户钱包授权
  static async requestAuth() {
    const eth = await WalletUtil.detectWallet();
    logInfo('【钱包工具】请求用户钱包账户授权');
    const accounts = await eth.request({ method: 'eth_requestAccounts' }) as string[];
    const isSuccess = accounts.length > 0;
    if (isSuccess) {
      logInfo('【钱包工具】用户授权成功，钱包地址：', accounts[0]);
    } else {
      logWarn('【钱包工具】用户拒绝钱包授权请求');
    }
    return isSuccess;
  }

  // 识别已有RPC链，复用切换，不删链、不重复添加
  static async checkAndSwitchChain(targetChainId: string, targetRpc: string = 'http://127.0.0.1:8545') {
    if (isChainOperationPending) {
      logWarn('【钱包工具】链操作请求已在处理中，请勿重复触发');
      throw new Error('链操作请求已在处理中，请稍候再试');
    }
    isChainOperationPending = true;

    const eth = await WalletUtil.detectWallet();
    const currentChainId = await eth.request({ method: 'eth_chainId' });

    // 1. 当前链已是目标链，直接返回
    if (currentChainId === targetChainId) {
      logInfo('【钱包工具】当前链ID与目标链一致，无需切换');
      isChainOperationPending = false;
      return;
    }

    try {
      // 2. 先尝试直接切换到目标链ID
      logInfo(`【钱包工具】当前链ID：${currentChainId}，目标链ID：${targetChainId}，请求切换`);
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
      logInfo('【钱包工具】直接切换到目标链成功');
    } catch (switchError: any) {
      // 3. 切换失败，分场景处理
      if (switchError.code === 4902) {
        logWarn('【钱包工具】钱包未识别目标链ID，尝试复用已有RPC链');
        
        try {
          // 方案A：兼容高版本MetaMask（有wallet_getAllChains）
          const allChains = await eth.request({ method: 'wallet_getAllChains' }) as Array<{ chainId: string; rpcUrls: string[] }>;
          // 找钱包中指向目标RPC的链（不管链ID是什么）
          const matchedChain = allChains.find(chain => 
            chain.rpcUrls.some(rpc => rpc === targetRpc || rpc === targetRpc.replace('127.0.0.1', 'localhost'))
          );

          if (matchedChain) {
            // 复用已有RPC链，直接切换（哪怕链ID不是0x31337）
            logInfo(`【钱包工具】找到指向${targetRpc}的链（链ID：${matchedChain.chainId}），切换到该链`);
            await eth.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: matchedChain.chainId }],
            });
            logInfo(`【钱包工具】成功切换到已有RPC链（链ID：${matchedChain.chainId}）`);
          } else {
            // 无匹配RPC链，发起添加请求
            logWarn('【钱包工具】无指向目标RPC的链，发起添加请求');
            await eth.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: targetChainId,
                  chainName: 'Hardhat Local',
                  rpcUrls: [targetRpc],
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                  blockExplorerUrls: [],
                },
              ],
            });
            // 添加后再次切换
            await eth.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: targetChainId }],
            });
            logInfo('【钱包工具】链添加并切换成功');
          }
        } catch (highVersionError: any) {
          // 方案B：兼容低版本MetaMask（无wallet_getAllChains）
          if (highVersionError.message.includes('wallet_getAllChains')) {
            logWarn('【钱包工具】钱包版本较低，跳过RPC链检测，直接引导手动切换');
            throw new Error(
              `钱包版本不支持自动识别链，请手动在MetaMask中：
              1. 找到指向${targetRpc}的链（如Localhost 8545）
              2. 切换到该链后刷新页面`
            );
          } else if (highVersionError.code === -32603) {
            // RPC冲突：提示用户手动切换已有链，不删链
            logWarn('【钱包工具】RPC端点冲突，引导手动切换已有链');
            throw new Error(
              `钱包中已存在指向${targetRpc}的链，请：
              1. 点击MetaMask顶部网络名称
              2. 选择指向${targetRpc}的链（如Localhost 8545）
              3. 刷新页面`
            );
          } else if (highVersionError.message.includes('already pending')) {
            throw new Error('链操作请求已发送，请在钱包弹窗中确认后重试');
          } else {
            throw new Error(`链操作失败：${highVersionError.message}`);
          }
        }
      } else {
        // 非4902错误（用户拒绝切换等）
        logError('【钱包工具】链切换失败', switchError);
        throw new Error(`链切换失败：${switchError.message || '请手动切换到指向127.0.0.1:8545的链'}`);
      }
    } finally {
      setTimeout(() => {
        isChainOperationPending = false;
      }, 3000);
    }
  }

  // 初始化钱包事件监听
  static async initWalletListener() {
    if (window.walletListenerInited) return;
    if (!window.ethereum) {
      logError('【钱包工具】未检测到钱包，无法初始化事件监听');
      throw new Error('请安装MetaMask钱包并打开后重试');
    }
    const eth = window.ethereum;
    logInfo('【钱包工具】初始化钱包全局事件监听');
    // 账户切换事件
    eth.on('accountsChanged', (accounts: string[]) => {
      logInfo('【钱包事件】账户已切换，新地址：', accounts[0] || '无');
      if (accounts.length === 0) {
        alert('你已断开钱包授权，请重新刷新页面授权');
        window.location.reload();
      } else {
        alert('钱包账户已切换，页面将重新加载');
        window.location.reload();
      }
    });
    // 链切换事件
    eth.on('chainChanged', (chainId: string) => {
      logInfo('【钱包事件】链已切换，新链ID：', chainId);
      alert('钱包链已切换，页面将重新加载以匹配目标链');
      window.location.reload();
    });
    // 钱包断开事件
    eth.on('disconnect', (error: any) => {
      logError('【钱包事件】钱包连接断开', error);
      alert('钱包连接已断开，请重新打开钱包并刷新页面');
      window.location.reload();
    });
    window.walletListenerInited = true;
  }
}

// 导出便捷调用方法
export const detectWallet = WalletUtil.detectWallet;
export const checkAuth = WalletUtil.checkAuth;
export const requestAuth = WalletUtil.requestAuth;
export const checkAndSwitchChain = WalletUtil.checkAndSwitchChain;
export const initWalletListener = WalletUtil.initWalletListener;