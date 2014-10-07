import { Inject, InjectAsProperty, Controller, Scope } from './annotations';

@Inject('MyService', '$timeout')
@InjectAsProperty('$scope', '$compile')
@Controller('MyController')
export default class MyController {
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