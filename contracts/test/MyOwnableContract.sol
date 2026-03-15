// 声明代码遵循 MIT 开源许可证
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

// 导入 OpenZeppelin 官方的 Ownable 合约，用于实现合约所有权管理
import "@openzeppelin/contracts/access/Ownable.sol";

// 定义名为 MyOwnableContract 的合约，继承自 Ownable 合约
contract MyOwnableContract is Ownable {

    // 构造函数：部署合约时执行，接收初始所有者地址并初始化 Ownable 父合约
    constructor(address initialOwner) Ownable(initialOwner) {
        // 父合约 Ownable 会将 initialOwner 设置为合约的初始所有者
    }

    // 外部函数：任何人都可以调用，无权限限制
    function normalThing() external {
        // 注释说明：该函数对所有外部地址开放调用权限
    }

    // 外部函数：仅合约所有者可调用，通过 onlyOwner 修饰器实现权限控制
    function specialThing() external onlyOwner {
        // 注释说明：该函数被 onlyOwner 修饰，只有当前合约所有者才能执行
    }
}