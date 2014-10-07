import { Inject, InjectAsProperty, Controller } from './annotations';

@Inject('MyService', '$timeout')
@InjectAsProperty('$compile', '$scope')
@Controller('BaseController')
export default class BaseController {
	constructor () {
		this.$scope.data = 'none';
	}
}