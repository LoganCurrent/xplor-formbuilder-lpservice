export var PAGE_LAYOUT_TEMPLATE_KEY = 'key-page-layout'
export var PAGE_LAYOUT_VERSION = 1

export var SYSTEM_TITLE = 'system.title'
export var SYSTEM_DESCRIPTION = 'system.description'
export var SYSTEM_PRICE = 'system.price'
export var SYSTEM_REMAINING = 'system.remaining'
export var SYSTEM_CHECKOUT = 'system.checkoutPackage'

export var CUSTOM_HEADING = 'heading'
export var CUSTOM_TEXT = 'text'
export var CUSTOM_IMAGE = 'image'
export var CUSTOM_BUTTON = 'button'
export var CUSTOM_DIVIDER = 'divider'
export var CUSTOM_COLUMNS = 'columns'

export var CUSTOM_BLOCK_TYPES = [
  CUSTOM_HEADING,
  CUSTOM_TEXT,
  CUSTOM_IMAGE,
  CUSTOM_BUTTON,
  CUSTOM_DIVIDER,
  CUSTOM_COLUMNS
]

var KNOWN_TYPES = {
  'system.title': true,
  'system.description': true,
  'system.price': true,
  'system.remaining': true,
  'system.checkoutPackage': true,
  heading: true,
  text: true,
  image: true,
  button: true,
  divider: true,
  columns: true
}

var CUSTOM_TYPES = {
  heading: true,
  text: true,
  image: true,
  button: true,
  divider: true,
  columns: true
}

var COLUMN_CHILD_TYPES = {
  'system.title': true,
  'system.description': true,
  'system.price': true,
  'system.remaining': true,
  'system.checkoutPackage': true,
  heading: true,
  text: true,
  image: true,
  button: true,
  divider: true
}

export function canDropInColumn (type) {
  return Boolean(type && KNOWN_TYPES[type] && type !== CUSTOM_COLUMNS)
}

export function isCustomBlockType (type) {
  return Boolean(CUSTOM_TYPES[type])
}

export function isLockedBlock (block) {
  if (!block) return true
  return Boolean(block.locked) || !isCustomBlockType(block.type)
}

export function createDefaultLayout () {
  return {
    version: PAGE_LAYOUT_VERSION,
    blocks: [
      { id: 'sys-title', type: SYSTEM_TITLE, locked: true },
      { id: 'sys-description', type: SYSTEM_DESCRIPTION, locked: true },
      { id: 'sys-price', type: SYSTEM_PRICE, locked: true },
      { id: 'sys-remaining', type: SYSTEM_REMAINING, locked: true },
      { id: 'sys-checkout', type: SYSTEM_CHECKOUT, locked: true }
    ]
  }
}

function cloneBlock (block) {
  return {
    id: block.id,
    type: block.type,
    locked: block.locked,
    props: block.props ? Object.assign({}, block.props) : {},
    columns: block.columns
      ? block.columns.map(function (column) {
        return column.map(cloneBlock)
      })
      : undefined
  }
}

function cloneLayout (layout) {
  return {
    version: layout.version || PAGE_LAYOUT_VERSION,
    blocks: (layout.blocks || []).map(cloneBlock)
  }
}

function columnCountFromProps (props) {
  return Number(props && props.count) === 3 ? 3 : 2
}

function normalizeColumnsBlock (block) {
  if (block.type !== CUSTOM_COLUMNS) {
    return cloneBlock(block)
  }
  var count = columnCountFromProps(block.props)
  var next = cloneBlock(block)
  var columns = next.columns ? next.columns.map(function (column) { return column.slice() }) : []
  while (columns.length < count) {
    columns.push([])
  }
  if (columns.length > count) {
    var extra = columns.splice(count)
    extra.forEach(function (column) {
      columns[count - 1] = columns[count - 1].concat(column)
    })
  }
  next.columns = columns
  next.props = Object.assign({}, next.props || {}, { count: count })
  return next
}

function parseBlock (item, allowColumns) {
  if (!item || !item.id || !item.type || !KNOWN_TYPES[item.type]) {
    return null
  }
  if (item.type === CUSTOM_COLUMNS && !allowColumns) {
    return null
  }
  var block = {
    id: String(item.id),
    type: item.type,
    locked: isLockedBlock(item),
    props: item.props && typeof item.props === 'object' ? item.props : {}
  }
  if (item.type === CUSTOM_COLUMNS) {
    return normalizeColumnsBlock(Object.assign({}, block, {
      columns: parseColumnLists(item.columns)
    }))
  }
  return block
}

function parseColumnLists (raw) {
  if (!Array.isArray(raw)) {
    return [[], []]
  }
  return raw.map(function (column) {
    if (!Array.isArray(column)) {
      return []
    }
    var blocks = []
    column.forEach(function (item) {
      var parsed = parseBlock(item, false)
      if (parsed && COLUMN_CHILD_TYPES[parsed.type]) {
        blocks.push(parsed)
      }
    })
    return blocks
  })
}

function hasBlockType (blocks, type) {
  for (var i = 0; i < (blocks || []).length; i++) {
    var block = blocks[i]
    if (block.type === type) {
      return true
    }
    if (block.columns) {
      for (var c = 0; c < block.columns.length; c++) {
        if (hasBlockType(block.columns[c], type)) {
          return true
        }
      }
    }
  }
  return false
}

export function ensureCheckoutPackageLast (layout) {
  var next = cloneLayout(layout)
  if (!hasBlockType(next.blocks, SYSTEM_CHECKOUT)) {
    next.blocks.push({ id: 'sys-checkout', type: SYSTEM_CHECKOUT, locked: true })
  }
  return next
}

export function defaultSpacingForType (type) {
  var marginBottom = 16
  if (type === SYSTEM_TITLE || type === CUSTOM_HEADING) marginBottom = 8
  else if (type === SYSTEM_DESCRIPTION || type === CUSTOM_TEXT) marginBottom = 24
  else if (type === SYSTEM_PRICE) marginBottom = 40
  else if (type === SYSTEM_CHECKOUT) marginBottom = 0
  else if (type === CUSTOM_COLUMNS) marginBottom = 16
  return {
    marginTop: type === CUSTOM_DIVIDER ? 16 : 0,
    marginRight: 0,
    marginBottom: marginBottom,
    marginLeft: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0
  }
}

export function spacingStyleFromBlock (block) {
  var defaults = defaultSpacingForType(block && block.type)
  var props = (block && block.props) || {}
  function px (key) {
    var value = props[key]
    if (value == null || value === '') return defaults[key]
    var parsed = Number(value)
    return isNaN(parsed) ? defaults[key] : parsed
  }
  return {
    marginTop: px('marginTop') + 'px',
    marginRight: px('marginRight') + 'px',
    marginBottom: px('marginBottom') + 'px',
    marginLeft: px('marginLeft') + 'px',
    paddingTop: px('paddingTop') + 'px',
    paddingRight: px('paddingRight') + 'px',
    paddingBottom: px('paddingBottom') + 'px',
    paddingLeft: px('paddingLeft') + 'px'
  }
}

export function parsePageLayout (raw) {
  if (raw == null || raw === '') {
    return null
  }
  var parsed = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch (error) {
      return null
    }
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.blocks) || parsed.blocks.length === 0) {
    return null
  }
  var blocks = []
  parsed.blocks.forEach(function (item) {
    var parsedBlock = parseBlock(item, true)
    if (parsedBlock) {
      blocks.push(parsedBlock)
    }
  })
  if (blocks.length === 0) {
    return null
  }
  return ensureCheckoutPackageLast({
    version: parsed.version || PAGE_LAYOUT_VERSION,
    blocks: blocks
  })
}

export function insertBlockAfter (layout, afterId, block) {
  var next = cloneLayout(layout)
  var insertAt = 0
  if (afterId != null) {
    var found = -1
    next.blocks.forEach(function (item, index) {
      if (item.id === afterId) found = index
    })
    insertAt = found + 1
  }
  next.blocks.splice(insertAt, 0, block)
  return ensureCheckoutPackageLast(next)
}

export function updateBlockProps (layout, blockId, props) {
  var next = cloneLayout(layout)
  next.blocks = next.blocks.map(function (block) {
    if (block.id !== blockId) {
      return block
    }
    return Object.assign({}, block, {
      props: Object.assign({}, block.props || {}, props)
    })
  })
  return next
}

export function removeBlock (layout, blockId) {
  var current = null
  layout.blocks.forEach(function (block) {
    if (block.id === blockId) current = block
  })
  if (!current || isLockedBlock(current)) {
    return cloneLayout(layout)
  }
  var next = cloneLayout(layout)
  next.blocks = next.blocks.filter(function (block) {
    return block.id !== blockId
  })
  return ensureCheckoutPackageLast(next)
}

export function moveBlockAfter (layout, blockId, afterId) {
  var current = null
  layout.blocks.forEach(function (block) {
    if (block.id === blockId) current = block
  })
  if (!current || afterId === blockId) {
    return cloneLayout(layout)
  }
  var without = cloneLayout(layout)
  without.blocks = without.blocks.filter(function (block) {
    return block.id !== blockId
  })
  var afterExists = afterId == null
  without.blocks.forEach(function (block) {
    if (block.id === afterId) afterExists = true
  })
  return insertBlockAfter(without, afterExists ? afterId : null, current)
}
