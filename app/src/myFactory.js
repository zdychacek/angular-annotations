import { Inject, Factory } from './lib/annotations';

@Inject('MyService')
@Factory('MyFactory')
export default function myFactory (MyService) {
	return {
		data: MyService.data
	};
}