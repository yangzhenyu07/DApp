// 声明代码遵循 MIT 开源许可证
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
contract BoxV1 is Initializable{

    uint public x;

    function initialize(uint _val) external initializer{
        x = _val;
    }


    function call() external {
        x=x+1;
    }

    // 逻辑合约的初始化数据:供代理合约使用
    function showInvoke() external pure returns (bytes memory){
      
        return abi.encodeWithSelector(this.initialize.selector, 1);
    }
}