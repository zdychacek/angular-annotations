import { Inject, InjectAsProperty, Filter } from './lib/annotations';

@Filter('makeUppercase')
export default class MakeUppercase {
	filter (str) {
		return str.toUpperCase();
	}
}