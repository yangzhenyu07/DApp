// 声明合约开源协议为未授权使用（UNLICENSED），无开源授权限制
// SPDX-License-Identifier: UNLICENSED
// 指定Solidity编译器版本，兼容0.8.28及以上同主版本的编译器
pragma solidity ^0.8.28;
// 导入OpenZeppelin的UUPS可升级代理核心合约，提供UUPS升级的基础逻辑
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
// 导入OpenZeppelin的可拥有升级版合约，实现合约所有权的管理（初始化、转让等）
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title UupsV1
 * @author yangzhenyu
 * @notice 基于UUPS模式的可升级合约V1版本，实现基础的数值x存储与自增功能
 * @dev 继承Initializable（初始化器）、UUPSUpgradeable（UUPS可升级）、OwnableUpgradeable（可拥有升级版）
 *      升级合约需遵循OpenZeppelin升级规范，避免构造函数使用风险，改用initialize初始化
 */
contract UupsV1 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    // 公共状态变量：存储无符号整数，合约核心业务数值
    uint public x;

    /**
     * @dev 重写UUPSUpgradeable的升级授权函数，控制合约升级的权限
     * @param implement 新的合约实现地址（升级后的逻辑合约地址）
     * @notice 本版本未做权限校验，实际生产环境需增加所有权校验（如require(msg.sender == owner())）
     */
    function _authorizeUpgrade(address implement) internal override {
        // 空实现：无升级权限校验，任意地址可触发升级（仅测试用，生产环境需修改）
    }

    /**
     * @dev 合约初始化函数，替代构造函数完成升级合约的初始化
     * @param _x 初始化入参，设置状态变量x的初始值
     * @notice 被initializer修饰，确保函数仅能被调用一次，避免重复初始化
     */
    function initialize(uint _x) external initializer {
        x = _x;
        __Ownable_init(msg.sender);
    }

    /**
     * @notice 公共可调用函数，实现状态变量x的自增操作
     * @dev 外部可见（external），仅能通过外部交易/调用执行，无权限限制
     */
    function call() external {
        x = x + 1;
    }
}