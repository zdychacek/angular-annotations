import {
	Controller,
	Service,
	Factory,
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

function filterScopes (deps) {
	return deps.filter(dep => '$$watchers' in dep && dep.$parent != null);
}

export function getCtorForFunctionInjection (fn) {
	var parser = new Parser(fn);
	var annotations = parser.getAnnotations(Inject).reverse();
	var constructor = [];

	// merge all annotations
	for (var annotation of annotations) {
		constructor = constructor.concat(annotation.deps);
	}

	// make check if function is not annotated with InjectAsProperty
	if (parser.hasAnnotation(InjectAsProperty)) {
		throw new Error('Cannot annotate function with @InjectAsProperty.');
	}

	// there are no annotations - do not continue
	if (!annotations.length) {
		return false;
	}

	constructor.push((...deps) => fn(...deps));

	return constructor;
}

export function getCtorForClassInjection (controller) {
	var parser = new Parser(controller);
	var annotations = parser.getAnnotations(Inject).reverse();
	var constructor = [];

	for (var annotation of annotations) {
		constructor = constructor.concat(annotation.deps);
	}

	var injectsViaInjectCount = constructor.length;
	var injectAsProperty = parser.getAnnotations(InjectAsProperty);
	var propertyMap = new Map();
	
	// process @InjectAsProperty annotations
	for (var annotation of injectAsProperty) {
		annotation.deps.forEach(depName => {
			constructor.push(depName);
			propertyMap.set(depName, constructor.length - 1);
		});
	}

	if (!constructor.length) {
		return false;
	}

	constructor.push((...deps) => {
		var scopes = filterScopes(deps);
		var proto = controller.prototype;

		if (scopes.length > 1) {
			throw new Error(`You have injected $scope multiple times (count: ${scopes.length}) into '${controller}'.`);
		}

		// @InjectAsProperty
		for (var [ name, position ] of propertyMap.entries()) {
			proto[name] = deps[position];
		}

		// @Inject to constructor
		var args = deps.slice(0, injectsViaInjectCount);
		var ctrl = new controller(...args);

		var scope = scopes[0];

		// @Scope methods
		if (scope) {
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

export function registerFilter (module, filter) {
	var parser = new Parser(filter);
	var FilterAnnotation = parser.getAnnotations(Filter)[0];

	if (!FilterAnnotation) {
		throw new Error(`No Filter annotations on class ${filter}.`);
	}

	var constructor = getCtorForClassInjection(filter);

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

	var constructor = getCtorForClassInjection(controller);

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
	var ControllerAnnotation = parser.getAnnotations(Controller)[0];

	if (!ControllerAnnotation) {
		throw new Error(`No Controller annotation on ${controller}.`);
	}

	resolveModule(module).controller(ControllerAnnotation.name, getCtorForClassInjection(controller));
}

export function registerService (module, service) {
	var parser = new Parser(service);
	var ServiceAnnotation = parser.getAnnotations(Service)[0];

	if (!ServiceAnnotation) {
		throw new Error(`No Service annotation on ${service}.`);
	}

	resolveModule(module).service(ServiceAnnotation.name, getCtorForClassInjection(service));
}

export function registerFactory (module, factory) {
	var parser = new Parser(factory);
	var FactoryAnnotation = parser.getAnnotations(Factory)[0];

	if (!FactoryAnnotation) {
		throw new Error(`No Factory annotation on ${factory}.`);
	}

	resolveModule(module).factory(FactoryAnnotation.name, getCtorForFunctionInjection(factory));
}

function registerOne (module, controller) {
	var parser = new Parser(controller);

	if (parser.hasAnnotation(Directive)) {
		registerDirective(module, controller);
	}
	else if (parser.hasAnnotation(Controller)) {
		registerController(module, controller);
	}
	else if (parser.hasAnnotation(Service)) {
		registerService(module, controller);
	}
	else if (parser.hasAnnotation(Factory)) {
		registerFactory(module, controller);
	}
	else if (parser.hasAnnotation(Filter)) {
		registerFilter(module, controller);
	}
	else {
		throw new Error('Missing annotation.');
	}
}

export function register (module, controllers) {
	if (!Array.isArray(controllers)) {
		controllers = [ controllers ];
	}

	for (var ctrl of controllers) {
		registerOne(module, ctrl);
	}
}