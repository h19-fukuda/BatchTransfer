pragma solidity ^0.4.23;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

contract TestToken is StandardToken {
    string public constant name = "Test"; // solium-disable-line uppercase
    string public constant symbol = "TST"; // solium-disable-line uppercase
    uint8 public constant decimals = 0; // solium-disable-line uppercase

    uint256 public constant INITIAL_SUPPLY = 100000000 * (10 ** uint256(decimals));

    /**
    * @dev Constructor that gives msg.sender all of existing tokens.
    */
    constructor() public {
        totalSupply_ = INITIAL_SUPPLY;
        balances[msg.sender] = INITIAL_SUPPLY;
        Transfer(0x0, msg.sender, INITIAL_SUPPLY);
    }

}