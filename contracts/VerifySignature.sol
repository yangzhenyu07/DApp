// SPDX-License-Identifier: MIT
// 开源协议：MIT（可商用、可修改，保留版权声明即可，适合合约上线场景）
pragma solidity ^0.8.28; // 指定Solidity编译器版本，兼容0.8.28及以上同系列版本
// 0.8.x版本自带溢出/下溢安全检查，无需手动编写校验逻辑


// 导入OpenZeppelin的ECDSA算法库，用于签名解析和地址恢复
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
// 导入OpenZeppelin的消息哈希工具库，用于生成以太坊标准签名哈希
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

// 签名验证合约，核心功能：根据原始消息和签名，恢复并返回签名者的以太坊地址
contract VerifySignature {
    // 为bytes32类型挂载ECDSA库的所有方法，可直接通过bytes32变量调用（如recover）
    using ECDSA for bytes32;
    // 为bytes32类型挂载MessageHashUtils库的所有方法，可直接通过bytes32变量调用（如toEthSignedMessageHash）
    using MessageHashUtils for bytes32;

    /**
     * @dev 核心验签方法：根据原始字符串消息和签名，恢复签名者地址
     * @param str 原始待签名的字符串消息（与签名时的原始消息完全一致）
     * @param signature 签名结果（由前端/钱包通过私钥对消息签名生成，65字节：r(32)+s(32)+v(1)）
     * @return 恢复出的签名者以太坊地址，若签名无效会返回错误
     */
    function recover(string memory str, bytes memory signature) external pure returns(address) {
        // 1. 原始消息哈希：将字符串转成bytes字节数组，再做Keccak256哈希
        // 目的：将任意长度的字符串转为固定32字节的哈希值，适配区块链签名算法要求
        bytes32 hash = keccak256(bytes(str));
        
        // 2. 还原签名者地址：两步核心操作（链式调用）
        // hash.toEthSignedMessageHash()：给原始哈希拼接以太坊标准签名前缀(\x19Ethereum Signed Message:\n32)并二次Keccak256哈希
        // → 对齐钱包/前端signMessage的签名规则，防止重放攻击
        // .recover(signature)：从签名中解析r/s/v，通过ECDSA算法根据哈希值恢复签名者公钥，再推导为以太坊地址
        return hash.toEthSignedMessageHash().recover(signature);
    }
}