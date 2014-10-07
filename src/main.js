import {
	registerDirective,
	registerController,
	registerFilter,
	registerService,
	registerControllerDecorator
} from './registry';

import MyDirective from './myDirective';
import MyController from './myController';

var myApp = angular.module('myApp', []);

registerDirective(myApp, MyDirective);
registerController(myApp, MyController);