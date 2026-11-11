// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract HelloRome {
    string public message = "Hello, Rome!";

    function setMessage(string memory newMessage) public {
        message = newMessage;
    }
}