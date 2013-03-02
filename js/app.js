'use strict';

angular.module('GiltApp', ['GiltApp.filters', 'GiltApp.services', 'GiltApp.directives', 'GiltApp.controllers', 'ui.compat']).
    config(function ($stateProvider, $urlRouterProvider, $routeProvider, $locationProvider) {

        $stateProvider
            .state('home', {
                url:'/',
                views:{
                    '':{
                        templateUrl:'partial/welcome.html',
                        controller:'WelcomeCtrl'
                    }
                }
            })
            .state('sale', {
                url:'/sale/:type',
                views:{
                    '':{
                        templateUrl:'partial/sales.html',
                        controller:'SalesCtrl'
                    }
                },
                resolve:{
                    promiseData:salePromise
                },
                onEnter:function ($rootScope, $state, $log) {
                    $log.info('Sale:onEnter');
                    $rootScope.$broadcast('Sale:onEnter');
                },
                onExit:function ($rootScope, $state) {
                    $rootScope.$broadcast('Sale:onExit');
                }
            })
            .state('sale.product', {
                url:'/product/:uri',
                views:{
                    '':{
                        templateUrl:'partial/products.html',
                        controller:'ProductsCtrl'
                    }
                },
                resolve:{
                    promiseData:productPromise
                },
                onEnter:function ($rootScope, $state, $stateParams, $log) {
                    $log.info('Product:onEnter');
                    $rootScope.$broadcast('Product:onEnter', $state, $stateParams);
                },
                onExit:function ($rootScope, $state, $stateParams) {
                    $rootScope.$broadcast('Product:onExit', $state, $stateParams);
                }
            })
            .state('sale.product.item', {
                url:'/item/:id',
                views:{
                    '':{
                        templateUrl:'partial/product.html',
                        controller:'ProductCtrl'
                    }
                },
                resolve:{
                    promiseData:itemPromise
                },
                onEnter:function ($rootScope, $state, $log) {
                    $log.info('Item:onEnter');
                    $rootScope.$broadcast('Item:onEnter');
                },
                onExit:function ($rootScope, $state) {
                    $rootScope.$broadcast('Item:onExit');
                }
            });
            $urlRouterProvider.otherwise('/');

    })
    .run(
        function ($rootScope, $state, $stateParams) {
            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;
        });
;


var productPromise = function ($q, $route, GILT, $http, $log, $stateParams) {

    var deferred = $q.defer();
    var promiseData = {};

    var productData = productDataPromise($q, $route, GILT, $http, $log, $stateParams);
    productData.then(function (result) {
        promiseData.data = result;
        if (result.products) {
            var products = productsPromise($q, $route, GILT, $http, $log, result, $stateParams);
            products.then(function (result) {
                promiseData.products = result;
                deferred.resolve(promiseData);
            });
        } else {
            deferred.resolve(promiseData);
        }

    });


    return deferred.promise;
}


var productsPromise = function ($q, $route, GILT, $http, $log, result, $stateParams) {

    var deferred = $q.defer();
    var finished = 0;
    var products = [];

    if (result.products) {
        var limit = Math.min(9, result.products.length);

        for (var i = 0; i < limit; i++) {
            (function (i) {
                var productUri = result.products[i];
                productItemPromise($q, $route, GILT, $http, $log, productUri).then(function (result) {
                    products.push(result);
                    if (++finished === limit) {
                        deferred.resolve(products);
                    }
                });
            }(i));
        }
    }

    return deferred.promise;
}

var productItemPromise = function ($q, $route, GILT, $http, $log, productUri) {

    var deferred = $q.defer();

    var successCb = function (result) {
        deferred.resolve(result);
        //$log.info(result);
    };

    var errorCb = function (error) {
        //$log.info(error);
    };


    var itemURI = productUri + GILT.APIKEY + GILT.CALLBACK;
    $http({method:GILT.METHOD, url:itemURI}).success(successCb).error(errorCb);

    return deferred.promise;
}


var itemPromise = function ($q, $route, GILT, $http, $log, $stateParams) {

    var deferred = $q.defer();
    var promiseData = {};

    var productData = productDataPromise($q, $route, GILT, $http, $log, $stateParams);
    productData.then(function (result) {
        promiseData.data = result;

        var itemData = itemDataPromise($q, $route, GILT, $http, $log, result, $stateParams);
        itemData.then(function (result) {
            promiseData.item = result;
            deferred.resolve(promiseData);
        });

    });


    return deferred.promise;
}

var productDataPromise = function ($q, $route, GILT, $http, $log, $stateParams) {

    var deferred = $q.defer();


    var successCb = function (result) {
        deferred.resolve(result);
        //$log.info(result);
    };

    var errorCb = function (error) {
        //$log.info(error);
    };

    var uri = $stateParams.uri.replace(/_/g, '/');
    var productURI = GILT.API + uri + GILT.APIKEY + GILT.CALLBACK;
    $http({method:GILT.METHOD, url:productURI}).success(successCb).error(errorCb);

    return deferred.promise;
}

var itemDataPromise = function ($q, $route, GILT, $http, $log, result, $stateParams) {

    var deferred = $q.defer();


    var successCb = function (result) {
        deferred.resolve(result);
        //$log.info(result);
    };

    var errorCb = function (error) {
        //$log.info(error);
    };

    var id = $stateParams.id.replace(/_/g, '/');
    var itemURI = GILT.API + id + GILT.APIKEY + GILT.CALLBACK;
    $http({method:GILT.METHOD, url:itemURI}).success(successCb).error(errorCb);

    return deferred.promise;
}


var salePromise = function ($q, $route, GILT, $http, $log, $stateParams) {

    var deferred = $q.defer();
    var promiseData = {};

    var saleData = saleDataPromise($q, $route, GILT, $http, $log, $stateParams);
    saleData.then(function (result) {
        promiseData.data = result;

        var itemData = saleItemPromise($q, $route, GILT, $http, $log, result);
        itemData.then(function (result) {
            promiseData.item = result;
            deferred.resolve(promiseData);
        });

    });

    return deferred.promise;
}


var saleDataPromise = function ($q, $route, GILT, $http, $log, $stateParams) {

    var successCb = function (result) {
        deferred.resolve(result);
        //$log.info(result);
    };

    var errorCb = function (error) {
        //$log.info(error);
    };

    var deferred = $q.defer();
    var saleUrl = GILT.SALE + $stateParams.type + GILT.ACTIVE + GILT.APIKEY + GILT.CALLBACK;
    //var saleUrl = GILT.SALE + $route.current.params.type + GILT.ACTIVE + GILT.APIKEY + GILT.CALLBACK;
    $http({method:GILT.METHOD, url:saleUrl}).success(successCb).error(errorCb);

    return deferred.promise;
}

var saleItemPromise = function ($q, $route, GILT, $http, $log, result) {

    var successCb = function (result) {
        deferred.resolve(result);
        //$log.info(result);
    };

    var errorCb = function (error) {
        //$log.info(error);
    };

    var deferred = $q.defer();
    var index = Math.floor(Math.random() * result.sales.length);
    var productURI = result.sales[index].sale + GILT.APIKEY + GILT.CALLBACK;
    $http({method:GILT.METHOD, url:productURI}).success(successCb).error(errorCb);

    return deferred.promise;
}
