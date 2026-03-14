// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract HelloWorld {
    uint a;
    uint b;

    function hello() public pure returns (string memory) {
        return "Hello World";
    }

    function test1() public {
        a++;
    }

    function test2() public {
        a++;
        b++;
    }
}