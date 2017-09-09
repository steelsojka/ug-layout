/**
 * @typedef {Object} BaseModificationArgs
 * @property {boolean} [render] Whether to invoke the render cycle. This is useful for delaying the render cycle to a later time.
 */

/**
 * @typedef {BaseModificationArgs} RemoveChildArgs
 * @property {boolean} [destroy] Whether to destroy the child being removed.
 */

/**
 * @typedef {BaseModificationArgs} AddChildArgs
 * @property {number} [index] What index to add the child renderable to. If not provided then it will be pushed.
 * @property {boolean} [resize] Whether to invoke a resize of this renderable.
 */