// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./TKNToken.sol";
import "hardhat/console.sol";

contract Staking {
    TKNToken public tknToken;
    uint256 public contractBalance;
    uint256 public totalDepositedAmount; // T
    uint256 public totalStakedAmount; // S
    uint256 public depositedAmount;
    uint256 public stakedReward;
    uint256 public withdrawAmount;
    mapping(address => uint256) public stakeBalance;
    mapping(address => uint256) public currentTotalStakedAmount;

    constructor(TKNToken _tknToken) {
        tknToken = _tknToken;
    }

    function deposit(uint256 _amount) public payable {
        require(_amount > 0, "amount cannot be 0");
        tknToken.transferFrom(msg.sender, address(this), _amount);
        stakeBalance[msg.sender] = _amount;
        currentTotalStakedAmount[msg.sender] = totalStakedAmount;
        totalDepositedAmount = totalDepositedAmount + _amount;
    }

    function distribute(uint256 _reward) public {
        require(totalDepositedAmount != 0, "there is no stakers at this point");
        totalStakedAmount =
            totalStakedAmount +
            (_reward / totalDepositedAmount);
    }

    function withdraw() public {
        depositedAmount = stakeBalance[msg.sender];
        require(depositedAmount > 0, "you have no coins to withdraw");
        stakedReward =
            depositedAmount *
            (totalStakedAmount - currentTotalStakedAmount[msg.sender]);
        withdrawAmount = stakedReward + depositedAmount;

        tknToken.transfer(msg.sender, withdrawAmount);
        totalDepositedAmount = totalDepositedAmount - depositedAmount;
        contractBalance = address(this).balance;
        stakeBalance[msg.sender] = 0;
    }
}
