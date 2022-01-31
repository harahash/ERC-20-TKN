// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./TKNToken.sol";
import "hardhat/console.sol";

/// @title Staking contract
/// @author Kharakhash A.
/// @notice Contract caller can stake, unstake TKN tokens
contract Staking {
    TKNToken public tknToken;
    uint256 public contractBalance;
    uint256 public totalDepositedAmount;
    uint256 public totalStakedAmount;
    uint256 public depositedAmount;
    uint256 public stakedReward;
    uint256 public withdrawAmount;
    mapping(address => uint256) public stakeBalance;
    mapping(address => uint256) public currentTotalStakedAmount;

    constructor(TKNToken _tknToken) {
        tknToken = _tknToken;
    }

    /// @notice Take entered amount of tokens to stake
    /// @dev Saves the amount of tokens and 'time' they were pushed in
    /// @param _amount Amount of inserted tokens for staking
    function deposit(uint256 _amount) public payable {
        require(_amount > 0, "amount cannot be 0");
        tknToken.transferFrom(msg.sender, address(this), _amount);
        stakeBalance[msg.sender] = _amount;
        currentTotalStakedAmount[msg.sender] = totalStakedAmount;
        totalDepositedAmount = totalDepositedAmount + _amount;
    }

    /// @notice Distribute reward to the stakers
    /// @param _reward Amount of tokens that will be distributed proportionally between all stakers
    function distribute(uint256 _reward) public {
        require(totalDepositedAmount != 0, "there is no stakers at this point");
        totalStakedAmount =
            totalStakedAmount +
            (_reward / totalDepositedAmount);
    }

    /// @notice Process of unstaking all tokens
    /// @dev Cheking if the address has staked tokens
    function withdrawAll() public {
        depositedAmount = stakeBalance[msg.sender];
        require(depositedAmount > 0, "you have no tokens to withdraw");

        rewardAndSend(depositedAmount, msg.sender);
    }

    /// @notice Process of unstaking certain amount of tokens
    /// @dev Checking if the address has staked tokens and whether wants to unstake more than available
    function partialWithdrawal(uint256 _amount) public {
        depositedAmount = stakeBalance[msg.sender];
        require(depositedAmount > 0, "you have no tokens to withdraw");
        require(
            _amount <= depositedAmount,
            "you cant unstake more than you staked"
        );

        rewardAndSend(_amount, msg.sender);
    }

    /// @notice Calculating reward and send it to account
    /// @param _amount Amount of tokens that was unstaked
    /// @param _recepient The account to send tokens to
    function rewardAndSend(uint256 _amount, address _recepient) private {
        stakedReward =
            _amount *
            (totalStakedAmount - currentTotalStakedAmount[_recepient]);
        withdrawAmount = stakedReward + _amount;

        tknToken.transfer(_recepient, withdrawAmount);
        updateBalance(_amount, _recepient);
    }

    /// @notice Calculating reward and send it to account
    /// @param _amount Amount of tokens that need to subtracted from total amount
    /// @param _owner The account from which the tokens will be taken away
    function updateBalance(uint256 _amount, address _owner) private {
        totalDepositedAmount = totalDepositedAmount - _amount;
        stakeBalance[_owner] = stakeBalance[_owner] - _amount;
    }
}
