import { Controller, Scope, Inject } from './lib/annotations';
import BaseController from './baseController';

@Inject('MyFactory')
@Controller('MyController')
export default class MyController extends BaseController {
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