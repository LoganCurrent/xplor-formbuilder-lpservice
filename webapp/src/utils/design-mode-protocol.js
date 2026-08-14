export var LP_EDITOR_SOURCE = 'brandbot-lp-editor'
export var LP_RUNTIME_SOURCE = 'brandbot-lp-runtime'
export var DESIGN_MODE_WINDOW_FLAG = '__BRANDBOT_DESIGN_MODE__'

export function isEditorMessage (data) {
  return Boolean(data && typeof data === 'object' && data.source === LP_EDITOR_SOURCE)
}

export function runtimeMessage (type, extra) {
  var message = Object.assign({
    source: LP_RUNTIME_SOURCE,
    type: type
  }, extra || {})
  return message
}

export function postToParent (type, extra) {
  if (typeof window === 'undefined' || window.parent === window) {
    return
  }
  window.parent.postMessage(runtimeMessage(type, extra), '*')
}

export function isDesignModeFlagSet () {
  if (typeof window === 'undefined') {
    return false
  }
  return window[DESIGN_MODE_WINDOW_FLAG] === true
}
