// 引入webpack核心库，用于调用webpack内置的插件（此处用的是DefinePlugin）
const webpack = require("webpack");
// 引入webpack公共配置文件，生产环境配置基于公共配置扩展，避免重复写通用配置
const baseConfig = require("./webpack.common");
// 从webpack-merge库解构出merge方法，实现webpack配置的深度合并（智能合并对象/数组，不直接覆盖）
const { merge } = require("webpack-merge");

// 合并公共配置和生产环境专属配置，最终导出完整的生产环境webpack配置
module.exports = merge(baseConfig, {
    // 设置运行模式为生产环境
    // webpack会自动开启生产环境专属优化：代码压缩、tree-shaking、删除无用代码、作用域提升等，无需手动配置
    mode: "production",

    // 生产环境专属插件配置（会追加到公共配置的plugins数组中，不覆盖）
    plugins: [
        // 实例化webpack内置的DefinePlugin插件：向前端业务代码中注入环境变量
        // 前端代码中可直接通过 process.env.XXX 访问注入的变量
        new webpack.DefinePlugin({
            // 注入合约地址变量，JSON.stringify是必加的：保证变量转为合法的JS字符串类型，避免语法错误
            'process.env.CONTRACT_ADDRESS': JSON.stringify(process.env.CONTRACT_ADDRESS),
            // 注入调试模式变量，用于前端代码中控制调试日志的开关（生产环境一般设为false）
            'process.env.DEBUG': JSON.stringify(process.env.DEBUG),
        }),
    ],
});