DApp = {
	factoryContract: null,
	factoryAbi: [{"constant":false,"inputs":[{"name":"_topLevelDomain","type":"string"},{"name":"_subDomain","type":"string"},{"name":"_owner","type":"address"},{"name":"_target","type":"address"}],"name":"newSubdomain","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"creator","type":"address"},{"indexed":true,"name":"owner","type":"address"},{"indexed":false,"name":"domain","type":"string"},{"indexed":false,"name":"subdomain","type":"string"}],"name":"SubdomainCreated","type":"event"},{"constant":true,"inputs":[{"name":"_subDomain","type":"string"},{"name":"_topLevelDomain","type":"string"}],"name":"subDomainOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}],
	emptyAddress: '0x0000000000000000000000000000000000000000',
	
	// Local
	//factoryAddress: "0x9fbda871d559710256a2502a2517b794b482db40",

	// Ropsten
	//factoryAddress: "0xf9fa2ff44a474b6d20500969bda61c2827fbc6b6",
	
	// Mainnet
	factoryAddress: "0x21aa8d3eee8be2333ed180e9a5a8c0729c9b652c",

	init: function() {
		console.log('[x] Initializing DApp.');
		this.initWeb3();
	},

	initWeb3: function() {
		window.addEventListener('load', () => {
			// If web3 is not injected
			if (typeof web3 === 'undefined') {
				// Listen for provider injection
				window.addEventListener('message', ({ data }) => {
					if (data && data.type && data.type === 'ETHEREUM_PROVIDER_SUCCESS') {
						// Use injected provider
						web3 = new Web3(ethereum);
						console.log('[x] web3 object initialized.');
						DApp.initContracts(); 
					} else {
						// No web3 instance available show a popup
						$('#metamaskModal').modal('show');   
					}
				});
				// Request provider
				window.postMessage({ type: 'ETHEREUM_PROVIDER_REQUEST' }, '*');
			}
			// If web3 is injected use it's provider
			else {
				web3 = new Web3(web3.currentProvider);
				console.log('[x] web3 object initialized.');
				DApp.initContracts(); 
			} 
		});
	},

	initContracts: function() {
		DApp.factoryContract = new web3.eth.Contract(DApp.factoryAbi, DApp.factoryAddress);
		console.log('[x] Factory contract initialized.');

		DApp.loadAccount();
	},

	loadAccount: function() {
		web3.eth.getAccounts(function(error, accounts) {
			if(error) {
				console.error("[x] Error loading accounts", error);
			} else {
				DApp.currentAccount = accounts[0];
				console.log("[x] Using account", DApp.currentAccount);
				
				DApp.initActions();
				DApp.initFrontend();
			}
		});
	},

	checkSubdomainOwner: function(subdomain, domain){
		DApp.factoryContract.methods.subDomainOwner(subdomain, domain).call(
				function(error, addr){
				if(error){
					console.log('[x] Error during execution', error);
				} else {
					$("#subdomain").removeClass("is-valid is-invalid");
					if(addr === DApp.emptyAddress){
						$('#valid').text("It's available! Go for it tiger!");
						$('#subdomain').addClass('is-valid');
					} else if(addr === DApp.currentAccount) {
						$('#valid').text("It's your subdomain! Edit away!");
						$('#subdomain').addClass('is-valid');
					} else {
						$('#invalid').text("Oops! It's already taken by: " + addr);
						$('#subdomain').addClass('is-invalid');
					}
				}
			})
	},

	newSubdomain: function(subdomain, domain, owner, target) {
		DApp.factoryContract.methods.newSubdomain(
			subdomain, domain, owner, target).send(
			{
				gas: 150000,
				from: DApp.currentAccount
			},
			function(error, result){
				if(error){
					console.log('[x] Error during execution', error);
				} else {
					console.log('[x] Result', result);
				}   
			})
	},

	initActions: function() {
		$("#domain").on("change", function() {
			DApp.updateDomainAvailable();
		});

		$("#subdomain").on("paste keyup", function() {
			DApp.updateDomainAvailable();
		});

		$("#owner").on("paste keyup", function() {
			$("ownerHelp").remove();
			DApp.validateAddress("#owner");
		});

		$("#target").on("paste keyup", function() {
			$("targetHelp").remove();
			DApp.validateAddress("#target");
		});

		$("#subdomain-form").submit(function(event) {
			event.preventDefault();
			$("#ownerHelp").remove();
			$("#targetHelp").remove();

			let fullDomain = $('#subdomain').val() + "." +
			$('#domain option').filter(":selected").val() + ".eth";
			$("a").attr("href", "https://etherscan.io/enslookup?q=" + fullDomain);
			$('#confirmModal').modal('show');
			$("#subdomain").removeClass("is-valid is-invalid");
			
			DApp.newSubdomain(
				$('#subdomain').val(),
				$('#domain option').filter(":selected").val(),
				$('#owner').val(),
				$('#target').val()
			);
		});
	},

	validateAddress: function(element){
		if(web3.utils.isAddress($(element).val())){
			$(element).removeClass("is-invalid");
		} else {
			$(element).addClass("is-invalid");
		}
	},

	initFrontend: function(){
		$('#owner').val(DApp.currentAccount);
		$('#target').val(DApp.currentAccount);
		$("#domain").append("<option value='freedomain'>freedomain.eth</option>");
	},

	updateDomainAvailable: function(){
		$("#subdomain").removeClass("is-valid is-invalid");
		let cleaned = $('#subdomain').val().replace(/[^a-z0-9]/gi,'').toLowerCase();
		$('#subdomain').val(cleaned);
		if($('#subdomain').val().length > 0) {
			DApp.checkSubdomainOwner(
				$('#subdomain').val(), 
				$('#domain option').filter(":selected").val()
				);
		}
	}
}

$(function() {
	DApp.init();
});
