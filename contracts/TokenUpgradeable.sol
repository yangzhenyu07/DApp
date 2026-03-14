// SPDX-License-Identifier: MIT
// 开源协议：MIT（可商用、可修改，保留版权声明即可，适合合约上线场景）
pragma solidity ^0.8.28; // 指定Solidity编译器版本，兼容0.8.28及以上同系列版本
// 0.8.x版本自带溢出/下溢安全检查，无需手动编写校验逻辑

// 导入OpenZeppelin可升级版权限控制合约（v5.x+，需显式传入初始所有者地址）
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// 导入可升级合约核心基类，提供initializer修饰符，替代普通构造函数的初始化能力
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title TokenUpgradeable
 * @author yangzhenyu
 * @notice 基于OpenZeppelin v5.x+开发的可升级基础代币合约
 * @dev 实现可升级特性+代币核心功能：初始发行量分配、余额管理、所有者专属铸造
 *      继承Initializable+OwnableUpgradeable，遵循可升级合约开发规范
 * @custom:oz-version OpenZeppelin v5.x+ 适配（__Ownable_init需传入初始所有者地址）
 * @custom:warning 基础测试合约，未实现ERC20标准的转账/授权/烧币等功能，请勿直接部署至主网
 */
contract TokenUpgradeable is Initializable, OwnableUpgradeable {
    // 代币总供应量，记录合约当前发行的代币总量；public修饰自动生成查询方法totalSupply()
    uint256 public totalSupply;
    // 地址-余额映射表，记录区块链上每个地址的代币持有量；public修饰自动生成查询方法balanceOf(address)
    mapping(address => uint256) public balanceOf;

    /**
     * @notice 可升级合约的初始化函数（替代普通合约的constructor）
     * @param initialSupply 代币初始发行量（建议传入带小数位的值，如1000 * 10**18，适配主流代币小数位规范）
     * @dev initializer修饰符：核心修饰符，保证函数仅执行一次，防止合约重复初始化
     *      __Ownable_init(msg.sender)：OpenZeppelin v5.x+ 必传参，将初始化调用者（合约部署者）设为合约初始所有者
     *      可升级合约禁止使用constructor，所有初始化逻辑必须写在带initializer的函数中
     */
    function initialize(uint256 initialSupply) public initializer {
        // 初始化可升级权限合约，显式指定msg.sender为初始所有者（v5.x+版本强制传参）
        __Ownable_init(msg.sender);
        // 将传入的初始发行量赋值给总供应量，完成代币初始发行
        totalSupply = initialSupply;
        // 将所有初始代币分配给合约部署者，符合代币发行的常规业务逻辑
        balanceOf[msg.sender] = initialSupply;
    }

    /**
     * @notice 代币铸造（增发）函数，仅合约所有者可调用
     * @param to 代币增发的接收地址
     * @param amount 增发的代币数量（建议与初始发行量保持相同的小数位单位）
     * @dev onlyOwner修饰符：继承自OwnableUpgradeable，限制仅合约所有者可调用，防止任意地址恶意增发
     *      require校验：禁止向零地址铸造代币，零地址无私钥所有者，代币转入后将永久丢失
     *      铸造逻辑：总供应量累加增发数量，接收地址余额同步累加
     */
    function mint(address to, uint256 amount) public onlyOwner {
        // 安全校验：零地址铸造校验，触发时抛出自定义错误提示
        require(to != address(0), "Token: mint to zero address");
        totalSupply += amount; // 增发代币，更新总供应量
        balanceOf[to] += amount; // 给目标地址增加对应代币余额
    }

    /**
     * @dev 存储间隙（Storage Gap）：可升级合约的必备设计，适配OpenZeppelin规范
     *      预留50个uint256类型的存储槽位，防止父合约（如OwnableUpgradeable）升级时
     *      新增状态变量覆盖子合约的存储变量，导致合约数据错乱
     * @custom:important 必须设为private，且为合约最后一个状态变量，禁止修改/删除
     */
    uint256[50] private __gap;
}