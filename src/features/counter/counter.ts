import counterJson from '../../../artifacts/contracts/Counter.sol/Counter.json';
const abi = counterJson.abi; // 修复ABI命名导入警告
// 保留你的原有导入，无需改路径
import { detectWallet, checkAuth, requestAuth, checkAndSwitchChain, initWalletListener } from '../../utils/wallet';
import { createContractInstance, callReadMethod, callWriteMethod } from '../../utils/contract';
import { logInfo, logError } from '../../utils/log';
import '../../assets/styles/counter.css';

export class CounterFeature {
  private contract?: any;
  private readonly targetChainId = `0x${BigInt(process.env.TARGET_CHAIN_ID!).toString(16)}`;
  private readonly contractAddress = process.env.CONTRACT_ADDRESS;
  private readonly counterDom = document.getElementById('counter')!;
  private readonly incrementBtn = document.getElementById('incrementBtn') as HTMLButtonElement;

  constructor() {
    this.checkDom();
  }

  private checkDom() {
    if (!this.counterDom || !this.incrementBtn) {
      throw new Error('Counter页面未找到指定DOM元素，请检查HTML ID');
    }
  }

  public async init() {
    logInfo('【Counter业务】开始初始化Counter DApp');
    try {
      // 第一步：先执行detectWallet，确保钱包工具类上下文完全就绪
      await detectWallet();
      // 第二步：钱包检测成功后，再初始化监听（核心修复点）
      initWalletListener();
      // 配置校验
      if (!this.contractAddress || !this.targetChainId || !abi) {
        throw new Error('Counter初始化失败：合约地址/链ID/ABI未配置，请检查环境变量');
      }
      // 原有钱包/合约逻辑完全保留，无需修改
      await checkAndSwitchChain(this.targetChainId);
      const { isAuth } = await checkAuth();
      if (!isAuth && !await requestAuth()) {
        throw new Error('用户拒绝钱包授权，无法使用Counter DApp');
      }
      const { contract } = await createContractInstance(this.contractAddress, abi);
      if (!contract) throw new Error('合约实例创建失败：createContractInstance返回空');
      this.contract = contract;
      
      await this.getCount();
      this.bindButtonEvent();
      this.listenContractEvent();
      logInfo('【Counter业务】Counter DApp初始化完成，可正常操作');
    } catch (error) {
      logError('【Counter业务】Counter DApp初始化失败', error);
      this.counterDom.innerHTML = `初始化失败：${(error as Error).message}`;
      this.counterDom.className = 'counter error';
    }
  }

  private async getCount() {
    if (!this.contract) return;
    this.counterDom.innerHTML = '正在获取计数器值...';
    const count = await callReadMethod(this.contract, 'getCount');
    this.counterDom.innerHTML = `当前计数器值：${count.toString()}`;
    this.counterDom.className = 'counter normal';
  }

  private bindButtonEvent() {
    this.incrementBtn.onclick = async () => {
      if (!this.contract) return;
      this.incrementBtn.disabled = true;
      this.incrementBtn.innerHTML = '交易处理中...（钱包确认）';
      try {
        await callWriteMethod(this.contract, 'count');
        alert('交易成功！计数器已自增');
        await this.getCount();
      } catch (error) {
        alert(`交易失败：${(error as Error).message}`);
        logError('【Counter业务】自增交易失败', error);
      } finally {
        this.incrementBtn.disabled = false;
        this.incrementBtn.innerHTML = '点击自增（需支付Gas）';
      }
    };
  }

  private listenContractEvent() {
    if (!this.contract) {
      logError('【Counter业务】监听事件失败：合约实例未初始化');
      return;
    }
    this.contract.on(this.contract.filters.CounterInc(), async ({ args }: any) => {
      logInfo('【Counter业务】监听到合约自增事件', args);
      if (args && args[0]) {
        this.counterDom.innerHTML = `当前计数器值：${args[0].toString()}`;
      } else {
        await this.getCount();
      }
    });
  }
}

// 修复：给初始化方法加async/await，保证异步执行顺序
export const initCounter = async () => {
  const counter = new CounterFeature();
  await counter.init();
};