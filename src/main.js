import {
	registerDirective,
	registerController,
	registerFilter,
	registerService,
	registerControllerDecorator
} from './registry';

import MyDirective from './myDirective';
import MyController from './myController';
import MyFilter from './myFilter';
import MyService from './myService';

var myApp = angular.module('myApp', []);

registerDirective(myApp, MyDirective);
registerController(myApp, MyController);
registerFilter(myApp, MyFilter);
registerService(myApp, MyService);