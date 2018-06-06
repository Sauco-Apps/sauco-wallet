require('angular');

angular.module('liskApp').controller('passphraseController', ['$scope', '$rootScope', '$http', "$state", "userService", "newUser", 'gettextCatalog', '$cookies', function ($rootScope, $scope, $http, $state, userService, newUser, gettextCatalog, $cookies) {

    userService.setData();
    userService.rememberPassphrase = false;
    userService.rememberedPassphrase = '';
    $scope.rememberPassphrase = true;
    $scope.errorMessage = "";
	$scope.date = new Date();

    $scope.cleanUpUserData = function () {
        var userProperties = [ 'address', 'allVotes', 'balance', 'balanceToShow', 'dataToShow', 'unconfirmedBalance',
            'unconfirmedPassphrase', 'username', 'rememberedPassphrase', 'publicKey', 'delegate'];
        for (var i = 0; i < userProperties.length; i++) {
            if ($rootScope[userProperties[i]] != undefined) {
                $rootScope[userProperties[i]] = null;
            }
        }
    }
    $scope.cleanUpUserData();

    $scope.newUser = function () {
        $scope.newUserModal = newUser.activate({
            destroy: function () {
            }
        });
    }

    $scope.login = function (pass, remember) {
        if (!pass || pass.trim().split(/\s+/g).length < 12) {
            $scope.errorMessage = 'Passphrase must consist of 12 or more words.';
            return;
        }
        if (pass.length > 100) {
            $scope.errorMessage = 'Passphrase must contain less than 100 characters.';
            return;
        }
        if (!Mnemonic.isValid(pass)) {
            $scope.errorMessage = 'Passphrase must be a valid BIP39 mnemonic code.';
            return;
        }
        $scope.errorMessage = "";
		
		var shiftjs = require('sauco-js');
		var accountKeys = shiftjs.crypto.getKeys(pass);

		$http.get('/api/accounts?publicKey='+accountKeys.publicKey).then(function (resp) {
			if (resp.data.success){
				userService.setData(resp.data.account.address, resp.data.account.publicKey, resp.data.account.balance, resp.data.account.unconfirmedBalance, resp.data.account.effectiveBalance);
				userService.setForging(resp.data.account.forging);
				userService.setSecondPassphrase(resp.data.account.secondSignature || resp.data.account.unconfirmedSignature);
				userService.unconfirmedPassphrase = resp.data.account.unconfirmedSignature;
				if (remember) {
					userService.setSessionPassphrase(pass);
				}
			} else {				
				$scope.errorMessage = resp.data.error ? resp.data.error : 'Error connecting to server';
			}
		}, function (error) {
			$scope.errorMessage = error.data.error ? error.data.error : error.data;
		}).finally(function(){
			if ($scope.errorMessage === 'Account not found') {
				$scope.errorMessage = '';
				var accountAddress = shiftjs.crypto.getAddress(accountKeys.publicKey);
				
				userService.setData(accountAddress, accountKeys.publicKey, 0, 0, 0);
				userService.setForging(0);
				userService.setSecondPassphrase(0);
				userService.unconfirmedPassphrase = 0;	
			}

			var goto = $cookies.get('goto');
			if (goto) {
				$state.go(goto);
			} else {
				$state.go('main.dashboard');
			}			
		});
    }
    
    var passphrase = $cookies.get('passphrase');
    if (passphrase) {
        $scope.login(passphrase);
    }

}]);
