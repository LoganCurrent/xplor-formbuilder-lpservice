<template>
  <el-card :shadow="'never'" :body-style="{'padding-bottom': 0}">
    <template v-if="!pageLayout">
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
      <el-button type="primary" class="custom"
          :disabled="parameters.globalLimit && parameters.remaining === 0"
          :style="'width: 100%; background-color: ' + parameters.button_color + '; border-color: ' + parameters.button_color"
          @click="onCheckoutClick">
        {{ parameters.button_text }}
      </el-button>
      <HelpFooter
        :email="parameters.email"
        :phone="parameters.phone"
        :account-id="parameters.account_id"
      />
    </template>

    <template v-else>
      <div
        v-if="designMode"
        class="drop-zone"
        data-drop-after=""
        :class="{ active: activeDropAfterId === '' }"
        @click.stop="onDropZoneClick(null)"
      ></div>
      <div
        v-for="block in pageLayout.blocks"
        :key="block.id"
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
                :style="'width: 100%; background-color: ' + parameters.button_color + '; border-color: ' + parameters.button_color"
                @click="onCheckoutClick">
              {{ parameters.button_text }}
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
    </template>
  </el-card>
</template>
<script>
import EventBus from '@/event-bus'
import HelpFooter from './HelpFooter.vue'
import SummaryCustomBlock from './SummaryCustomBlock.vue'
import translationMixin from '@/mixins/translationMixin'
import { parsePageLayout, PAGE_LAYOUT_TEMPLATE_KEY, spacingStyleFromBlock } from '@/utils/page-layout'
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
  },
  mounted () {
    this.reportSlots()
  },
  updated () {
    this.reportSlots()
  },
  methods: {
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
      return style
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
    hasTaxInfo () {
      return this.parameters.hasOwnProperty('displayInclusiveTax')
    },
    price () {
      var basePrice = this.parameters.product.price
      if (this.hasTaxInfo && this.parameters.displayInclusiveTax && this.parameters.tax_rate) {
        basePrice = basePrice * (1 + this.parameters.tax_rate)
      }
      return Number(basePrice).toLocaleString(undefined, {
        style: 'currency',
        currency: this.parameters.currency
      })
    },
    priceWithDiscount () {
      var basePrice = this.parameters.product.price - this.parameters.discount
      if (this.hasTaxInfo && this.parameters.displayInclusiveTax && this.parameters.tax_rate) {
        basePrice = basePrice * (1 + this.parameters.tax_rate)
      }
      return Number(basePrice).toLocaleString(undefined, {
        style: 'currency',
        currency: this.parameters.currency
      })
    },
    descriptionWithLinks () {
      if (!this.parameters || !this.parameters.description) return ''
      return this.linkifyUrls(this.parameters.description)
    }
  }
}
</script>
<style scoped>
  .el-card {
    width: 100%;
    max-width: 800px !important;
    margin-left: auto;
    margin-right: auto;
    background: white;
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
    padding: 1rem;
    background-color: rgb(235, 244, 250);
    font-size: .625rem;
    font-weight: 600;
    color: rgb(97, 112, 128);
    text-align: center;
    margin-right: -20px;
    margin-left: -20px;
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
