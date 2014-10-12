import { Inject, InjectAsProperty, Directive, Scope } from './lib/annotations';

@Inject('$compile', '$http')
@InjectAsProperty('$scope', '$q')
@Directive('myDirective', {
	restrict: 'E',
	scope: true,
	require: '?^myDirective',
	template: '<div ng-click="showAlert()">{{text}}</div>'
})
export default class MyDirective {
	constructor ($compile, $http) {
		this.http = $http;
		this.compile = $compile;

		this.hihi = 'huhu';
	}

	link (scope, element, attributes, parentMyDirective) {
		this.$scope.text = attributes.text || 'none';

		this.showAlert();
	}

	@Scope
	showAlert () {
		console.log(this.hihi);
	}
}