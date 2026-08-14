import {
  parsePageLayout,
  ensureCheckoutPackageLast,
  insertBlockAfter,
  removeBlock,
  moveBlockAfter,
  createDefaultLayout,
  spacingStyleFromBlock,
  canDropInColumn,
  SYSTEM_CHECKOUT,
  SYSTEM_TITLE
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
    expect(layout.blocks[0].type).toBe(SYSTEM_CHECKOUT)
    expect(layout.blocks[1].type).toBe(SYSTEM_TITLE)
    expect(layout.blocks.some((b) => b.type === 'heading')).toBe(true)
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
    expect(layout.blocks.map((b) => b.type)).toEqual([SYSTEM_TITLE, SYSTEM_CHECKOUT])
  })

  it('inserts a heading after the title and keeps checkout last', () => {
    const heading = { id: 'b1', type: 'heading', locked: false, props: { text: 'Hi' } }
    const layout = insertBlockAfter(createDefaultLayout(), 'sys-title', heading)
    expect(layout.blocks[1].id).toBe('b1')
    expect(layout.blocks[layout.blocks.length - 1].type).toBe(SYSTEM_CHECKOUT)
  })

  it('does not remove locked system blocks', () => {
    const layout = removeBlock(createDefaultLayout(), 'sys-title')
    expect(layout.blocks.some((b) => b.id === 'sys-title')).toBe(true)
  })

  it('moves locked system blocks', () => {
    const original = createDefaultLayout()
    const moved = moveBlockAfter(original, 'sys-checkout', null)
    expect(moved.blocks[0].type).toBe(SYSTEM_CHECKOUT)
    expect(moved.blocks[1].type).toBe(SYSTEM_TITLE)
  })

  it('ensureCheckoutPackageLast appends a checkout block when missing', () => {
    const layout = ensureCheckoutPackageLast({
      version: 1,
      blocks: [{ id: 'sys-title', type: SYSTEM_TITLE, locked: true }]
    })
    expect(layout.blocks[layout.blocks.length - 1].type).toBe(SYSTEM_CHECKOUT)
  })

  it('applies default and override spacing on a block', () => {
    expect(spacingStyleFromBlock({ type: SYSTEM_TITLE }).marginBottom).toBe('8px')
    expect(spacingStyleFromBlock({
      type: 'heading',
      props: { marginTop: 20, paddingLeft: 8 }
    })).toEqual(expect.objectContaining({
      marginTop: '20px',
      marginBottom: '8px',
      paddingLeft: '8px'
    }))
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
    expect(layout.blocks[1].type).toBe('columns')
    expect(layout.blocks[1].columns[0][0].props.text).toBe('Left')
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
    expect(layout.blocks[0].columns[0][0].type).toBe(SYSTEM_TITLE)
    expect(layout.blocks[0].columns[1][0].type).toBe(SYSTEM_CHECKOUT)
    expect(layout.blocks.some((block) => block.type === SYSTEM_CHECKOUT)).toBe(false)
    const ensured = ensureCheckoutPackageLast(layout)
    expect(ensured.blocks.some((block) => block.type === SYSTEM_CHECKOUT)).toBe(false)
  })
})
