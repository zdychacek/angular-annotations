export class Directive {
	constructor (name, options){
		this.name = name;
		this.options = options;
	}
}

export class Filter {
	constructor (name) {
		this.name = name;
	}
}

export class Controller {
	constructor (name) {
		this.name = name;
	}
}

export class Service {
	constructor (name, type = 'factory') {
		this.name = name;

		if (!['factory', 'service', 'provider', 'value', 'constant'].indexOf(type) < 0) {
			throw new Error(`Bad Service annotation type ${type}.`);
		}

		this.type = type;
	}
}

export class Inject {
	constructor (...deps){
		this.deps = [];

		for (var dep of deps) {
			this.deps = this.deps.concat(dep.replace(/\s+/g, '').split(','));
		}
	}
}

export class InjectAsProperty {
	constructor (...deps) {
		this.deps = [];

		for (var dep of deps) {
			this.deps = this.deps.concat(dep.replace(/\s+/g, '').split(','));
		}
	}
}

export class Scope {
	constructor () {}
}

/**
 * A annotation parser class which allows you to extract particular annotation type
 * of a class/function.
 *
 */
export class Parser {
	/**
	 *
	 * @param constructor the actual class or function
	 */
	constructor (constructor) {
		this.constructor = constructor;
	}

	getAllAnnotations () {
		return this.annotations || (this.annotations = this.extractAnnotations(this.constructor));
	}

	getAnnotations (annotationConstructor) {
		var annotations = this.getAllAnnotations();

		return annotations.filter(annotation => annotation instanceof annotationConstructor);
	}

	extractAnnotations (constructor) {
		var annotations = constructor.annotations || [];
		var parent = Object.getPrototypeOf(constructor);

		if (typeof parent === 'function') {
			annotations = annotations.concat(this.extractAnnotations(parent));
		}

		return annotations;
	}

	static get (constructor) {
		return new this(constructor);
	}
}