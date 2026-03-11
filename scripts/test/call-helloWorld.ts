// 复用部署脚本的依赖，保证版本一致
import "@nomicfoundation/hardhat-ethers";
import { ethers } from "hardhat";

// 配置：直接写死你本地部署的合约地址（避免每次修改）
const HELLO_WORLD_CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;



async function main() {
  // 非空判断
  if (!HELLO_WORLD_CONTRACT_ADDRESS) {
    throw new Error("环境变量 CONTRACT_ADDRESS 未定义，请检查 .env 文件");
  }

  console.log("===== 开始调用本地HelloWorld合约方法 =====");
  console.log("目标合约地址:", HELLO_WORLD_CONTRACT_ADDRESS);
  console.log("调用账户（本地节点默认测试账户）:", (await ethers.getSigners())[0].address); // 就是你的0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266

  // 1. 获取合约工厂 + 挂载已部署地址，生成可调用实例（通用步骤）
  const HelloWorld = await ethers.getContractFactory("HelloWorld");
  const helloWorld = HelloWorld.attach(HELLO_WORLD_CONTRACT_ADDRESS); // 挂载地址，无需重新部署
  console.log("合约实例创建成功，开始调用方法...\n");

  // 2. 测试【只读方法】（view/pure，无gas，无需上链确认）
  console.log("----- 测试只读方法 -----");
  try {
    // 替换为你HelloWorld.sol中的实际只读方法名（示例：greet()）
    const helloResult = await helloWorld.hello();
    console.log(`hello() 调用结果: ${helloResult}`);
  } catch (error) {
    console.error("只读方法调用失败:", error);
  }

//   // 3. 测试【写方法】（修改合约状态，消耗gas，需要上链确认）
//   console.log("\n----- 测试写方法 -----");
//   try {
//     // 替换为你HelloWorld.sol中的实际写方法名+参数（示例：setGreet("新内容")）
//     const tx = await helloWorld.setGreet("Hello, Local Blockchain!");
//     console.log("交易发送成功，等待上链确认...");
//     console.log("交易哈希:", tx.hash);
//     await tx.wait(); // 等待区块确认（本地节点自动挖矿，瞬间完成）
//     console.log("交易上链成功！");

//     // 验证写方法执行结果：再次调用只读方法
//     const newGreetResult = await helloWorld.greet();
//     console.log(`写方法执行后，greet() 最新结果: ${newGreetResult}`);
//   } catch (error) {
//     console.error("写方法调用失败:", error);
//   }

  console.log("\n===== HelloWorld合约方法调用测试完成 =====");
}

// 执行脚本（和部署脚本一致的执行方式）
// npx hardhat run ./scripts/test/call-helloWorld.ts --network localhost
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("合约调用测试异常:", error);
    process.exit(1);
  });