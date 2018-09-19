pragma solidity ^0.4.24;

/**
 * @title EnsResolver
 * @dev Extract of the interface for ENS Resolver
 */
contract EnsResolver {
	function setAddr(bytes32 node, address addr) public;
	function addr(bytes32 node) public view returns (address);
}
