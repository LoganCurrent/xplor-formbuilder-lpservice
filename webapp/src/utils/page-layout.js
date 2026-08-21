export var PAGE_LAYOUT_TEMPLATE_KEY = 'key-page-layout'
export var PAGE_LAYOUT_VERSION = 2
export var CHECKOUT_CARD_ID = 'sys-checkout-card'
export var PAGE_SECTION_ID = 'sys-page-section'

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
export var CUSTOM_CARD = 'card'
export var CUSTOM_SECTION = 'section'

export var CUSTOM_BLOCK_TYPES = [
  CUSTOM_HEADING,
  CUSTOM_TEXT,
  CUSTOM_IMAGE,
  CUSTOM_BUTTON,
  CUSTOM_DIVIDER,
  CUSTOM_COLUMNS,
  CUSTOM_CARD,
  CUSTOM_SECTION
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
  columns: true,
  card: true,
  section: true
}

var CUSTOM_TYPES = {
  heading: true,
  text: true,
  image: true,
  button: true,
  divider: true,
  columns: true,
  card: true,
  section: true
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
  return Boolean(type && KNOWN_TYPES[type] && type !== CUSTOM_COLUMNS && type !== CUSTOM_CARD && type !== CUSTOM_SECTION)
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
      {
        id: PAGE_SECTION_ID,
        type: CUSTOM_SECTION,
        locked: true,
        props: {
          width: 100,
          minHeight: 400,
          backgroundColor: '#d6ebec',
          backgroundImage: '',
          backgroundPosition: 'center center'
        },
        children: [
          {
            id: CHECKOUT_CARD_ID,
            type: CUSTOM_CARD,
            locked: true,
            props: {
              backgroundColor: '#ffffff',
              paddingTop: 20,
              paddingRight: 20,
              paddingBottom: 0,
              paddingLeft: 20,
              width: 60,
              minHeight: 50,
              borderRadius: 0,
              align: 'center',
              verticalAlign: 'middle',
              contentAlign: 'top'
            },
            children: [
              { id: 'sys-title', type: SYSTEM_TITLE, locked: true },
              { id: 'sys-description', type: SYSTEM_DESCRIPTION, locked: true },
              { id: 'sys-price', type: SYSTEM_PRICE, locked: true },
              { id: 'sys-remaining', type: SYSTEM_REMAINING, locked: true },
              { id: 'sys-checkout', type: SYSTEM_CHECKOUT, locked: true }
            ]
          }
        ]
      }
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
      : undefined,
    children: block.children ? block.children.map(cloneBlock) : undefined
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

function defaultContainerProps (type) {
  if (type === CUSTOM_CARD) {
    return {
      backgroundColor: '#ffffff',
      paddingTop: 20,
      paddingRight: 20,
      paddingBottom: 0,
      paddingLeft: 20,
      width: 60,
      minHeight: 50,
      borderRadius: 0,
      align: 'center',
      verticalAlign: 'middle',
      contentAlign: 'top'
    }
  }
  if (type === CUSTOM_SECTION) {
    return {
      width: 100,
      minHeight: 400,
      backgroundColor: '#d6ebec',
      backgroundImage: '',
      backgroundPosition: 'center center'
    }
  }
  return {}
}

function parseBlock (item, allowColumns) {
  if (!item || !item.id || !item.type || !KNOWN_TYPES[item.type]) {
    return null
  }
  if (item.type === CUSTOM_COLUMNS && !allowColumns) {
    return null
  }
  if ((item.type === CUSTOM_CARD || item.type === CUSTOM_SECTION) && !allowColumns) {
    return null
  }
  var locked = item.id === CHECKOUT_CARD_ID ? true : isLockedBlock(item)
  var block = {
    id: String(item.id),
    type: item.type,
    locked: locked,
    props: Object.assign({}, defaultContainerProps(item.type), item.props && typeof item.props === 'object' ? item.props : {})
  }
  if (item.type === CUSTOM_COLUMNS) {
    return normalizeColumnsBlock(Object.assign({}, block, {
      columns: parseColumnLists(item.columns)
    }))
  }
  if (item.type === CUSTOM_CARD) {
    block.children = parseCardChildren(item.children)
    return block
  }
  if (item.type === CUSTOM_SECTION) {
    block.children = parseSectionChildren(item.children)
    if ((block.children || []).some(function (child) {
      return child.type === CUSTOM_CARD && child.id === CHECKOUT_CARD_ID
    })) {
      block.locked = true
    }
    return block
  }
  return block
}

function parseCardChildren (raw) {
  if (!Array.isArray(raw)) return []
  var blocks = []
  raw.forEach(function (item) {
    var parsed = parseBlock(item, true)
    if (parsed && parsed.type !== CUSTOM_CARD && parsed.type !== CUSTOM_SECTION) {
      blocks.push(parsed)
    }
  })
  return blocks
}

function parseSectionChildren (raw) {
  if (!Array.isArray(raw)) return []
  var blocks = []
  raw.forEach(function (item) {
    var parsed = parseBlock(item, true)
    if (parsed && parsed.type === CUSTOM_CARD) {
      blocks.push(parsed)
    }
  })
  return blocks
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
    if (block.children && hasBlockType(block.children, type)) {
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

function findBlockIn (blocks, blockId) {
  for (var i = 0; i < (blocks || []).length; i++) {
    var block = blocks[i]
    if (block.id === blockId) return block
    if (block.children) {
      var nested = findBlockIn(block.children, blockId)
      if (nested) return nested
    }
    if (block.columns) {
      for (var c = 0; c < block.columns.length; c++) {
        var found = findBlockIn(block.columns[c], blockId)
        if (found) return found
      }
    }
  }
  return null
}

export function findBlock (layout, blockId) {
  if (!layout || !blockId) return null
  return findBlockIn(layout.blocks, blockId)
}

function findCheckoutCardIn (blocks) {
  for (var i = 0; i < (blocks || []).length; i++) {
    var block = blocks[i]
    if (block.type === CUSTOM_CARD && block.id === CHECKOUT_CARD_ID) {
      return block
    }
    if (block.type === CUSTOM_SECTION && block.children) {
      var nested = findCheckoutCardIn(block.children)
      if (nested) return nested
    }
  }
  return null
}

export function findCheckoutCard (layout) {
  return findCheckoutCardIn(layout && layout.blocks)
}

export function checkoutChildren (layout) {
  var card = findCheckoutCard(layout)
  return (card && card.children) || []
}

function createCheckoutCard (children) {
  return {
    id: CHECKOUT_CARD_ID,
    type: CUSTOM_CARD,
    locked: true,
    props: defaultContainerProps(CUSTOM_CARD),
    children: (children || []).map(cloneBlock)
  }
}

function wrapTopLevelCheckoutInSection (blocks) {
  if (findCheckoutCardIn(blocks) && !blocks.some(function (block) {
    return block.type === CUSTOM_CARD && block.id === CHECKOUT_CARD_ID
  })) {
    return blocks
  }
  var index = -1
  for (var i = 0; i < blocks.length; i++) {
    if (blocks[i].type === CUSTOM_CARD && blocks[i].id === CHECKOUT_CARD_ID) {
      index = i
      break
    }
  }
  if (index < 0) return blocks
  var next = blocks.slice()
  next[index] = {
    id: PAGE_SECTION_ID,
    type: CUSTOM_SECTION,
    locked: false,
    props: defaultContainerProps(CUSTOM_SECTION),
    children: [next[index]]
  }
  return next
}

function wrapLegacyPageBlocks (blocks) {
  var hasContainer = blocks.some(function (block) {
    return block.type === CUSTOM_CARD || block.type === CUSTOM_SECTION
  })
  if (!hasContainer) {
    return wrapTopLevelCheckoutInSection([createCheckoutCard(blocks)])
  }
  if (findCheckoutCardIn(blocks)) {
    return wrapTopLevelCheckoutInSection(blocks)
  }
  var loose = []
  var pageItems = []
  blocks.forEach(function (block) {
    if (block.type === CUSTOM_SECTION || block.type === CUSTOM_CARD) {
      pageItems.push(block)
    } else {
      loose.push(block)
    }
  })
  return wrapTopLevelCheckoutInSection([createCheckoutCard(loose)].concat(pageItems))
}

export var MIN_SECTION_WIDTH = 20
export var MIN_CARD_WIDTH = 20
export var CARD_PAIR_WIDTH = 47
export var CARD_GUTTER_PERCENT = 2
export var PAIRED_CARD_SHARE_PERCENT = 100 - CARD_GUTTER_PERCENT * 3
export var MIN_CARD_HEIGHT = 64
export var DEFAULT_SECTION_HEIGHT = 400
export var MIN_SECTION_HEIGHT = 120

export function sectionWidth (block) {
  var value = Number(block && block.props && block.props.width)
  if (!isFinite(value) || value <= 0) return 100
  return Math.min(100, Math.max(MIN_SECTION_WIDTH, value))
}

export function sectionMinHeight (block) {
  var value = Number(block && block.props && block.props.minHeight)
  if (!isFinite(value) || value <= 0) return DEFAULT_SECTION_HEIGHT
  return Math.max(MIN_SECTION_HEIGHT, value)
}

export function pageLayoutRows (blocks) {
  var rows = []
  var index = 0
  var list = blocks || []
  while (index < list.length) {
    var block = list[index]
    if (block.type !== CUSTOM_SECTION) {
      rows.push([block])
      index += 1
      continue
    }
    var items = []
    var width = 0
    while (index < list.length && list[index].type === CUSTOM_SECTION) {
      var nextWidth = sectionWidth(list[index])
      if (items.length && width + nextWidth > 100.01) break
      items.push(list[index])
      width += nextWidth
      index += 1
      if (width >= 99.99 || items.length >= 2) break
    }
    rows.push(items)
  }
  return rows
}

export function sectionBackgroundStyle (block) {
  var style = {}
  var props = (block && block.props) || {}
  if (props.backgroundColor) {
    style.backgroundColor = String(props.backgroundColor)
  }
  if (props.backgroundImage) {
    style.backgroundImage = 'url(' + props.backgroundImage + ')'
    style.backgroundSize = 'cover'
    style.backgroundRepeat = 'no-repeat'
    style.backgroundPosition = String(props.backgroundPosition || 'center center')
  }
  return style
}

export function cardWidthPercent (block) {
  var value = Number(block && block.props && block.props.width)
  if (!isFinite(value) || value <= 0) {
    return 100
  }
  return Math.min(100, Math.max(MIN_CARD_WIDTH, value))
}

export function contentWidthPercent (block, fallback) {
  if (fallback == null) fallback = 100
  var value = Number(block && block.props && block.props.width)
  if (!isFinite(value) || value <= 0) return fallback
  return Math.min(100, Math.max(1, value))
}

export function checkoutCtaSizeStyle (block) {
  return contentSizeStyle(block)
}

export function contentSizeStyle (block) {
  var align = block && block.props && block.props.align
  var style = {
    width: contentWidthPercent(block) + '%',
    maxWidth: '100%',
    display: 'block',
    boxSizing: 'border-box'
  }
  if (align === 'left') {
    style.marginLeft = '0'
    style.marginRight = 'auto'
  } else if (align === 'right') {
    style.marginLeft = 'auto'
    style.marginRight = '0'
  } else {
    style.marginLeft = 'auto'
    style.marginRight = 'auto'
  }
  var minHeight = Number(block && block.props && block.props.minHeight)
  if (isFinite(minHeight) && minHeight > 0) {
    style.minHeight = Math.round(minHeight) + 'px'
  }
  return style
}

export function cardAlign (block) {
  var align = block && block.props && block.props.align
  if (align === 'left' || align === 'right') {
    return align
  }
  return 'center'
}

export function cardVerticalAlign (block) {
  var align = block && block.props && block.props.verticalAlign
  if (align === 'middle' || align === 'bottom' || align === 'stretch') {
    return align
  }
  return 'top'
}

export function cardContentAlign (block) {
  var align = block && block.props && block.props.contentAlign
  if (align === 'center' || align === 'bottom') {
    return align
  }
  return 'top'
}

export function isPinnedToBottom (block) {
  if (!block) return false
  if (block.type === SYSTEM_CHECKOUT) return true
  return Boolean(block.props && block.props.pinToBottom)
}

export function isPinGroupStart (children, blockId) {
  var list = children || []
  for (var i = 0; i < list.length; i++) {
    if (isPinnedToBottom(list[i])) {
      return list[i].id === blockId
    }
  }
  return false
}

export function cardMinHeight (block) {
  var value = Number(block && block.props && block.props.minHeight)
  if (!isFinite(value) || value <= 0) {
    return 0
  }
  return value
}

export function cardMinHeightCss (block) {
  var value = cardMinHeight(block)
  if (value <= 0) return null
  if (value > 100) return Math.round(value) + 'px'
  return Math.round(value) + '%'
}

export function sectionCardRows (cards) {
  var list = cards || []
  var rows = []
  var index = 0
  while (index < list.length) {
    var items = []
    var width = 0
    while (index < list.length) {
      var nextWidth = cardWidthPercent(list[index])
      if (items.length && width + nextWidth > 100.01) break
      items.push(list[index])
      width += nextWidth
      index += 1
      if (width >= 99.99 || items.length >= 2) break
    }
    rows.push(items)
  }
  return rows
}

export function isCardPairedInSection (cards, cardId) {
  var row = sectionCardRows(cards).find(function (items) {
    return items.some(function (item) { return item.id === cardId })
  })
  return Boolean(row && row.length > 1)
}

export function isCardLastInRow (cards, cardId) {
  var row = sectionCardRows(cards).find(function (items) {
    return items.some(function (item) { return item.id === cardId })
  })
  return Boolean(row && row.length > 1 && row[row.length - 1].id === cardId)
}

export function cardRowAlign (cards, cardId) {
  var row = sectionCardRows(cards).find(function (items) {
    return items.some(function (item) { return item.id === cardId })
  })
  return cardAlign(row && row[0])
}

export function cardChromeStyle (block, options) {
  var props = (block && block.props) || {}
  var defaults = defaultContainerProps(CUSTOM_CARD)
  var align = cardAlign(block)
  var verticalAlign = cardVerticalAlign(block)
  var contentAlign = cardContentAlign(block)
  var paired = Boolean(options && options.paired)
  var percent = cardWidthPercent(block)
  var size = percent + '%'
  function numberOr (key, fallback) {
    var value = Number(props[key])
    return isFinite(value) ? value : fallback
  }
  var style = {
    backgroundColor: String(props.backgroundColor || defaults.backgroundColor),
    paddingTop: numberOr('paddingTop', defaults.paddingTop) + 'px',
    paddingRight: numberOr('paddingRight', defaults.paddingRight) + 'px',
    paddingBottom: numberOr('paddingBottom', defaults.paddingBottom) + 'px',
    paddingLeft: numberOr('paddingLeft', defaults.paddingLeft) + 'px',
    '--card-pad-top': numberOr('paddingTop', defaults.paddingTop) + 'px',
    '--card-pad-right': numberOr('paddingRight', defaults.paddingRight) + 'px',
    '--card-pad-bottom': numberOr('paddingBottom', defaults.paddingBottom) + 'px',
    '--card-pad-left': numberOr('paddingLeft', defaults.paddingLeft) + 'px',
    width: size,
    maxWidth: '100%',
    flex: paired ? '0 1 ' + size : '0 0 ' + size,
    borderRadius: numberOr('borderRadius', defaults.borderRadius || 0) + 'px',
    '--card-radius': numberOr('borderRadius', defaults.borderRadius || 0) + 'px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: contentAlign === 'center' ? 'center' : contentAlign === 'bottom' ? 'flex-end' : 'flex-start',
    alignSelf: verticalAlign === 'stretch' ? 'stretch' : verticalAlign === 'middle' ? 'center' : verticalAlign === 'bottom' ? 'flex-end' : 'flex-start'
  }
  if (paired) {
    var rowAlign = (options && options.rowAlign) || 'center'
    var gutter = CARD_GUTTER_PERCENT
    if (options && options.lastInRow) {
      style.marginLeft = gutter + '%'
      style.marginRight = rowAlign === 'left' ? (gutter * 2) + '%' : rowAlign === 'right' ? '0' : gutter + '%'
    } else {
      style.marginLeft = rowAlign === 'left' ? '0' : rowAlign === 'right' ? (gutter * 2) + '%' : gutter + '%'
      style.marginRight = '0'
    }
  } else if (align === 'left') {
    style.marginLeft = '0'
    style.marginRight = 'auto'
  } else if (align === 'right') {
    style.marginLeft = 'auto'
    style.marginRight = '0'
  } else {
    style.marginLeft = 'auto'
    style.marginRight = 'auto'
  }
  var minHeight = cardMinHeightCss(block)
  if (minHeight) {
    style.minHeight = minHeight
  }
  return style
}

function pinCheckoutInList (list) {
  if (!list || !list.length) return
  var index = -1
  for (var i = 0; i < list.length; i++) {
    if (list[i].type === SYSTEM_CHECKOUT) {
      index = i
      break
    }
  }
  if (index >= 0 && index < list.length - 1) {
    list.push(list.splice(index, 1)[0])
  }
}

function pinCheckoutPackageInCards (layout) {
  function visit (block) {
    if (!block) return
    if (block.children) {
      pinCheckoutInList(block.children)
      block.children.forEach(visit)
    }
    if (block.columns) {
      block.columns.forEach(function (column) {
        pinCheckoutInList(column)
        if (column) column.forEach(visit)
      })
    }
  }
  if (layout && layout.blocks) {
    layout.blocks.forEach(visit)
  }
}

export function ensureCheckoutPackageLast (layout) {
  var next = cloneLayout(layout)
  next.blocks = wrapLegacyPageBlocks(next.blocks)
  if (!hasBlockType(next.blocks, SYSTEM_CHECKOUT)) {
    var card = findCheckoutCard(next)
    if (!card) {
      card = createCheckoutCard([])
      next.blocks.unshift(card)
    }
    if (!card.children) card.children = []
    card.children.push({ id: 'sys-checkout', type: SYSTEM_CHECKOUT, locked: true })
  }
  pinCheckoutPackageInCards(next)
  return next
}

export function usesButtonPadding (type) {
  return type === CUSTOM_BUTTON || type === SYSTEM_CHECKOUT
}

export function defaultSpacingForType (type) {
  var isButton = usesButtonPadding(type)
  return {
    marginTop: type === CUSTOM_DIVIDER ? 16 : 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    paddingTop: isButton ? 12 : 0,
    paddingRight: isButton ? 20 : 0,
    paddingBottom: isButton ? 12 : 0,
    paddingLeft: isButton ? 20 : 0
  }
}

export function spacingStyleFromBlock (block) {
  return styleFromSpacingKeys(block, ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'])
}

export function paddingStyleFromBlock (block) {
  return styleFromSpacingKeys(block, ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'])
}

function styleFromSpacingKeys (block, keys) {
  var defaults = defaultSpacingForType(block && block.type)
  var props = (block && block.props) || {}
  function px (key) {
    var value = props[key]
    if (value == null || value === '') return defaults[key]
    var parsed = Number(value)
    return isNaN(parsed) ? defaults[key] : parsed
  }
  var style = {}
  keys.forEach(function (key) {
    style[key] = px(key) + 'px'
  })
  return style
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
    blocks: wrapLegacyPageBlocks(blocks)
  })
}

export function insertBlockAfter (layout, afterId, block) {
  var next = cloneLayout(layout)
  function insertIn (list) {
    var insertAt = 0
    if (afterId != null) {
      var found = -1
      list.forEach(function (item, index) {
        if (item.id === afterId) found = index
      })
      if (found >= 0) {
        list.splice(found + 1, 0, block)
        return true
      }
    }
    return false
  }
  if (afterId != null) {
    if (insertIn(next.blocks)) {
      return ensureCheckoutPackageLast(next)
    }
    var card = findCheckoutCard(next)
    if (card && card.children && insertIn(card.children)) {
      return ensureCheckoutPackageLast(next)
    }
  }
  var checkout = findCheckoutCard(next)
  if (checkout) {
    if (!checkout.children) checkout.children = []
    var insertAt = 0
    if (afterId != null) {
      insertAt = checkout.children.length
    }
    checkout.children.splice(insertAt, 0, block)
    return ensureCheckoutPackageLast(next)
  }
  next.blocks.splice(0, 0, block)
  return ensureCheckoutPackageLast(next)
}

export function updateBlockProps (layout, blockId, props) {
  var next = cloneLayout(layout)
  function apply (block) {
    if (block.id === blockId) {
      return Object.assign({}, block, {
        props: Object.assign({}, block.props || {}, props)
      })
    }
    return Object.assign({}, block, {
      children: block.children ? block.children.map(apply) : undefined,
      columns: block.columns ? block.columns.map(function (column) { return column.map(apply) }) : undefined
    })
  }
  next.blocks = next.blocks.map(apply)
  return next
}

export function removeBlock (layout, blockId) {
  var current = findBlock(layout, blockId)
  if (!current || isLockedBlock(current)) {
    return cloneLayout(layout)
  }
  if (current.type === CUSTOM_SECTION) {
    var hasCheckout = (current.children || []).some(function (child) {
      return child.type === CUSTOM_CARD && child.id === CHECKOUT_CARD_ID
    })
    if (hasCheckout) {
      return cloneLayout(layout)
    }
  }
  var next = cloneLayout(layout)
  function without (blocks) {
    return (blocks || []).reduce(function (acc, block) {
      if (block.id === blockId) {
        return acc
      }
      acc.push(Object.assign({}, block, {
        children: block.children ? without(block.children) : undefined,
        columns: block.columns
          ? block.columns.map(function (column) { return without(column) })
          : undefined
      }))
      return acc
    }, [])
  }
  next.blocks = without(next.blocks)
  return ensureCheckoutPackageLast(next)
}

export function moveBlockAfter (layout, blockId, afterId) {
  var current = findBlock(layout, blockId)
  if (!current || afterId === blockId) {
    return cloneLayout(layout)
  }
  var without = cloneLayout(layout)
  function strip (blocks) {
    return (blocks || []).reduce(function (acc, block) {
      if (block.id === blockId) {
        return acc
      }
      acc.push(Object.assign({}, block, {
        children: block.children ? strip(block.children) : undefined,
        columns: block.columns
          ? block.columns.map(function (column) { return strip(column) })
          : undefined
      }))
      return acc
    }, [])
  }
  without.blocks = strip(without.blocks)
  return insertBlockAfter(without, afterId, current)
}

var ALLOWED_INLINE_TAGS = {
  B: true,
  STRONG: true,
  I: true,
  EM: true,
  U: true,
  S: true,
  STRIKE: true,
  DEL: true,
  BR: true
}

export function sanitizeInlineHtml (html) {
  var raw = html == null ? '' : String(html)
  if (!raw) {
    return ''
  }
  if (typeof document === 'undefined' || !document.createElement) {
    return raw.replace(/<(?!\/?(?:b|strong|i|em|u|s|strike|del|br)\b)[^>]*>/gi, '')
  }
  var template = document.createElement('template')
  template.innerHTML = raw
  function walk (node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        return
      }
      if (child.nodeType !== 1) {
        node.removeChild(child)
        return
      }
      if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE') {
        node.removeChild(child)
        return
      }
      if (!ALLOWED_INLINE_TAGS[child.tagName]) {
        while (child.firstChild) {
          node.insertBefore(child.firstChild, child)
        }
        node.removeChild(child)
        walk(node)
        return
      }
      while (child.attributes && child.attributes.length) {
        child.removeAttribute(child.attributes[0].name)
      }
      walk(child)
    })
  }
  walk(template.content)
  return template.innerHTML
}
