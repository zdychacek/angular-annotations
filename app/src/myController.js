import { Controller, Scope } from './annotations';
import BaseController from './baseController';

@Controller('MyController')
export default class MyController extends BaseController {
	constructor (MyService, $timeout) {
		this.dataSource = MyService;
		this.$timeout = $timeout;

		this.$scope.data = 'none';
	}

	@Scope
	getData () {
		this.$timeout(() => this.$scope.data = this.dataSource.getInfo(), 500);
	}
}

console.log('huhu');