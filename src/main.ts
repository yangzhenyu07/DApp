import { initCounter } from './features/counter/counter';
import { logInfo } from './utils/log';
import './assets/styles/global.css';

// 控制台打印，确认代码执行（方便排查）
logInfo('========= main.ts 代码开始执行 =========');
logInfo('==================== Counter DApp 工程化版本启动 ====================');

// 核心：DOM完全加载后再异步初始化，避免window/ethereum未注入
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initCounter();
  } catch (error) {
    console.error('应用整体初始化失败', error);
    alert(`应用初始化失败：${(error as Error).message}`);
  }
});