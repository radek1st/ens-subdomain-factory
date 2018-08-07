pragma solidity ^0.4.23;

import './EnsResolver.sol';

/**
* @title EnsResolverMock
*/
contract EnsResolverMock is EnsResolver {
	mapping(bytes32 => address) public targets;

	function setAddr(bytes32 _node, address _addr) public {
		targets[_node] = _addr;
	}
}