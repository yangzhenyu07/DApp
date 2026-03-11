import "@nomicfoundation/hardhat-ethers";
import { ethers } from "hardhat";
import { expect } from "chai";

describe("HelloWorld", function () {
    it("should get the hello world", async() =>{
        // 步骤如下:
        // 1. setup 安装合约
        // 2. import contract 引入合约
        // 3. test action

        //安装合约
        const HW = await ethers.getContractFactory("HelloWorld");
        // 部署合约,拿到合约实例
        const hw = await HW.deploy();
        await hw.waitForDeployment();//等待部署完成
        // 测试合约的方法调用结果,并输出
        expect(await hw.hello()).to.equal("Hello, World");
    });
});