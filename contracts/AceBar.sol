// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// AceBar is the coolest bar in town. You come in with some Ace, and leave with more! The longer you stay, the more Ace you get.
//
// This contract handles swapping to and from xAce, AceSwap's staking token.
contract AceBar is ERC20("AceBar", "xACE"){
    using SafeMath for uint256;
    IERC20 public ace;

    // Define the Ace token contract
    constructor(IERC20 _ace) public {
        ace = _ace;
    }

    // Enter the bar. Pay some ACEs. Earn some shares.
    // Locks Ace and mints xAce
    function enter(uint256 _amount) public {
        // Gets the amount of Ace locked in the contract
        uint256 totalAce = ace.balanceOf(address(this));
        // Gets the amount of xAce in existence
        uint256 totalShares = totalSupply();
        // If no xAce exists, mint it 1:1 to the amount put in
        if (totalShares == 0 || totalAce == 0) {
            _mint(msg.sender, _amount);
        } 
        // Calculate and mint the amount of xAce the Ace is worth. The ratio will change overtime, as xAce is burned/minted and Ace deposited + gained from fees / withdrawn.
        else {
            uint256 what = _amount.mul(totalShares).div(totalAce);
            _mint(msg.sender, what);
        }
        // Lock the Ace in the contract
        ace.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the bar. Claim back your ACEs.
    // Unlocks the staked + gained Ace and burns xAce
    function leave(uint256 _share) public {
        // Gets the amount of xAce in existence
        uint256 totalShares = totalSupply();
        // Calculates the amount of Ace the xAce is worth
        uint256 what = _share.mul(ace.balanceOf(address(this))).div(totalShares);
        _burn(msg.sender, _share);
        ace.transfer(msg.sender, what);
    }
}
