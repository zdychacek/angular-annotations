import { register } from './lib/registry';

import MyDirective from './myDirective';
import * as MyController from './myController';
import MyFilter from './myFilter';
import MyService from './myService';
import MyFactory from './myFactory';

var myApp = angular.module('myApp', []);

register(myApp, [ MyDirective, MyFactory, MyService, MyController, MyFilter ]);