<template>
  <div class="lp-page">
    <template v-if="!pageLayout">
      <div class="lp-card">
        <div class="name">{{ parameters.name }}</div>
        <div class="description" v-html="descriptionWithLinks"></div>
        <div class="pricing" v-if="!parameters.discount">{{ price }}</div>
        <div class="pricing" v-if="parameters.discount">
          <span class="old">{{ price }}</span>{{ priceWithDiscount }}
        </div>
        <div class="tax-info" v-if="hasTaxInfo">
          <span v-if="parameters.displayInclusiveTax">{{ ts('labels.priceIncludesTax', 'Price includes tax') }}</span>
          <span v-else>{{ ts('labels.priceExcludesTax', 'Price does not include tax') }}</span>
        </div>
        <div class="remaining" v-if="parameters.globalLimit">
          <span v-if="parameters.remaining">{{ ts('labels.onlyRemaining', 'Only {count} remaining', { count: parameters.remaining }) }}</span>
          <span v-if="parameters.remaining === 0">{{ ts('labels.outOfStock', 'This item is out of stock!') }}</span>
        </div>
        <div class="lp-checkout-anchor">
          <el-button type="primary" class="custom"
              :disabled="parameters.globalLimit && parameters.remaining === 0"
              :style="checkoutButtonStyle(null)"
              @click="onCheckoutClick">
            <span v-html="buttonTextHtml"></span>
          </el-button>
          <HelpFooter
            :email="parameters.email"
            :phone="parameters.phone"
            :account-id="parameters.account_id"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <div
        v-for="(row, rowIndex) in pageRows"
        :key="'row-' + rowIndex"
        class="lp-row"
      >
        <div
          v-for="item in row"
          :key="item.id"
          :class="{
            'lp-section': item.type === 'section',
            'lp-page-card-wrap': item.type === 'card'
          }"
          :style="pageItemStyle(item)"
        >
          <div
            v-for="card in cardsOf(item)"
            :key="card.id"
            class="lp-card"
            :style="cardStyle(card, item)"
          >
      <div
        v-if="designMode"
        class="drop-zone"
        data-drop-after=""
        :class="{ active: activeDropAfterId === '' }"
        @click.stop="onDropZoneClick(null)"
      ></div>
      <div
        v-for="block in card.children || []"
        :key="block.id"
        :class="{ 'lp-checkout-anchor': isPinGroupStart(card.children, block.id) }"
      >
        <div
          class="block-shell"
          :class="{ selected: designMode && selectedBlockId === block.id, locked: block.locked }"
          :data-block-id="block.id"
          :style="blockShellStyle(block)"
          @click.stop="onBlockClick(block)"
        >
          <div
            v-if="block.type === 'system.title'"
            class="name"
            :style="systemTextStyle(block, 18, 600)"
          >{{ parameters.name }}</div>
          <div
            v-else-if="block.type === 'system.description'"
            class="description"
            :style="systemTextStyle(block, 16, 400)"
            v-html="descriptionWithLinks"
          ></div>
          <template v-else-if="block.type === 'system.price'">
            <div class="pricing" v-if="!parameters.discount" :style="systemTextStyle(block, 20, 600)">{{ price }}</div>
            <div class="pricing" v-if="parameters.discount" :style="systemTextStyle(block, 20, 600)">
              <span class="old">{{ price }}</span>{{ priceWithDiscount }}
            </div>
            <div class="tax-info" v-if="hasTaxInfo">
              <span v-if="parameters.displayInclusiveTax">{{ ts('labels.priceIncludesTax', 'Price includes tax') }}</span>
              <span v-else>{{ ts('labels.priceExcludesTax', 'Price does not include tax') }}</span>
            </div>
          </template>
          <div v-else-if="block.type === 'system.remaining' && parameters.globalLimit" class="remaining" :style="systemTextStyle(block, 16, 600)">
            <span v-if="parameters.remaining">{{ ts('labels.onlyRemaining', 'Only {count} remaining', { count: parameters.remaining }) }}</span>
            <span v-if="parameters.remaining === 0">{{ ts('labels.outOfStock', 'This item is out of stock!') }}</span>
          </div>
          <template v-else-if="block.type === 'system.checkoutPackage'">
            <el-button type="primary" class="custom"
                :disabled="parameters.globalLimit && parameters.remaining === 0"
                :style="checkoutButtonStyle(block)"
                @click="onCheckoutClick">
              <span v-html="buttonTextHtml"></span>
            </el-button>
            <HelpFooter
              :email="parameters.email"
              :phone="parameters.phone"
              :account-id="parameters.account_id"
            />
          </template>
          <SummaryCustomBlock
            v-else
            :block="block"
            :design-mode="designMode"
            :parameters="parameters"
            @checkout="onCheckoutClick"
          />
        </div>
        <div
          v-if="designMode && block.type !== 'system.checkoutPackage'"
          class="drop-zone"
          :data-drop-after="block.id"
          :class="{ active: activeDropAfterId === block.id }"
          @click.stop="onDropZoneClick(block.id)"
        ></div>
      </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<script>
import EventBus from '@/event-bus'
import HelpFooter from './HelpFooter.vue'
import SummaryCustomBlock from './SummaryCustomBlock.vue'
import translationMixin from '@/mixins/translationMixin'
import { parsePageLayout, PAGE_LAYOUT_TEMPLATE_KEY, paddingStyleFromBlock, spacingStyleFromBlock, sanitizeInlineHtml, pageLayoutRows, cardChromeStyle, checkoutCtaSizeStyle, contentSizeStyle, sectionBackgroundStyle, sectionWidth, sectionMinHeight, isCardPairedInSection, isCardLastInRow, cardRowAlign, isPinGroupStart } from '@/utils/page-layout'
import { postToParent } from '@/utils/design-mode-protocol'

export default {
  components: { HelpFooter, SummaryCustomBlock },
  mixins: [translationMixin],
  props: {
    parameters: {
      type: Object,
      required: true
    },
    mtoauth: {
      type: Object,
      default: null
    },
    designMode: {
      type: Boolean,
      default: false
    },
    editorLayout: {
      type: Object,
      default: null
    },
    selectedBlockId: {
      type: String,
      default: null
    },
    activeDropAfterId: {
      type: String,
      default: null
    }
  },
  created () {
    if (this.parameters.displayPrice) {
      this.parameters.discount = this.parameters.displayPrice
    }
    this.loadTranslationsFlag(this.parameters.account_id)
    if (!this.hasProductPrice) {
      console.warn('Landing page params are missing product price; skipping price render')
    }
  },
  mounted () {
    this.reportSlots()
  },
  updated () {
    this.reportSlots()
  },
  methods: {
    isPinGroupStart: isPinGroupStart,
    onCheckoutClick () {
      if (this.designMode) {
        return
      }
      this.goToActFast()
    },
    goToActFast () {
      if (this.mtoauth && this.mtoauth.isAuthenticated()) {
        EventBus.$emit('show_mt_checkout')
      } else {
        EventBus.$emit('show_act_fast')
      }
    },
    onBlockClick (block) {
      if (!this.designMode) {
        return
      }
      postToParent('select', { id: block.id })
      this.$emit('select-block', block.id)
    },
    onDropZoneClick (afterId) {
      if (!this.designMode) {
        return
      }
      postToParent('drop', { afterId: afterId })
      this.$emit('drop-after', afterId)
    },
    systemTextStyle (block, defaultSize, defaultWeight) {
      var props = (block && block.props) || {}
      var style = {
        textAlign: this.blockAlign(block)
      }
      if (props.fontSize) {
        style.fontSize = props.fontSize + 'px'
      } else if (defaultSize) {
        style.fontSize = defaultSize + 'px'
      }
      if (props.color) {
        style.color = props.color
      }
      if (props.fontFamily) {
        style.fontFamily = props.fontFamily
      } else {
        var template = this.parameters && this.parameters.template
        var pageFont = template && template['key-page-font-family']
        if (pageFont) {
          style.fontFamily = String(pageFont).indexOf(',') >= 0
            ? pageFont
            : "'" + pageFont + "', Helvetica, Arial, sans-serif"
        }
      }
      if (props.fontWeight || defaultWeight) {
        style.fontWeight = props.fontWeight || defaultWeight
      }
      return Object.assign(style, contentSizeStyle(block))
    },
    blockAlign (block) {
      var align = block && block.props && block.props.align
      if (align === 'left' || align === 'right') {
        return align
      }
      return 'center'
    },
    blockShellStyle (block) {
      return Object.assign({
        textAlign: this.blockAlign(block)
      }, spacingStyleFromBlock(block))
    },
    checkoutButtonStyle (block) {
      var color = (this.parameters && this.parameters.button_color) || '#00152A'
      var props = (block && block.props) || {}
      var style = {
        backgroundColor: color,
        borderColor: color,
        color: props.color || '#FFFFFF',
        fontSize: (props.fontSize || 16) + 'px',
        fontWeight: props.fontWeight || 600
      }
      if (props.fontFamily) {
        style.fontFamily = props.fontFamily
      } else {
        var template = this.parameters && this.parameters.template
        var pageFont = template && template['key-page-font-family']
        if (pageFont) {
          style.fontFamily = String(pageFont).indexOf(',') >= 0
            ? pageFont
            : "'" + pageFont + "', Helvetica, Arial, sans-serif"
        }
      }
      return Object.assign(style, checkoutCtaSizeStyle(block || { type: 'system.checkoutPackage' }), paddingStyleFromBlock(block || { type: 'system.checkoutPackage' }))
    },
    cardsOf (item) {
      if (!item) return []
      if (item.type === 'section') return item.children || []
      if (item.type === 'card') return [item]
      return []
    },
    pageItemStyle (item) {
      if (item.type === 'section') {
        var width = sectionWidth(item)
        var minHeight = sectionMinHeight(item)
        return Object.assign({}, sectionBackgroundStyle(item), {
          flex: '0 0 ' + width + '%',
          width: width + '%',
          maxWidth: width + '%',
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          alignContent: 'stretch',
          alignSelf: 'stretch',
          rowGap: '16px',
          columnGap: '0',
          minHeight: minHeight + 'px',
          boxSizing: 'border-box'
        })
      }
      return { width: 'auto', maxWidth: '100%', marginLeft: 'auto', marginRight: 'auto' }
    },
    cardStyle (card, section) {
      var inSection = section && section.type === 'section'
      var children = inSection ? (section.children || []) : []
      var paired = inSection && isCardPairedInSection(children, card.id)
      return cardChromeStyle(card, {
        inSection: Boolean(inSection),
        paired: paired,
        lastInRow: inSection && isCardLastInRow(children, card.id),
        rowAlign: paired ? cardRowAlign(children, card.id) : undefined
      })
    },
    reportSlots () {
      var self = this
      if (!this.designMode || typeof window === 'undefined') {
        return
      }
      this.$nextTick(function () {
        if (!self.$el || !self.$el.querySelectorAll) {
          return
        }
        var zones = self.$el.querySelectorAll('[data-drop-after]')
        var slots = []
        for (var i = 0; i < zones.length; i++) {
          var el = zones[i]
          var rect = el.getBoundingClientRect()
          var after = el.getAttribute('data-drop-after')
          slots.push({
            afterId: after === '' ? null : after,
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          })
        }
        postToParent('slots', { slots: slots })
      })
    },
    linkifyUrls (text) {
      if (!text) return ''
      var urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g
      return text.replace(urlRegex, function (url) {
        var href = url.indexOf('www.') === 0 ? 'http://' + url : url
        return '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' + url + '</a>'
      })
    },
    formatCurrency (amount) {
      if (amount == null || amount === '' || !this.parameters || !this.parameters.currency) {
        return ''
      }
      var value = Number(amount)
      if (isNaN(value)) {
        return ''
      }
      return value.toLocaleString(undefined, {
        style: 'currency',
        currency: this.parameters.currency
      })
    }
  },
  computed: {
    pageLayout () {
      if (this.editorLayout && this.editorLayout.blocks) {
        return this.editorLayout
      }
      var template = this.parameters && this.parameters.template
      return parsePageLayout(template && template[PAGE_LAYOUT_TEMPLATE_KEY])
    },
    pageRows () {
      return pageLayoutRows((this.pageLayout && this.pageLayout.blocks) || [])
    },
    buttonTextHtml () {
      var raw = this.parameters && this.parameters.button_text
      if (raw == null || raw === '') {
        return 'Buy now'
      }
      return sanitizeInlineHtml(raw)
    },
    hasTaxInfo () {
      return this.parameters.hasOwnProperty('displayInclusiveTax')
    },
    hasProductPrice () {
      var product = this.parameters && this.parameters.product
      return Boolean(product && product.price != null && product.price !== '')
    },
    price () {
      if (!this.hasProductPrice) {
        return ''
      }
      var basePrice = this.parameters.product.price
      if (this.hasTaxInfo && this.parameters.displayInclusiveTax && this.parameters.tax_rate) {
        basePrice = basePrice * (1 + this.parameters.tax_rate)
      }
      return this.formatCurrency(basePrice)
    },
    priceWithDiscount () {
      if (!this.hasProductPrice) {
        return ''
      }
      var basePrice = this.parameters.product.price - this.parameters.discount
      if (this.hasTaxInfo && this.parameters.displayInclusiveTax && this.parameters.tax_rate) {
        basePrice = basePrice * (1 + this.parameters.tax_rate)
      }
      return this.formatCurrency(basePrice)
    },
    descriptionWithLinks () {
      if (!this.parameters || !this.parameters.description) return ''
      return this.linkifyUrls(this.parameters.description)
    }
  }
}
</script>
<style scoped>
  .lp-page {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .lp-row {
    display: flex;
    flex-wrap: nowrap;
    align-items: stretch;
    flex: 0 0 auto;
    width: 100%;
  }
  .lp-section {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: stretch;
    align-content: stretch;
    column-gap: 0;
    row-gap: 16px;
    height: auto;
    padding: 0;
    box-sizing: border-box;
  }
  .lp-card {
    width: 100%;
    max-width: min(800px, 100%);
    min-width: 0;
    margin-left: auto;
    margin-right: auto;
    background: white;
    padding: 20px 20px 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    --card-pad-top: 20px;
    --card-pad-right: 20px;
    --card-pad-bottom: 0px;
    --card-pad-left: 20px;
  }
  .lp-checkout-anchor {
    margin-top: auto;
    width: 100%;
  }
  .name {
    font-size: 1.125rem;
    font-weight: 600;
    color: rgb(0, 21, 42);
    margin-bottom: .5rem;
  }
  .description {
    font-size: 1rem;
    line-height: 1.5;
    color: rgb(0, 21, 42);
    margin-bottom: 1.5rem;
  }
  .description >>> a {
    color: #2E4457;
    text-decoration: underline;
  }
  .description >>> a:hover {
    color: #1a2938;
  }
  .pricing {
    margin-bottom: 2.5rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: rgb(0, 21, 42);
  }
  .pricing .old {
    text-decoration: line-through;
    color: rgb(97, 112, 128);
    margin-right: .5rem;
  }
  .tax-info {
    font-size: 0.875rem;
    color: rgb(97, 112, 128);
    margin-top: -2rem;
    margin-bottom: 2.5rem;
  }
  .footer {
    margin-top: 1rem;
    margin-left: calc(-1 * var(--card-pad-left, 20px));
    margin-right: calc(-1 * var(--card-pad-right, 20px));
    margin-bottom: calc(-1 * var(--card-pad-bottom, 0px));
    padding: 1rem;
    background-color: rgb(235, 244, 250);
    font-size: .625rem;
    font-weight: 600;
    color: rgb(97, 112, 128);
    text-align: center;
  }
  .footer a {
    color: #2E4457;
    text-decoration: underline;
  }
  .remaining {
    font-weight: 600;
    color: rgb(0, 21, 42);
    text-align: center;
    margin-top: -1rem;
    margin-bottom: 1rem;
  }
  .block-shell {
    position: relative;
  }
  .block-shell .name,
  .block-shell .description,
  .block-shell .pricing,
  .block-shell .remaining {
    margin-top: 0;
    margin-bottom: 0;
  }
  .block-shell .tax-info {
    margin-top: 0.5rem;
    margin-bottom: 0;
  }
  .block-shell.selected {
    outline: 2px solid #1589c2;
    outline-offset: 4px;
  }
  .drop-zone {
    height: 12px;
    margin: 4px 0;
    border-radius: 4px;
    border: 1px dashed transparent;
  }
  .drop-zone.active,
  .drop-zone:hover {
    border-color: #1589c2;
    background: rgba(21, 137, 194, 0.12);
  }
</style>
