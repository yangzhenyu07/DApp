// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Box is Ownable{

    
    uint256 private value;
    
    // 构造函数：部署合约时执行，接收初始所有者地址并初始化 Ownable 父合约
    constructor(address initialOwner) Ownable(initialOwner) {
        // 父合约 Ownable 会将 initialOwner 设置为合约的初始所有者
    }
    event ValueChanged(uint256 newValue);

    function setValue(uint256 newValue) public onlyOwner {
        value = newValue;
        emit ValueChanged(newValue);
    }

    function getValue() public view returns (uint256) {
        return value;
    }
}