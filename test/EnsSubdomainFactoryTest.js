const RegistryMock = artifacts.require('./EnsRegistryMock.sol');
const ResolverMock = artifacts.require('./EnsResolverMock.sol');
const SubdomainFactory = artifacts.require('./EnsSubdomainFactory.sol');
const Namehash = require('eth-ens-namehash-ms');

let contractOwner;
let subdomainOwner;
let subdomainTarget;

let registry;
let resolver;
let factory;

let domain = "startonchain";
let domainEth = "startonchain.eth";
let subdomain = "radek";
let fullDomainEth = "radek.startonchain.eth";

contract('EnsSubdomainFactory', (accounts) => {

    beforeEach(async () => {
        contractOwner = accounts[0];
        subdomainOwner = accounts[1];
        subdomainTarget = accounts[2];

        registry = await RegistryMock.new();
        resolver = await ResolverMock.new();
        factory = await SubdomainFactory.new(registry.address, resolver.address);
    });

    function expectRevert(e, msg) {
        assert(e.message.search('revert') >= 0, msg);
    }

    it("creating new subdomain works", async () => {
        //first set the factory contract to be the owner of the domain
        let domainNamehash = Namehash.hash(domainEth);
        await registry.setOwner(domainNamehash, factory.address);

        let expectedNamehash = Namehash.hash(fullDomainEth);
        await factory.newSubdomain(subdomain, domain, subdomainOwner, subdomainTarget);

        //check registry
        assert(subdomainOwner == (await registry.owner.call(expectedNamehash)), "domain owner is invalid");
        assert(resolver.address == (await registry.resolvers.call(expectedNamehash)), "resolver is invalid");

        //check resolver
        assert(subdomainTarget == (await resolver.targets.call(expectedNamehash)), "domain target invalid");
    });

    it("creating new subdomain fails when factory is not the owner of domain", async () => {
        try {
            await factory.newSubdomain(domain, subdomain, subdomainOwner, subdomainTarget);
            assert(false);
        } catch (e) {
            expectRevert(e, "factory contract must be the owner of the domain");
        }
    });

    it("updating subdomain works if done by current owner", async () => {
        //first set the factory contract to be the owner of the  domain
        await registry.setOwner(Namehash.hash(domainEth), factory.address);

        let expectedNamehash = Namehash.hash(fullDomainEth);
        //create it for the first time
        await factory.newSubdomain(subdomain, domain, subdomainOwner, subdomainTarget);
        
        //update it as domain owner: swap owner with target
        await factory.newSubdomain(subdomain, domain, subdomainTarget, subdomainOwner, {from: subdomainOwner});

        //check registry
        assert(subdomainTarget == (await registry.owner.call(expectedNamehash)), "domain owner is invalid");
        assert(resolver.address == (await registry.resolvers.call(expectedNamehash)), "resolver is invalid");

        //check resolver
        assert(subdomainOwner == (await resolver.targets.call(expectedNamehash)), "domain target invalid");
    });

    it("creating new subdomain fails if it is already owned by someone else", async () => {
        //first set the factory contract to be the owner of the domain
        await registry.setOwner(Namehash.hash(domainEth), factory.address);

        //create it for the first time
        await factory.newSubdomain(subdomain, domain, subdomainOwner, subdomainTarget);
        
        try {
            //it's already owned by subdomainOwner, so updating as contractOwner should fail
            await factory.newSubdomain(subdomain, domain, subdomainOwner, subdomainTarget);
            assert(false);
        } catch (e) {
            expectRevert(e, "subdomain is already owned");
        }
    });

    it("transferring domain works", async () => {
        let namehash = Namehash.hash(domainEth);
        
        await registry.setOwner(namehash, factory.address);
        assert(factory.address == (await registry.owner.call(namehash)));

        await factory.transferTopLevelDomainOwnership(namehash, subdomainOwner);
        assert(subdomainOwner == (await registry.owner.call(namehash)));
    });

    it("cannot transfer domains when locked", async () => {
        let namehash = Namehash.hash(domainEth);
        
        await registry.setOwner(namehash, factory.address);
        assert(factory.address == (await registry.owner.call(namehash)));

        await factory.lockTopLevelDomainOwnershipTransfers();

        try {
            await factory.transferTopLevelDomainOwnership(namehash, subdomainOwner);
            assert(false);
        } catch (e) {
            expectRevert(e, "transferring domains out is locked");
        }
        assert(factory.address == (await registry.owner.call(namehash)));
    });

    it("cannot transfer domains when not contract owner", async () => {
        let namehash = Namehash.hash(domainEth);
        
        await registry.setOwner(namehash, factory.address);

        try {
            await factory.transferTopLevelDomainOwnership(namehash, subdomainOwner, {from: subdomainOwner});
            assert(false);
        } catch (e) {
            expectRevert(e, "cannot transfer domain if not contract owner");
        }
        assert(factory.address == (await registry.owner.call(namehash)));
    });

    it("checking for domain and subdomain owner works", async () => {
        let domainNamehash = Namehash.hash(domainEth);
        let fullDomainNamehash = Namehash.hash(fullDomainEth);

        await registry.setOwner(domainNamehash, subdomainOwner);
        await registry.setOwner(fullDomainNamehash, subdomainOwner);

        assert(subdomainOwner == (await factory.topLevelDomainOwner.call(domain)));
        assert(subdomainOwner == (await factory.subDomainOwner.call(subdomain, domain)));
    });
})