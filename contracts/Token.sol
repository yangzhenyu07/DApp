// SPDX-License-Identifier: UNLICENSED
// 非可升级合约示例
pragma solidity ^0.8.28; // 指定Solidity编译器版本，兼容0.8.28及以上同系列版本（0.8.x自带溢出/下溢安全检查）

// 导入OpenZeppelin官方安全库的Ownable合约，用于实现合约的所有者权限控制
// OpenZeppelin合约经过安全审计，避免手写权限控制的漏洞
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title 基础代币合约（Token）
 * @author yangzhenyu
 * @notice 基于Solidity 0.8.28开发的基础代币雏形，继承Ownable实现权限控制
 * @dev 实现代币核心功能：初始发行量分配、总供应量记录、地址余额管理、所有者专属铸造（增发）
 * @custom:warning 此为基础测试合约，未实现ERC20等标准代币的转账/授权等完整功能，请勿直接上主网
 */
contract Token is Ownable { // 自定义Token合约继承Ownable，继承其所有者管理、onlyOwner权限修饰符等功能

    // 映射表：记录区块链上每个地址持有的代币数量
    // address => 地址类型键，uint256 => 余额数值类型（无负数）；public修饰自动生成同名查询方法balanceOf(address)
    mapping(address => uint256) public balanceOf;

    // 代币总供应量，记录当前合约发行的代币总量；public修饰自动生成查询方法totalSupply()
    uint256 public totalSupply;

    /**
     * @notice 合约构造函数：部署合约时仅执行一次，初始化代币基础信息
     * @param initialSupply 部署者传入的代币初始发行量（需注意代币小数位，如10**18表示1枚代币）
     * @dev 继承Ownable后，需显式传参初始化父合约，将部署者设为合约唯一所有者
     */
    constructor(uint256 initialSupply) Ownable(msg.sender) {
        totalSupply = initialSupply; // 初始化代币总供应量为传入的初始发行量
        balanceOf[msg.sender] = initialSupply; // 将所有初始代币分配给合约部署者（msg.sender为部署合约的钱包地址）
    }

    /**
     * @notice 代币铸造（增发）函数：仅合约所有者可调用，为指定地址增发代币
     * @param to 代币增发的接收地址
     * @param amount 增发的代币数量
     * @dev onlyOwner修饰符：限制仅合约所有者可调用，防止任意地址恶意增发；添加零地址校验提升合约安全性
     * @custom:error Token: mint to zero address 向零地址铸造代币时触发的错误提示
     */
    function mint(address to, uint256 amount) public onlyOwner {
        // 安全校验：禁止向零地址（address(0)）铸造代币，零地址无所有者，代币转入后无法找回
        require(to != address(0), "Token: mint to zero address");
        
        totalSupply += amount; // 增发代币，将数量累加到总供应量中
        balanceOf[to] += amount; // 给接收地址的余额增加对应增发数量
    }
}