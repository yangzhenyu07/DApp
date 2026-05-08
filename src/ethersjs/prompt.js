const path = require('path');

// 加载环境变量配置，根据当前环境自动选择 .env.dev 或 .env.prod 文件
require('dotenv').config({
  path: path.resolve(__dirname, '../../', '.env.dev') // 这里假设你在项目根目录下有 .env.dev 和 .env.prod 文件，根据需要切换

});
// 加载 prompt 模块，用于在命令行中获取用户输入
var prompt = require('prompt');


function log(msg) {
  const time = new Date().toLocaleString();
  console.log(`[${time}] ${msg}`);
}

var schema = {
  properties: {
    name: {
      pattern: /^[a-zA-Z\s\-]+$/, // 匹配字母、空格或破折号
      message: 'Name must be only letters, spaces, or dashes', // 输入必须是字母、空格或破折号
      required: true // 必填项
    },
    password: {
      hidden: true // 隐藏密码输入
    }
  }
};

// 启动提示符
prompt.start();
// schema 定义了输入的属性，包括正则表达式、消息和是否必填等
prompt.get(schema, function (err, result) {
  // 处理输入结果
  log('Command-line input received:');
  log('  name: ' + result.name);
  log('  password: ' + result.password);
  log('  获取环境变量 TARGET_CHAIN_ID: ' + process.env.TARGET_CHAIN_ID);

});