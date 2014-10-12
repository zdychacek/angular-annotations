import {
	Controller,
	Service,
	Filter,
	Parser,
	Scope,
	Directive,
	Inject,
	InjectAsProperty 
} from './annotations';

function resolveModule (module) {
	if (typeof module === 'string') {
		return angular.module(module);
	}
	else {
		return module;
	}
}

function isUpperCase (char) {
	return char.toUpperCase() === char;
}

function isClass (clsOrFunction) {
	if (clsOrFunction.name) {
		return isUpperCase(clsOrFunction.name.charAt(0));
	}

	return Object.keys(clsOrFunction.prototype).length > 0;
}

function getOverwrittenConstructor (controller) {
	var constructor = getInjectedConstructor(controller);
	var diFunction = constructor[constructor.length - 1];
	var overwrittenConstructor = constructor;

	overwrittenConstructor[overwrittenConstructor.length - 1] = function (...deps) {
		return diFunction(...deps);
	};

	return overwrittenConstructor;
}

export function getInjectedConstructor (controller) {
	var parser = new Parser(controller);
	var annotations = parser.getAnnotations(Inject).reverse();
	var $inject = [];
	var isFn = !isClass(controller);

	for (var annotation of annotations) {
		$inject = $inject.concat(annotation.deps);
	}

	var injectsViaInjectCount = $inject.length;
	var injectAsProperty = parser.getAnnotations(InjectAsProperty);

	if (injectAsProperty.length && isFn) {
		throw new Error('Cannot annotate function with @InjectAsProperty.');
	}

	var propertyMap = new Map();
	
	// if is class, process @InjectAsProperty annotations
	if (!isFn) {	
		for (var annotation of injectAsProperty) {
			annotation.deps.forEach(depName => {
				$inject.push(depName);
				propertyMap.set(depName, $inject.length - 1);
			});
		}
	}

	if (!injectAsProperty.length && !annotations.length) {
		return false;
	}

	var constructor = $inject;

	constructor.push((...deps) => {
		var scopes = deps.filter(dep => '$$watchers' in dep && dep.$parent != null);
		var proto = controller.prototype;

		if (scopes.length > 1) {
			throw new Error(`You have injected $scope multiple times (count: ${scopes.length}) into '${controller}'.`);
		}

		// if is class
		if (!isFn) {
			// @InjectAsProperty
			for (var [ name, position ] of propertyMap.entries()) {
				proto[name] = deps[position];
			}
		}

		// @Inject to constructor
		var args = deps.slice(0, injectsViaInjectCount);
		var ctrl = null;

		if (isFn) {
			ctrl = controller(...args);
		}
		else {
			ctrl = new controller(...args);
		}

		var scope = scopes[0];

		// @Scope methods
		if (!isFn && scope) {
			for (var methodName in proto) {
				var method = proto[methodName];

				if (angular.isFunction(method)) {
					if (Array.isArray(method.annotations)) {
						var scopeMethodAnnotation = Parser.get(method).getAnnotations(Scope);

						if (scopeMethodAnnotation.length) {
							scope[methodName] = method.bind(ctrl);
						}
					}
				}
			}

			// register destructor method if exists - scope.on('destroy')
			if (angular.isFunction(proto.destructor)) {
				scope.$on('$destroy', proto.destructor.bind(ctrl));
			}
		}

		return ctrl;
	});

	return constructor;
}

/**
 * Registers a new angular filter.
 *
 * @param  module created with angular.module()
 * @param  {Function} filter
 */
export function registerFilter (module, filter) {
	var parser = new Parser(filter);
	var annotations = parser.getAnnotations(Filter);
	var FilterAnnotation = annotations[0];

	if (!FilterAnnotation) {
		throw new Error(`No Filter annotations on class ${filter}.`);
	}

	var constructor = getInjectedConstructor(filter);

	if (!constructor) {
		constructor = function () {
			var instance = new filter();

			return instance.filter;
		};

		resolveModule(module).filter(FilterAnnotation.name, constructor);
	}
	else {
		var diFunction = constructor[constructor.length - 1];
		var overwrittenConstructor = constructor;

		overwrittenConstructor[overwrittenConstructor.length - 1] = function (...deps) {
			var instance = diFunction(...deps);

			return instance.filter.bind(instance);
		};

		resolveModule(module).filter(FilterAnnotation.name, overwrittenConstructor);
	}
}

export function registerDirective (module, controller) {
	var parser = new Parser(controller);
	var annotations = parser.getAnnotations(Directive);
	var DirectiveAnnotation = annotations[0];

	if (!DirectiveAnnotation) {
		throw new Error(`No Directive annotation on class ${controller}.`);
	}

	var constructor = getInjectedConstructor(controller);

	if (!constructor) constructor = controller;

	var definition = DirectiveAnnotation.options || {};

	if (!definition.controller) {
		definition.controller = constructor;
	}

	if (!definition.link) {
		if (angular.isString(definition.require)) {
			definition.require = [ definition.require ];
		}

		if (Array.isArray(definition.require) && DirectiveAnnotation.name !== definition.require[0]) {
			definition.require.unshift(DirectiveAnnotation.name);
		}

		definition.link = function(scope, element, attr, ctrl, transclude) {
			var ownController, controllersToPass;

			if (Array.isArray(ctrl)) {
				ownController = ctrl.shift();
			}
			else {
				ownController = ctrl;
			}

			if (Array.isArray(ctrl) && 1 === ctrl.length) {
				ctrl = ctrl[0];
			}

			if (ownController && ownController.link) {
				ownController.link.apply(ownController, [scope, element, attr, ctrl, transclude]);
			}
		};
	}

	var options = angular.isFunction(definition) || Array.isArray(definition)
		? definition
		: function () { return definition; };


	resolveModule(module).directive(DirectiveAnnotation.name, options);
}

export function registerController (module, controller) {
	var parser = new Parser(controller);
	var annotations = parser.getAnnotations(Controller);
	var ControllerAnnotation = annotations[0];

	if (!ControllerAnnotation) {
		throw new Error(`No Controller annotation on class ${controller}.`);
	}

	resolveModule(module).controller(ControllerAnnotation.name, getOverwrittenConstructor(controller));
}

export function registerService (module, service) {
	var parser = new Parser(service);
	var annotations = parser.getAnnotations(Service);
	var ServiceAnnotation = annotations[0];

	if (!ServiceAnnotation) {
		throw new Error(`No Service annotation on class ${service}.`);
	}

	resolveModule(module).service(ServiceAnnotation.name, getOverwrittenConstructor(service));
}