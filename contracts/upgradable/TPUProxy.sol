// 声明代码遵循 MIT 开源许可证，SPDX 标准许可证标识
// SPDX-License-Identifier: MIT
// 透明可升级代理合约，继承 OpenZeppelin 官方透明代理基础合约
pragma solidity ^0.8.28; // 限定 Solidity 编译器版本为 0.8.28 及兼容版本
// 引入 OpenZeppelin 官方透明可升级代理核心合约，提供代理底层逻辑
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

// 自定义透明可升级代理合约，继承 TransparentUpgradeableProxy 实现功能扩展
contract TPUProxy is TransparentUpgradeableProxy {


    /**
     * @dev 构造函数，继承并调用父类 TransparentUpgradeableProxy 构造函数
     * @param _logic 实现合约地址（代理指向的业务逻辑合约）
     * @param initialOwner 代理合约初始管理员地址-区块链账户地址（拥有代理升级、管理权限）
     * @param _data 部署时传递给实现合约的初始化数据（通常是初始化函数的编码数据）
     */
    constructor(address _logic, address initialOwner, bytes memory _data) payable TransparentUpgradeableProxy(_logic, initialOwner, _data) {
        // 无自定义逻辑，仅透传参数调用父类构造函数完成代理初始化
    }

    /**
     * @dev 外部只读方法，查询代理合约的管理员地址
     * @return address 代理管理员地址（拥有 proxyAdmin 权限的账户）
     * 封装父类内部的 _proxyAdmin() 方法，对外提供查询接口
     */
    function proxyAdmin() external view returns(address) {
        return _proxyAdmin();
    }

    /**
     * @dev 外部只读方法，查询代理当前指向的实现合约地址
     * @return address 业务逻辑实现合约的当前地址
     * 封装父类内部的 _implementation() 方法，对外提供查询接口
     */
    function getImplementation() external view returns(address) {
        return _implementation();
    }

 
    receive() external payable {
        revert("TPUProxy: do not send ETH directly"); // 回滚交易并抛出明确错误信息
    }
}