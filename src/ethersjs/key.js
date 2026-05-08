// 加载 prompt 模块，用于在命令行中获取用户输入
var prompt = require('prompt');

// 定义输入模式，要求用户输入一个私钥，并且隐藏输入内容
const schema = {
  properties: {
    privateKey: {
      message: 'Enter private Key',
      required: true,
      hidden: true
    }
  }
};


// 定义一个异步函数 promptForKey，用于获取用户输入的私钥
async function promptForKey() {
  return new Promise((resolve, reject) => {
    prompt.start();
    const result = prompt.get(schema, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.privateKey);
      }
    });
    return result;
  });
}

module.exports = {
  promptForKey
};
