const RegistryMock = artifacts.require('./EnsRegistryMock.sol');
const ResolverMock = artifacts.require('./EnsResolverMock.sol');
const SubdomainFactory = artifacts.require('./EnsSubdomainFactory.sol');
const Namehash = require('eth-ens-namehash-ms');

module.exports = async function(deployer, network, accounts) {
	deployer.deploy(RegistryMock)
		.then(function(){
			return RegistryMock.deployed();
		})
		.then(function(registryInstance){
			deployer.deploy(ResolverMock)
				.then(function(){
					return ResolverMock.deployed();
				})
				.then(function(resolverInstance){
					deployer.deploy(SubdomainFactory, registryInstance.address, resolverInstance.address)
					.then(function(){
						return SubdomainFactory.deployed();
						console.log("Migration completed");
					})
					.then(function(factoryInstance){
						//create two top level domains
						registryInstance.setOwner(
							Namehash.hash("tenz-id.eth"),
							factoryInstance.address
						);
						registryInstance.setOwner(
							Namehash.hash("freedomain.eth"),
							factoryInstance.address
						);
					});
				});
		});
};