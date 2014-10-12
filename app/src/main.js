import { register } from './lib/registry';

import MyDirective from './myDirective';
import MyController from './myController';
import MyFilter from './myFilter';
import MyService from './myService';
import MyFactory from './myFactory';

var myApp = angular.module('myApp', []);

register(myApp, [ MyDirective, MyController, MyFilter, MyService, MyFactory ]);