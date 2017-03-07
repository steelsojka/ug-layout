/**
 * @typedef {Object} StackTabConfig
 * @property {number} maxSize The max size of the tab in pixels.
 * @property {string} title The title of the tab.
 */

/**
 * @typedef {Object} StackTabConfigArgs
 * @property {number} [maxSize] The max size of the tab in pixels.
 * @property {string} [title] The title of the tab.
 */

/**
 * @typedef {Object} StackConfig
 * @property {StackItemContainerConfig[]} children Stack item configurations.
 * @property {number} startIndex The starting index item.
 * @property {XYDirection} direction The direction of the Stack.
 * @property {boolean} reverse Display header on opposite side of the Stack.
 * @property {StackHeaderConfigArgs|null} header Stack header configuration.
 * @property {RenderableArg<StackControl>[]} controls List of Stack controls to use.
 */

/**
 * @typedef {Object} StackConfigArgs
 * @property {StackItemContainerConfig[]} children Stack item configurations.
 * @property {number} [startIndex=0] The starting index item.
 * @property {XYDirection} [direction=XYDirection.X] The direction of the Stack.
 * @property {boolean} [reverse=false] Display header on opposite side of the Stack.
 * @property {StackHeaderConfigArgs|null} [header=null] Stack header configuration.
 * @property {RenderableArg<StackControl>[]} [controls=[]] List of Stack controls to use.
 */

/**
 * @typedef {Object} StackItemContainerConfig
 * @property {RenderableArg<Renderable>} use The Renderable to use for this item.
 * @property {string} [title] The title of this item.
 * @property {boolean} [droppable=true] Whether the item can be dropped on.
 * @property {boolean} [draggable=true] Whether the item can be dragged.
 * @property {boolean} [closeable=true] Whether the item can be closed.
 * @property {RenderableArg<TabControl>[]} [tabControls=[]] List of TabControls to use.
 */
