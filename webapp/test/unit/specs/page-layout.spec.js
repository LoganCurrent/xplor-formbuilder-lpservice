import {
  parsePageLayout,
  ensureCheckoutPackageLast,
  insertBlockAfter,
  removeBlock,
  moveBlockAfter,
  createDefaultLayout,
  spacingStyleFromBlock,
  paddingStyleFromBlock,
  canDropInColumn,
  checkoutChildren,
  findBlock,
  cardChromeStyle,
  isPinGroupStart,
  isPinnedToBottom,
  SYSTEM_CHECKOUT,
  SYSTEM_TITLE,
  sanitizeInlineHtml
} from '@/utils/page-layout'

describe('page-layout', () => {
  it('returns null for missing or empty layout', () => {
    expect(parsePageLayout(null)).toBe(null)
    expect(parsePageLayout('')).toBe(null)
    expect(parsePageLayout('{"version":1,"blocks":[]}')).toBe(null)
    expect(parsePageLayout('not-json')).toBe(null)
  })

  it('parses a valid layout string and preserves block order', () => {
    const raw = JSON.stringify({
      version: 1,
      blocks: [
        { id: 'sys-checkout', type: SYSTEM_CHECKOUT, locked: true },
        { id: 'sys-title', type: SYSTEM_TITLE, locked: true },
        { id: 'b1', type: 'heading', props: { text: 'Hello' } }
      ]
    })
    const layout = parsePageLayout(raw)
    const children = checkoutChildren(layout)
    expect(children[0].type).toBe(SYSTEM_TITLE)
    expect(children.some((b) => b.type === 'heading')).toBe(true)
    expect(children[children.length - 1].type).toBe(SYSTEM_CHECKOUT)
  })

  it('ignores unknown block types', () => {
    const layout = parsePageLayout({
      version: 1,
      blocks: [
        { id: 'sys-title', type: SYSTEM_TITLE, locked: true },
        { id: 'x', type: 'hero', props: {} },
        { id: 'sys-checkout', type: SYSTEM_CHECKOUT, locked: true }
      ]
    })
    expect(checkoutChildren(layout).map((b) => b.type)).toEqual([SYSTEM_TITLE, SYSTEM_CHECKOUT])
  })

  it('inserts a heading after the title and keeps checkout last', () => {
    const heading = { id: 'b1', type: 'heading', locked: false, props: { text: 'Hi' } }
    const layout = insertBlockAfter(createDefaultLayout(), 'sys-title', heading)
    const children = checkoutChildren(layout)
    expect(children[1].id).toBe('b1')
    expect(children[children.length - 1].type).toBe(SYSTEM_CHECKOUT)
  })

  it('does not remove locked system blocks', () => {
    const layout = removeBlock(createDefaultLayout(), 'sys-title')
    expect(findBlock(layout, 'sys-title')).toBeTruthy()
  })

  it('moves locked system blocks but keeps Buy now + footer last', () => {
    const original = createDefaultLayout()
    const moved = moveBlockAfter(original, 'sys-checkout', null)
    const children = checkoutChildren(moved)
    expect(children[children.length - 1].type).toBe(SYSTEM_CHECKOUT)
    expect(children[0].type).toBe(SYSTEM_TITLE)
  })

  it('ensureCheckoutPackageLast appends a checkout block when missing', () => {
    const layout = ensureCheckoutPackageLast({
      version: 1,
      blocks: [{ id: 'sys-title', type: SYSTEM_TITLE, locked: true }]
    })
    expect(checkoutChildren(layout)[checkoutChildren(layout).length - 1].type).toBe(SYSTEM_CHECKOUT)
  })

  it('applies default and override spacing on a block', () => {
    expect(spacingStyleFromBlock({ type: SYSTEM_TITLE }).marginBottom).toBe('0px')
    expect(spacingStyleFromBlock({
      type: 'heading',
      props: { marginTop: 20, paddingLeft: 8 }
    })).toEqual(expect.objectContaining({
      marginTop: '20px',
      marginBottom: '0px'
    }))
    expect(spacingStyleFromBlock({
      type: 'heading',
      props: { paddingLeft: 8 }
    }).paddingLeft).toBeUndefined()
    expect(paddingStyleFromBlock({
      type: 'button',
      props: { paddingTop: 24 }
    })).toEqual({
      paddingTop: '24px',
      paddingRight: '20px',
      paddingBottom: '12px',
      paddingLeft: '20px'
    })
    expect(paddingStyleFromBlock({
      type: SYSTEM_CHECKOUT,
      props: { paddingLeft: 32 }
    })).toEqual({
      paddingTop: '12px',
      paddingRight: '20px',
      paddingBottom: '12px',
      paddingLeft: '32px'
    })
  })

  it('parses nested column children', () => {
    const layout = parsePageLayout({
      version: 1,
      blocks: [
        { id: 'sys-title', type: SYSTEM_TITLE, locked: true },
        {
          id: 'cols',
          type: 'columns',
          props: { count: 2 },
          columns: [
            [{ id: 'h1', type: 'heading', props: { text: 'Left' } }],
            []
          ]
        },
        { id: 'sys-checkout', type: SYSTEM_CHECKOUT, locked: true }
      ]
    })
    expect(findBlock(layout, 'cols').type).toBe('columns')
    expect(findBlock(layout, 'cols').columns[0][0].props.text).toBe('Left')
  })

  it('allows default fields in columns and does not nest columns', () => {
    expect(canDropInColumn(SYSTEM_TITLE)).toBe(true)
    expect(canDropInColumn('columns')).toBe(false)
  })

  it('parses a default title in a column and does not duplicate checkout', () => {
    const layout = parsePageLayout({
      version: 1,
      blocks: [
        {
          id: 'cols',
          type: 'columns',
          props: { count: 2 },
          columns: [
            [{ id: 'sys-title', type: SYSTEM_TITLE, locked: true }],
            [{ id: 'sys-checkout', type: SYSTEM_CHECKOUT, locked: true }]
          ]
        }
      ]
    })
    expect(findBlock(layout, 'cols').columns[0][0].type).toBe(SYSTEM_TITLE)
    expect(findBlock(layout, 'cols').columns[1][0].type).toBe(SYSTEM_CHECKOUT)
    expect(layout.blocks.some((block) => block.type === SYSTEM_CHECKOUT)).toBe(false)
    const ensured = ensureCheckoutPackageLast(layout)
    expect(ensured.blocks.some((block) => block.type === SYSTEM_CHECKOUT)).toBe(false)
  })

  it('keeps bold, italic, underline, and strikethrough tags in inline html', () => {
    expect(sanitizeInlineHtml('<b>Hi</b>')).toBe('<b>Hi</b>')
    expect(sanitizeInlineHtml('<u>Hi</u>')).toBe('<u>Hi</u>')
    expect(sanitizeInlineHtml('<s>Hi</s>')).toBe('<s>Hi</s>')
    expect(sanitizeInlineHtml('<span>Hi</span>')).toBe('Hi')
  })

  it('fills a section without a max-width cap', () => {
    const card = { type: 'card', props: { width: 70, align: 'right', maxWidth: 800 } }
    const onPage = cardChromeStyle(card)
    expect(onPage.maxWidth).toBe('100%')
    expect(onPage.width).toBe('70%')
    expect(onPage.flex).toBe('0 0 70%')
    expect(onPage.marginLeft).toBe('auto')
    expect(onPage.marginRight).toBe('0')
    const inSection = cardChromeStyle(card, { inSection: true })
    expect(inSection.maxWidth).toBe('100%')
    const paired = cardChromeStyle(card, { paired: true, lastInRow: true })
    expect(paired.width).toBe('70%')
    expect(paired.marginLeft).toBe('2%')
    expect(paired.marginRight).toBe('2%')
    const rightAligned = cardChromeStyle(card, {
      paired: true,
      lastInRow: true,
      rowAlign: 'right'
    })
    expect(rightAligned.marginLeft).toBe('2%')
    expect(rightAligned.marginRight).toBe('0')
    const rightFirst = cardChromeStyle(card, { paired: true, rowAlign: 'right' })
    expect(rightFirst.marginLeft).toBe('4%')
    expect(rightFirst.marginRight).toBe('0')
    const leftFirst = cardChromeStyle(card, { paired: true, rowAlign: 'left' })
    expect(leftFirst.marginLeft).toBe('0')
    expect(leftFirst.marginRight).toBe('0')
    const leftLast = cardChromeStyle(card, {
      paired: true,
      lastInRow: true,
      rowAlign: 'left'
    })
    expect(leftLast.marginLeft).toBe('2%')
    expect(leftLast.marginRight).toBe('4%')
    const unevenFirst = cardChromeStyle(
      { type: 'card', props: { width: 24 } },
      { paired: true, rowAlign: 'center' }
    )
    const unevenLast = cardChromeStyle(
      { type: 'card', props: { width: 70 } },
      { paired: true, lastInRow: true, rowAlign: 'center' }
    )
    expect(unevenFirst.width).toBe('24%')
    expect(unevenLast.width).toBe('70%')
    expect(unevenFirst.marginLeft).toBe('2%')
    expect(unevenLast.marginRight).toBe('2%')
  })

  it('vertically centers or stretches a card in a section', () => {
    const checkoutCard = createDefaultLayout().blocks[0].children[0]
    expect(checkoutCard.props.verticalAlign).toBe('middle')
    expect(checkoutCard.props.width).toBe(60)
    expect(checkoutCard.props.minHeight).toBe(50)
    expect(cardChromeStyle(checkoutCard).alignSelf).toBe('center')
    expect(cardChromeStyle(checkoutCard).width).toBe('60%')
    expect(cardChromeStyle(checkoutCard).minHeight).toBe('50%')
    const middle = cardChromeStyle({ type: 'card', props: { verticalAlign: 'middle' } })
    expect(middle.alignSelf).toBe('center')
    const stretch = cardChromeStyle({ type: 'card', props: { verticalAlign: 'stretch' } })
    expect(stretch.alignSelf).toBe('stretch')
    expect(stretch.display).toBe('flex')
  })

  it('aligns inner card content and honors a min height', () => {
    const style = cardChromeStyle({
      type: 'card',
      props: { contentAlign: 'bottom', minHeight: 280 }
    })
    expect(style.justifyContent).toBe('flex-end')
    expect(style.minHeight).toBe('280px')
    const percent = cardChromeStyle({
      type: 'card',
      props: { minHeight: 80, borderRadius: 16 }
    })
    expect(percent.minHeight).toBe('80%')
    expect(percent.borderRadius).toBe('16px')
    expect(percent['--card-pad-left']).toBe('20px')
  })

  it('treats checkout and pinToBottom blocks as pinned', () => {
    expect(isPinnedToBottom({ id: 'sys-checkout', type: SYSTEM_CHECKOUT })).toBe(true)
    expect(isPinnedToBottom({ id: 'b1', type: 'button', props: { pinToBottom: true } })).toBe(true)
    expect(isPinnedToBottom({ id: 'b1', type: 'button', props: {} })).toBe(false)
    const children = [
      { id: 'title', type: SYSTEM_TITLE },
      { id: 'b1', type: 'button', props: { pinToBottom: true } },
      { id: 'sys-checkout', type: SYSTEM_CHECKOUT }
    ]
    expect(isPinGroupStart(children, 'b1')).toBe(true)
    expect(isPinGroupStart(children, 'sys-checkout')).toBe(false)
  })
})
