import { InjectAsProperty, Service } from './lib/annotations';

var data = Symbol();

@InjectAsProperty('$timeout')
@Service('MyService')
export default class MyService {
	constructor () {
		this[data] = {
			name: 'Ondrej',
			age: 26
		};

		console.log(!!this.$timeout);
	}

	get data () {
		return this[data];
	}

	getInfo () {
		return `My name is ${this[data].name} and I am ${this[data].age}.`;
	}
}