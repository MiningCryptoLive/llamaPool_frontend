// ***
// MENU STUFF
// ***
$('#blocks').click(function(event) {
	event.preventDefault();
	displayMenu('blocks.html');
});

$('#payments').click(function(event) {
	event.preventDefault();
	displayMenu('payments.html');
});

$('#workerstats').click(function(event) {
	event.preventDefault();
	displayMenu('workerstats.html');
});

$('#gettingstarted').click(function(event) {
	event.preventDefault();
	displayMenu('gettingstarted.html');
});

$('#pool-stats').click(function(event) {
	event.preventDefault();
	displayMenu('home.html');
	updatePools();
});

$('#top-10').click(function(event) {
	event.preventDefault();
	displayMenu('top10.html');
	updatePools();
});

$('#faq').click(function(event) {
	event.preventDefault();
	displayMenu('faq.html');
	updatePools();
});

$('#childPayments').click(function(event) {
	event.preventDefault();
	displayMenu('childPayments.html');
	updatePools();
});

$('#childBlocks').click(function(event) {
	event.preventDefault();
	displayMenu('childBlocks.html');
	updatePools();
});

function displayMenu(page){
	$.ajax({
		url: 'pages/' + page,
		type: 'GET',
		dataType: 'html'
	})
	.done(function(response) {
		$( "#dynamic-menu" ).html(response);
		console.log (response);
	})
	.fail(function(err) {
		console.log(err, "error");
	})
}

// ***
// END MENU STUFF
// ***

// Get current miner address
function getCurrentAddress() {
    var urlWalletAddress = location.search.split('wallet=')[1] || 0;
    var address = urlWalletAddress || docCookies.getItem('mining_address');
    return address;
}

// Get stats from pool API
function getPoolStats(poolID, poolURL) {
    var apiURL = poolURL + '/stats';
    $.get(apiURL, function(data){
        if (!data) return ;
        
        // Load current miner statistics
		var xhrAddressPoll;
		var addressTimeout;
        
        // CONFIG API CALLS 
        var poolFee = 'N/A';
        var networkFee = 'N/A';
        var paymentsInterval = 'N/A';
        var paymentsMinimum = 'N/A';
        var depth = 'N/A';
        if (data.config) {
	        poolFee = data.config.fee || 0;
	        networkFee = data.config.networkFee || 0;
	        paymentsInterval = (data.config.paymentsInterval / 60) || 0;
	        paymentsMinimum = getReadableCoins(data.config.minPaymentThreshold) || 0;
	        denominationUnite = (data.config.denominationUnit);
	        coinDecimalPlaces = (data.config.coinDecimalPlaces);
	        symbol = data.config.symbol;
	        depth = (data.config.depth);
        }
        updateText('poolFee', poolFee);
        updateText('networkFee', networkFee);
        updateText('paymentsInterval', paymentsInterval);
        updateText('coinDecimalPlaces', coinDecimalPlaces);
        updateText('paymentsMinimum', paymentsMinimum);
        updateText('denominationUnite', denominationUnite);
        updateText('symbol', symbol);
        updateText('depth', depth);
        
        // POOL API CALLS
        var poolHashrate = 'N/A';
        var poolMiners   = 'N/A';
        var poolWorkers  = 'N/A';
        var poolMinersPaid = 'N/A';
        var blocksFound = 'N/A';
        var totalPayments = 'N/A';
        if (data.pool) {
            poolHashrate = getReadableHashRate(data.pool.hashrate);
            poolMiners   = data.pool.miners || 0;
            poolWorkers  = data.pool.workers || 0;
            poolMinersPaid = data.pool.totalMinersPaid || 0;
            blocksFound = data.pool.totalBlocks.toString();
            totalPayments = data.pool.totalPayments.toString();
            lastBlockFound = data.pool.stats.lastBlockFound;
		}
		updateText('lastBlockFound', jQuery.timeago(Number(lastBlockFound)));        
		updateText('poolHashrate', poolHashrate);
        updateText('poolMiners', poolMiners);
        updateText('poolWorkers', poolWorkers);
        updateText('poolMinersPaid', poolMinersPaid);
        updateText('blocksFound', blocksFound);
        updateText('paymentsTotal', totalPayments);

		// NETWORK API CALLS
        var networkHashrate = 'N/A';
        var networkDiff     = 'N/A';
        var networkHeight = 'N/A';
        var networkLastBlockFound = 'N/A';
        var networkLastReward = 'N/A';
        if (data.network) {
            networkHashrate = getReadableHashRate(data.network.difficulty / data.config.coinDifficultyTarget);
            networkDiff     = formatNumber(data.network.difficulty.toString(), ' ');
            networkHeight = formatNumber(data.network.height.toString(), ' ');
            networkLastBlockFound = jQuery.timeago(new Date(data.lastblock.timestamp * 1000).toISOString());
        }
		
        updateText('networkHashrate', networkHashrate);
        updateText('networkHeight', networkHeight);
        updateText('networkLastBlockFound', networkLastBlockFound);
        updateText('networkDiff', networkDiff);
       
        // COMBINED CALLS
        var poolHeight = 'N/A';
        if (data.network) {
            poolHeight = formatNumber(data.network.height.toString(), ' ');
        }
        updateText('poolHeight', poolHeight);
		
        var hashPower = 'N/A';
        var blockSolvedTime = 'N/A';
        if (data.pool && data.network) {
            hashPower = data.pool.hashrate / (data.network.difficulty / data.config.coinDifficultyTarget) * 100;
            hashPower = hashPower.toFixed(2) + '%';
            blockSolvedTime = (data.network.difficulty / data.pool.hashrate);
        }
        updateText('hashPower', hashPower);
        updateText('blockSolvedTime', getReadableTime(blockSolvedTime));
        updateText('currentEffort', (data.pool.roundHashes / data.network.difficulty * 100).toFixed(1) + '%');
        
        // format last reward
        if (data.config.networkFee) {
            var networkFee = (data.config.networkFee / 100);
            updateText('networkLastReward', getReadableCoins(data.lastblock.reward - (data.lastblock.reward * networkFee)));
        } else {
            updateText('networkLastReward', getReadableCoins(data.lastblock.reward));
        }
        
        
        // get readable coins
		function getReadableCoins(coins, digits, withoutSymbol){
			var coinDecimalPlaces = getCoinDecimalPlaces();
			var amount = parseFloat((parseInt(coins || 0) / data.config.coinUnits).toFixed(digits || coinDecimalPlaces));
			return amount.toString() + (withoutSymbol ? '' : (' ' + data.config.symbol));
		}

		// Get coin decimal places
		function getCoinDecimalPlaces() {
			if (typeof coinDecimalPlaces != "undefined") return coinDecimalPlaces;
			else if (data.config.coinDecimalPlaces) return data.config.coinDecimalPlaces;
			else data.config.coinUnits.toString().length - 1;
		}

        var cnAlgorithm = data.config.cnAlgorithm || "cryptonight";
        var cnVariant = data.config.cnVariant || 0;

        if (cnAlgorithm == "cryptonight_light") {
            if (cnVariant === 1) {
                algorithm = 'Cryptonight Light v7';
            } else if (cnVariant === 2) {
                algorithm = 'Cryptonight Light';
            } else {
                algorithm = 'Cryptonight Light';
            }
        }
        else if (cnAlgorithm == "cryptonight_heavy") {
            algorithm = 'Cryptonight Heavy';
        }
        else {
            if (cnVariant === 1) {
                algorithm = 'Cryptonight v7';
            } else if (cnVariant === 3) {
                algorithm = 'Cryptonight v7';
            } else {
                algorithm = 'Cryptonight';
            }
        }
        updateText('algorithm', algorithm);

    });
}

function getChildPoolStats(childPoolID, childPoolURL) {
    var apiURL = childPoolURL + '/stats';
    $.get(apiURL, function(data){
        if (!data) return ;
        
        // Load current miner statistics
		var xhrAddressPoll;
		var addressTimeout;
        
        // CONFIG API CALLS 
        var childpoolFee = 'N/A';
        var childNetworkFee = 'N/A';
        var childPaymentsInterval = 'N/A';
        var childPaymentsMinimum = 'N/A';
        var childDepth = 'N/A';
        if (data.config) {
	        childPoolFee = data.config.fee || 0;
	        childNetworkFee = data.config.networkFee || 0;
	        childPaymentsInterval = (data.config.paymentsInterval / 60) || 0;
	        childPaymentsMinimum = getReadableCoins(data.config.minPaymentThreshold) || 0;
	        childDenominationUnite = (data.config.denominationUnit);
	        childSymbol = data.config.symbol;
	        childDepth = (data.config.depth);
        }
        updateText('childPoolFee', childPoolFee);
        updateText('childNetworkFee', childNetworkFee);
        updateText('childPaymentsInterval', childPaymentsInterval);
        updateText('childPaymentsMinimum', childPaymentsMinimum);
        updateText('childDenominationUnite', childDenominationUnite);
        updateText('childSymbol', childSymbol);
        updateText('childDepth', childDepth);
       
        // POOL API CALLS
        var childPoolHashrate = 'N/A';
        var childPoolMiners   = 'N/A';
        var childPoolWorkers  = 'N/A';
        var childPoolMinersPaid = 'N/A';
        var childBlocksFound = 'N/A';
        var childTotalPayments = 'N/A';
        var lastChildBlockFound = 'N/A';
        if (data.pool) {
            childPoolHashrate = getReadableHashRate(data.pool.hashrate);
            childPoolMiners   = data.pool.miners || 0;
            childPoolWorkers  = data.pool.workers || 0;
            childPoolMinersPaid = data.pool.totalMinersPaid || 0;
            childBlocksFound = data.pool.totalBlocks.toString();
            childTotalPayments = data.pool.totalPayments.toString();
			lastChildBlockFound = data.pool.stats.lastBlockFound;
		}
		updateText('childLastBlockFound', jQuery.timeago(Number(lastChildBlockFound)));
        updateText('childPoolHashrate', childPoolHashrate);
        updateText('childPoolMiners', childPoolMiners);
        updateText('childPoolWorkers', childPoolWorkers);
        updateText('childPoolMinersPaid', childPoolMinersPaid);
        updateText('childBlocksFound', childBlocksFound);
        updateText('childPaymentsTotal', childTotalPayments);

		// NETWORK API CALLS
        var childNetworkHashrate = 'N/A';
        var childNetworkDiff     = 'N/A';
        var childNetworkHeight = 'N/A';
        var childNetworkLastBlockFound = 'N/A';
        var childNetworkLastReward = 'N/A';
        if (data.network) {
            childNetworkHashrate = getReadableHashRate(data.network.difficulty / data.config.coinDifficultyTarget);
            childNetworkDiff     = formatNumber(data.network.difficulty.toString(), ' ');
            childNetworkHeight = formatNumber(data.network.height.toString(), ' ');
            childNetworkLastBlockFound = jQuery.timeago(new Date(data.lastblock.timestamp * 1000).toISOString());
        }
       
        updateText('childNetworkHashrate', childNetworkHashrate);
        updateText('childNetworkHeight', childNetworkHeight);
        updateText('childNetworkLastBlockFound', childNetworkLastBlockFound);
        updateText('childNetworkDiff', childNetworkDiff);
       
        // COMBINED CALLS
        var childPoolHeight = 'N/A';
        if (data.network) {
            childPoolHeight = formatNumber(data.network.height.toString(), ' ');
        }
        updateText('childPoolHeight', childPoolHeight);

        var childHashPower = 'N/A';
        var childBlockSolvedTime = 'N/A';
        if (data.pool && data.network) {
            childHashPower = data.pool.hashrate / (data.network.difficulty / data.config.coinDifficultyTarget) * 100;
            childHashPower = childHashPower.toFixed(2) + '%';
            childBlockSolvedTime = (data.network.difficulty / data.pool.hashrate);
        }
        updateText('childHashPower', childHashPower);
        updateText('childBlockSolvedTime', getReadableTime(childBlockSolvedTime));
        updateText('childCurrentEffort', (data.pool.roundHashes / data.network.difficulty * 100).toFixed(1) + '%');
        
        // format last child reward
        if (data.config.networkFee) {
            var childNetworkFee = (data.config.networkFee / 100);
            updateText('childNetworkLastReward', getReadableCoins(data.lastblock.reward - (data.lastblock.reward * childNetworkFee)));
        } else {
            updateText('childNetworkLastReward', getReadableCoins(data.lastblock.reward));
        }
        
        // get readable coins
		function getReadableCoins(coins, digits, withoutSymbol){
			var coinDecimalPlaces = getCoinDecimalPlaces();
			var amount = parseFloat((parseInt(coins || 0) / data.config.coinUnits).toFixed(digits || coinDecimalPlaces));
			return amount.toString() + (withoutSymbol ? '' : (' ' + data.config.symbol));
		}

		// Get coin decimal places
		function getCoinDecimalPlaces() {
			if (typeof coinDecimalPlaces != "undefined") return coinDecimalPlaces;
			else if (data.config.coinDecimalPlaces) return data.config.coinDecimalPlaces;
			else data.config.coinUnits.toString().length - 1;
		}

        var cnAlgorithm = data.config.cnAlgorithm || "cryptonight";
        var cnVariant = data.config.cnVariant || 0;

        if (cnAlgorithm == "cryptonight_light") {
            if (cnVariant === 1) {
                algorithm = 'Cryptonight Light v7';
            } else if (cnVariant === 2) {
                algorithm = 'Cryptonight Light';
            } else {
                algorithm = 'Cryptonight Light';
            }
        }
        else if (cnAlgorithm == "cryptonight_heavy") {
            algorithm = 'Cryptonight Heavy';
        }
        else {
            if (cnVariant === 1) {
                algorithm = 'Cryptonight v7';
            } else if (cnVariant === 3) {
                algorithm = 'Cryptonight v7';
            } else {
                algorithm = 'Cryptonight';
            }
        }
        updateText('algorithm', algorithm);

    });
}

// Update pools
function updatePools() {
    getPoolStats('Triton', 'http://pool.llama.horse:19233');
    getChildPoolStats('Nibble Classic', 'http://pool.llama.horse:19234');
}

// Initialize
$(function() {
    setInterval(updatePools, (30*1000));
    updatePools();
});

// Update Text content
function updateText(elementId, text){
    var el = document.getElementById(elementId);
    if (el && el.textContent !== text){
        el.textContent = text;
    }
    return el;
}

// Get readable hashrate
function getReadableHashRate(hashrate){
    var i = 0;
    var byteUnits = [' H', ' KH', ' MH', ' GH', ' TH', ' PH' ];
    while (hashrate > 1000){
        hashrate = hashrate / 1000;
        i++;
    }
    return hashrate.toFixed(2) + byteUnits[i] + '/s';
}
