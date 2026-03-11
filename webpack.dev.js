// 引入webpack核心库，用于使用webpack的内置插件（如DefinePlugin）
const webpack = require("webpack");
// 从webpack-merge中解构出merge方法，用于深度合并webpack配置（核心：合并公共配置和开发环境专属配置）
const { merge } = require("webpack-merge");
// 引入path内置模块，做路径规范化处理（工程化新增：适配跨系统路径）
const path = require("path");
// 引入公共配置文件，开发环境配置基于这个公共配置做扩展，避免重复写配置
const baseConfig = require("./webpack.common");
// 合并公共配置和开发环境专属配置，最终导出完整的开发环境webpack配置
// merge会智能合并：对象项直接叠加，数组项（如plugins）会追加，不会覆盖公共配置的内容
module.exports = merge(baseConfig, {
    // 配置运行模式为开发环境（development）
    // webpack会自动开启开发环境特性：不压缩代码、保留调试信息、打包速度更快，关闭生产环境的优化
    mode: "development",
    // 开发环境源码映射（精准映射到原始TS/JS文件，调试时直接定位源码行号，不丢调试能力）
    devtool: "inline-source-map",
    // 开发环境专属插件配置（会追加到公共配置的plugins数组中）
    plugins: [
        // 仅保留热更新插件，删除重复的DefinePlugin（统一移到common中）
        new webpack.HotModuleReplacementPlugin()
    ],
    // 开发服务器（devServer）核心配置：本地开发的核心，启动后会创建一个本地服务器，支持热更新、端口配置等
    // 运行npm run dev后，webpack会启动这个服务器，代码修改后会自动刷新/热更新页面，无需手动打包
    devServer: {
        // historyApiFallback: 开启HTML5历史模式路由的支持
        // 解决单页应用（SPA）路由刷新后404的问题，比如vue/react的路由跳转后刷新页面，服务器会返回index.html
        historyApiFallback: true,
        // 配置本地服务器的端口号，启动后访问 http://localhost:8080 即可打开项目
        port: 8080,
        // hot: 开启模块热替换（Hot Module Replacement，HMR）
        hot: true,
        // 启动开发服务器后，自动打开浏览器（无需手动输入地址，提升开发体验）
        open: {
          app: {
            name: 'Chrome' // 指定启动谷歌浏览器，适配Windows
          }
        },
        // 编译错误/警告在浏览器页面全屏展示（快速发现代码问题，不用切控制台）
        client: {
            overlay: {
                errors: true,
                warnings: false // 警告不弹窗，避免干扰
            }
        },
        // 配置静态资源目录（如图片/字体，webpack可直接访问，无需额外配置）
        static: {
            directory: path.resolve(__dirname, "public")
        },
        // 关闭跨域限制（前端调测试网/本地接口时，避免跨域报错，开发阶段专用）
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    },
    // 优化模块解析速度（指定解析优先级，减少webpack查找文件时间）
    resolve: {
        // 优先解析TS/JS文件，适配项目TS技术栈
        extensions: [".ts", ".js", ".json", ".css"],
        // 工程化可选：配置路径别名（避免多层相对路径../../，后续可在common中统一配置，这里预留）
        // alias: {
        //     "@": path.resolve(__dirname, "src")
        // }
    }
});