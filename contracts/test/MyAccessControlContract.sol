// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
// 导入OpenZeppelin的AccessControl合约
import "@openzeppelin/contracts/access/AccessControl.sol";

// 自定义合约继承AccessControl，获得所有权限功能
contract MyAccessControlContract is AccessControl {

    // 1. 定义自定义角色：用keccak256生成唯一bytes32标识
    bytes32 public constant ROLE_MANAGER = keccak256("ROLE_MANAGER");
    bytes32 public constant ROLE_NORMAL = keccak256("ROLE_NORMAL");

    // 2. 构造函数：部署时给部署者授予最高管理员权限
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    // 3. 角色管理函数：只有DEFAULT_ADMIN_ROLE能调用
    // 功能：将ROLE_NORMAL的管理员设置为ROLE_MANAGER
    function setRoleAdmin() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setRoleAdmin(ROLE_NORMAL, ROLE_MANAGER);
    }

    // 4. 权限控制函数：只有ROLE_NORMAL能调用
    function normalThing() external onlyRole(ROLE_NORMAL) {
        // 业务逻辑
    }

    // 5. 权限控制函数：只有ROLE_MANAGER能调用
    function specialThing() external onlyRole(ROLE_MANAGER) {
        // 业务逻辑
    }
}