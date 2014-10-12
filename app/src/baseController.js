import { Inject, InjectAsProperty, Controller } from './lib/annotations';

@Inject('MyService', '$timeout')
@InjectAsProperty('$compile', '$scope')
@Controller('BaseController')
export default class BaseController {
	constructor () {
		this.$scope.data = 'none';
	}
}