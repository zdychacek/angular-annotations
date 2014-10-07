import { Inject, InjectAsProperty, Controller, Scope } from './annotations';

@Inject('$q', '$http')
@InjectAsProperty('$scope', '$compile')
@Controller('MyController')
export default class MyController {
	constructor ($q, $http) {
		this.$q = $q;
		this.$http = $http;

		this.$scope.data = 'daataaaa';
		this.huhu = 'hehe';
	}

	@Scope
	getData () {
		var url = 'http://public-api.wordpress.com/rest/v1/sites/wtmpeachtest.wordpress.com/posts?callback=JSON_CALLBACK';

		console.log('this.huhu', this.huhu);

		this.$http.jsonp(url).success(data => {
			this.$scope.data = data;
		});
	}
}