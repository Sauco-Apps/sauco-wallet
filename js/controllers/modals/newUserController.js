require('angular');

angular.module('liskApp').controller('newUserController', ["$scope", "$http", "newUser", "userService", "$state", "viewFactory", 'gettextCatalog', function ($scope, $http, newUser, userService, $state, viewFactory, gettextCatalog) {

    $scope.step = 1;
    $scope.noMatch = false;
    $scope.view = viewFactory;
    $scope.view.loadingText = gettextCatalog.getString('Registering user');
    $scope.view.inLoading = false;

    $scope.activeLabel = function (pass) {
        return pass != '';
    }

    $scope.generatePassphrase = function () {
        var code = new Mnemonic(Mnemonic.Words.ENGLISH);
        $scope.newPassphrase = code.toString();
    };

    $scope.goToStep = function (step) {
        if (step == 1) {
            $scope.repeatPassphrase = '';
            $scope.noMatch = false;
        }
        $scope.step = step;
    }

    $scope.savePassToFile = function (pass) {
        var blob = new Blob([pass], { type: "text/plain;charset=utf-8" });
        FS.saveAs(blob, "ShiftPassphrase.txt");
    }

    $scope.login = function (pass) {
        if (!Mnemonic.isValid(pass) || ($scope.newPassphrase !== pass)) {
            $scope.noMatch = true;
        } else {
			var saucojs = require('sauco-js');
			var accountKeys = saucojs.crypto.getKeys(pass);
			if (accountKeys.publicKey) {
				var accountAddress = saucojs.crypto.getAddress(accountKeys.publicKey);
				
				newUser.deactivate();
				userService.setData(accountAddress, accountKeys.publicKey, 0, 0, 0);
				userService.setForging(0);
				userService.setSecondPassphrase(0);
				userService.unconfirmedPassphrase = 0;
				
				$state.go('main.dashboard');
			} else {
				console.error("Login failed. Failed to create account.");
			}
		}
	}

    $scope.close = function () {
        newUser.deactivate();
    }

    $scope.generatePassphrase();

}]);
