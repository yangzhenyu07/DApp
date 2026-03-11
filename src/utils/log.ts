// 根据环境变量判断是否开启日志（生产环境关闭）
// process.env.NODE_ENV值来源: Webpack 会根据配置的mode: 'development'/'production'，
// 强制将process.env.NODE_ENV注入为对应值，覆盖你通过cross-env设置的自定义值
const isDebug = process.env.DEBUG === 'true' && process.env.NODE_ENV === 'development';

// 通用日志方法
export const logInfo = (...args: any[]) => {
//   console.log(process.env.DEBUG);
//   console.log(process.env.NODE_ENV);
//   console.log(isDebug);
  if (isDebug) {
    console.log(`[${new Date().toLocaleString()}] [INFO]`, ...args);
  }
};

export const logWarn = (...args: any[]) => {
  if (isDebug) {
    console.warn(`[${new Date().toLocaleString()}] [WARN]`, ...args);
  }
};

export const logError = (...args: any[]) => {
  if (isDebug) {
    console.error(`[${new Date().toLocaleString()}] [ERROR]`, ...args);
  } else {
    // 生产环境错误可上报到监控平台（如Sentry）
    // Sentry.captureException(args[0]);
  }
};