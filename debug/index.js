if (process.env.NODE_ENV === 'development') {
	const { options } = require('preact');
	const oldVnodeOption = options.vnode;

	options.vnode = function(vnode) {
		const { nodeName, attributes, children } = vnode;

		if (nodeName === void 0) {
			throw new Error('Undefined component passed to preact.h()');
		}

		if (
			attributes && attributes.ref !== void 0 &&
			typeof attributes.ref !== 'function' &&
			!('$$typeof' in vnode)  // allow string refs when preact-compat is installed
		) {
			throw new Error(
				`Component's "ref" property should be a function,` +
				` but [${typeof attributes.ref}] passed`
			);
		}

		{
			const keys = {};

			inspectChildren(children, (deepChild) => {
				if (!deepChild) return;

				// In Preact, all keys are stored as object values, i.e. being strings
				const key = deepChild.key + '';

				if (keys.hasOwnProperty(key)) {
					/* eslint-disable no-console */
					console.error(
						'Following component has two or more children with the ' +
						'same "key" attribute. This may cause glitches and misbehavior ' +
						'in rendering process. Component: \n\n' +
						serializeVNode(vnode) + '\n\n'
					);

					// Return early to not spam the console
					return true;
				}

				keys[key] = true;
			});
		}

		if (oldVnodeOption) oldVnodeOption.call(this, vnode);
	};

	const inspectChildren = (children, inspect) => {
		return children.some((child, i) => {
			if (Array.isArray(child)) {
				return inspectChildren(child, inspect);
			}

			return inspect(child, i);
		});
	};

	const serializeVNode = ({ nodeName, attributes }) => {
		let name;
		let props;

		if (typeof nodeName === 'function') {
			name = nodeName.name || nodeName.displayName;
		} else {
			name = nodeName;
		}

		if (attributes) {
			props = Object.keys(attributes).map(attr => {
				const attrValue = attributes[attr];
				let attrValueString;

				// If it is an object but doesn't have toString(), use Object.toString
				if (Object(attrValue) === attrValue && !attrValue.toString) {
				  attrValueString = Object.prototype.toString.call(attrValue);
				} else {
				  attrValueString = attrValue + '';
				}

				return `${attr}=${JSON.stringify(attrValueString)}`;
			});
		}

		if (!props) {
			return `<${name} />`;
		}

		return `<${name} ${props.join(' ')} />`;
	};

	require('preact/devtools');
}
