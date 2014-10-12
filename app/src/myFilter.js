import { Inject, InjectAsProperty, Filter } from './annotations';

@Filter('makeUppercase')
export default class MakeUppercase {
	filter (str) {
		return str.toUpperCase();
	}
}