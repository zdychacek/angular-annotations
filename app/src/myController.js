import { Controller, Scope, Config, Inject, InjectAsProperty } from './lib/annotations';
import BaseController from './baseController';

@Inject('MyFactory')
@InjectAsProperty('$timeout')
@Controller('MyController')
export class MyController extends BaseController {
	constructor (MyService, $timeout, MyFactory) {
		this.dataSource = MyService;
		this.$timeout = $timeout;

		this.$scope.data = 'none';

		console.log(MyFactory.data);
	}

	@Scope
	getData () {
		this.$timeout(() => this.$scope.data = this.dataSource.getInfo(), 500);
	}
}

@Inject('$httpProvider')
@Config
export function config ($httpProvider) {
	//$httpProvider.useApplyAsync(true);
}