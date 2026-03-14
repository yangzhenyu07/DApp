// SPDX-License-Identifier: MIT
// 指定合约使用的开源协议为 MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/math/Math.sol";
// 导入 OpenZeppelin 库中的 Math 工具合约，提供安全的数学运算函数

contract MathUtils {
    // 定义一个名为 MathUtils 的合约

    using Math for uint256;
    // 将 Math 库中的函数挂载到 uint256 类型上，使 uint256 变量可以直接调用 Math 库的方法

    /**
     * @dev 测试 Math 库的静态调用方式 tryAdd
     * @param a 第一个无符号整数
     * @param b 第二个无符号整数
     * 调用方式：Math.tryAdd(a, b)
     */
    function testAdd(uint a, uint b) external pure {
        // 外部纯函数（不读取/修改合约状态）
        Math.tryAdd(a, b);
    }

    /**
     * @dev 测试 Math 库的库函数调用方式 tryAdd
     * @param a 第一个无符号整数（作为调用主体）
     * @param b 第二个无符号整数（作为参数）
     * 调用方式：a.tryAdd(b)，得益于 using Math for uint256
     */
    function testAdd2(uint a, uint b) external pure {
        // 外部纯函数（不读取/修改合约状态）
        a.tryAdd(b);
    }
}