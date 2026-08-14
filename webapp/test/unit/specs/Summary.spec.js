import { mount } from '@vue/test-utils';
import Summary from '@/components/Summary.vue';
import EventBus from '@/event-bus';

jest.mock('@/event-bus', () => ({
  $emit: jest.fn(),
}));

describe('Summary.vue', () => {
  it('renders name and description from props', () => {
    const parameters = { name: 'Test Product', description: 'Test Description', product: { price: 100 }, currency: 'USD' };
    const wrapper = mount(Summary, {
      propsData: { parameters }
    });

    expect(wrapper.text()).toContain('Test Product');
    expect(wrapper.text()).toContain('Test Description');
  });

  it('displays price and price with discount correctly', () => {
    const parameters = { name: 'Test Product', description: 'Test Description', product: { price: 100 }, discount: 20, currency: 'USD' };
    const wrapper = mount(Summary, {
      propsData: { parameters }
    });

    const priceWithDiscount = `$${(parameters.product.price - parameters.discount).toFixed(2)}`;
    expect(wrapper.text()).toContain(priceWithDiscount);
  });

  it('calls goToActFast method on button click', async () => {
    const parameters = { name: 'Test Product', description: 'Test Description', product: { price: 100 }, currency: 'USD' };
    const mtoauth = { isAuthenticated: () => true };
    const wrapper = mount(Summary, {
      propsData: { parameters, mtoauth }
    });

    await wrapper.find('.custom').trigger('click');
    expect(EventBus.$emit).toHaveBeenCalledWith('show_mt_checkout');
  });

  it('converts URLs in description to clickable links', () => {
    const parameters = { 
      name: 'Test Product', 
      description: 'Visit https://www.google.com for more info or check www.example.com', 
      product: { price: 100 }, 
      currency: 'USD' 
    };
    const wrapper = mount(Summary, {
      propsData: { parameters }
    });

    const descriptionElement = wrapper.find('.description');
    const htmlContent = descriptionElement.html();
    
    expect(htmlContent).toContain('<a href="https://www.google.com" target="_blank" rel="noopener noreferrer">https://www.google.com</a>');
    expect(htmlContent).toContain('<a href="http://www.example.com" target="_blank" rel="noopener noreferrer">www.example.com</a>');
  });

  it('handles null description without errors', () => {
    const parameters = { 
      name: 'Test Product', 
      description: null, 
      product: { price: 100 }, 
      currency: 'USD' 
    };
    const wrapper = mount(Summary, {
      propsData: { parameters }
    });

    expect(wrapper.text()).toContain('Test Product');
    const descriptionElement = wrapper.find('.description');
    expect(descriptionElement.html()).toBe('<div class="description"></div>');
  });

  it('handles undefined description without errors', () => {
    const parameters = { 
      name: 'Test Product', 
      product: { price: 100 }, 
      currency: 'USD' 
    };
    const wrapper = mount(Summary, {
      propsData: { parameters }
    });

    expect(wrapper.text()).toContain('Test Product');
    const descriptionElement = wrapper.find('.description');
    expect(descriptionElement.html()).toBe('<div class="description"></div>');
  });

  it('renders a custom heading from key-page-layout between title and description', () => {
    const layout = {
      version: 1,
      blocks: [
        { id: 'sys-title', type: 'system.title', locked: true },
        { id: 'b1', type: 'heading', locked: false, props: { text: 'Extra heading', fontSize: 24, color: '#00152A' } },
        { id: 'sys-description', type: 'system.description', locked: true },
        { id: 'sys-price', type: 'system.price', locked: true },
        { id: 'sys-remaining', type: 'system.remaining', locked: true },
        { id: 'sys-checkout', type: 'system.checkoutPackage', locked: true }
      ]
    };
    const parameters = {
      name: 'Test Product',
      description: 'Test Description',
      product: { price: 100 },
      currency: 'USD',
      button_text: 'Buy now',
      template: {
        'key-page-layout': JSON.stringify(layout)
      }
    };
    const wrapper = mount(Summary, {
      propsData: { parameters }
    });

    expect(wrapper.text()).toContain('Test Product');
    expect(wrapper.text()).toContain('Extra heading');
    expect(wrapper.text()).toContain('Test Description');
    expect(wrapper.text()).toContain('Buy now');
    expect(wrapper.find('.custom').exists()).toBe(true);
  });

  it('applies typography props on the locked title', () => {
    const layout = {
      version: 1,
      blocks: [
        { id: 'sys-title', type: 'system.title', locked: true, props: { fontSize: 32, color: '#ff0000' } },
        { id: 'sys-description', type: 'system.description', locked: true },
        { id: 'sys-price', type: 'system.price', locked: true },
        { id: 'sys-remaining', type: 'system.remaining', locked: true },
        { id: 'sys-checkout', type: 'system.checkoutPackage', locked: true }
      ]
    };
    const parameters = {
      name: 'Test Product',
      description: 'Test Description',
      product: { price: 100 },
      currency: 'USD',
      button_text: 'Buy now',
      template: {
        'key-page-layout': JSON.stringify(layout)
      }
    };
    const wrapper = mount(Summary, {
      propsData: { parameters }
    });

    expect(wrapper.find('.name').element.style.fontSize).toBe('32px');
    expect(wrapper.find('.name').element.style.color).toBe('rgb(255, 0, 0)');
    expect(wrapper.find('.name').element.style.textAlign).toBe('center');
  });

  it('applies margin and padding props on a layout block', () => {
    const layout = {
      version: 1,
      blocks: [
        {
          id: 'sys-title',
          type: 'system.title',
          locked: true,
          props: { marginBottom: 32, paddingLeft: 12 }
        },
        { id: 'sys-description', type: 'system.description', locked: true },
        { id: 'sys-price', type: 'system.price', locked: true },
        { id: 'sys-remaining', type: 'system.remaining', locked: true },
        { id: 'sys-checkout', type: 'system.checkoutPackage', locked: true }
      ]
    };
    const parameters = {
      name: 'Test Product',
      description: 'Test Description',
      product: { price: 100 },
      currency: 'USD',
      button_text: 'Buy now',
      template: {
        'key-page-layout': JSON.stringify(layout)
      }
    };
    const wrapper = mount(Summary, {
      propsData: { parameters }
    });

    const shell = wrapper.find('[data-block-id="sys-title"]');
    expect(shell.element.style.marginBottom).toBe('32px');
    expect(shell.element.style.paddingLeft).toBe('12px');
  });

  it('renders nested heading inside a columns block', () => {
    const layout = {
      version: 1,
      blocks: [
        { id: 'sys-title', type: 'system.title', locked: true },
        {
          id: 'cols',
          type: 'columns',
          locked: false,
          props: { count: 2, gap: 16, dividerThickness: 1, dividerColor: '#D9E7F0' },
          columns: [
            [{ id: 'h1', type: 'heading', locked: false, props: { text: 'Left col' } }],
            []
          ]
        },
        { id: 'sys-description', type: 'system.description', locked: true },
        { id: 'sys-price', type: 'system.price', locked: true },
        { id: 'sys-remaining', type: 'system.remaining', locked: true },
        { id: 'sys-checkout', type: 'system.checkoutPackage', locked: true }
      ]
    };
    const parameters = {
      name: 'Test Product',
      description: 'Test Description',
      product: { price: 100 },
      currency: 'USD',
      button_text: 'Buy now',
      template: {
        'key-page-layout': JSON.stringify(layout)
      }
    };
    const wrapper = mount(Summary, {
      propsData: { parameters }
    });

    expect(wrapper.text()).toContain('Left col');
    expect(wrapper.find('.lp-columns').exists()).toBe(true);
  });

  it('renders a default title inside a columns block', () => {
    const layout = {
      version: 1,
      blocks: [
        {
          id: 'cols',
          type: 'columns',
          locked: false,
          props: { count: 2, gap: 16, dividerThickness: 1, dividerColor: '#D9E7F0' },
          columns: [
            [{ id: 'sys-title', type: 'system.title', locked: true, props: {} }],
            []
          ]
        },
        { id: 'sys-description', type: 'system.description', locked: true },
        { id: 'sys-price', type: 'system.price', locked: true },
        { id: 'sys-remaining', type: 'system.remaining', locked: true },
        { id: 'sys-checkout', type: 'system.checkoutPackage', locked: true }
      ]
    };
    const parameters = {
      name: 'Column Title',
      description: 'Test Description',
      product: { price: 100 },
      currency: 'USD',
      button_text: 'Buy now',
      template: {
        'key-page-layout': JSON.stringify(layout)
      }
    };
    const wrapper = mount(Summary, {
      propsData: { parameters }
    });

    expect(wrapper.text()).toContain('Column Title');
  });

  it('does not start checkout when designMode is on', async () => {
    EventBus.$emit.mockClear();
    const parameters = { name: 'Test Product', description: 'Test Description', product: { price: 100 }, currency: 'USD', button_text: 'Buy now' };
    const mtoauth = { isAuthenticated: () => true };
    const wrapper = mount(Summary, {
      propsData: { parameters, mtoauth, designMode: true }
    });

    await wrapper.find('.custom').trigger('click');
    expect(EventBus.$emit).not.toHaveBeenCalled();
  });

  describe('Tax functionality', () => {
    it('displays price without tax when displayInclusiveTax is false', () => {
      const parameters = { 
        name: 'Test Product', 
        description: 'Test Description', 
        product: { price: 100 }, 
        currency: 'USD',
        displayInclusiveTax: false
      };
      const wrapper = mount(Summary, {
        propsData: { parameters }
      });

      const priceText = wrapper.find('.pricing').text();
      expect(priceText).toContain('$100.00');
    });

    it('displays price with tax when displayInclusiveTax is true and tax_rate exists', () => {
      const parameters = { 
        name: 'Test Product', 
        description: 'Test Description', 
        product: { price: 100 }, 
        currency: 'USD',
        displayInclusiveTax: true,
        tax_rate: 0.10
      };
      const wrapper = mount(Summary, {
        propsData: { parameters }
      });

      const priceText = wrapper.find('.pricing').text();
      expect(priceText).toContain('$110.00');
    });

    it('displays discounted price with tax when displayInclusiveTax is true and tax_rate exists', () => {
      const parameters = { 
        name: 'Test Product', 
        description: 'Test Description', 
        product: { price: 100 }, 
        discount: 20,
        currency: 'USD',
        displayInclusiveTax: true,
        tax_rate: 0.10
      };
      const wrapper = mount(Summary, {
        propsData: { parameters }
      });

      const priceText = wrapper.find('.pricing').text();
      expect(priceText).toContain('$88.00');
    });

    it('displays "Price includes tax" when displayInclusiveTax is true', () => {
      const parameters = { 
        name: 'Test Product', 
        description: 'Test Description', 
        product: { price: 100 }, 
        currency: 'USD',
        displayInclusiveTax: true,
        tax_rate: 0.10
      };
      const wrapper = mount(Summary, {
        propsData: { parameters }
      });

      const taxInfo = wrapper.find('.tax-info');
      expect(taxInfo.text()).toContain('Price includes tax');
    });

    it('displays "Price does not include tax" when displayInclusiveTax is false', () => {
      const parameters = { 
        name: 'Test Product', 
        description: 'Test Description', 
        product: { price: 100 }, 
        currency: 'USD',
        displayInclusiveTax: false
      };
      const wrapper = mount(Summary, {
        propsData: { parameters }
      });

      const taxInfo = wrapper.find('.tax-info');
      expect(taxInfo.text()).toContain('Price does not include tax');
    });

    it('does not apply tax when displayInclusiveTax is true but tax_rate is missing', () => {
      const parameters = { 
        name: 'Test Product', 
        description: 'Test Description', 
        product: { price: 100 }, 
        currency: 'USD',
        displayInclusiveTax: true,
        tax_rate: null
      };
      const wrapper = mount(Summary, {
        propsData: { parameters }
      });

      const priceText = wrapper.find('.pricing').text();
      expect(priceText).toContain('$100.00');
    });

    it('handles different tax rates correctly', () => {
      const parameters = { 
        name: 'Test Product', 
        description: 'Test Description', 
        product: { price: 100 }, 
        currency: 'USD',
        displayInclusiveTax: true,
        tax_rate: 0.20
      };
      const wrapper = mount(Summary, {
        propsData: { parameters }
      });

      const priceText = wrapper.find('.pricing').text();
      expect(priceText).toContain('$120.00');
    });

    it('does not show tax info when feature flag is disabled (displayInclusiveTax not present)', () => {
      const parameters = { 
        name: 'Test Product', 
        description: 'Test Description', 
        product: { price: 100 }, 
        currency: 'USD'
      };
      const wrapper = mount(Summary, {
        propsData: { parameters }
      });

      expect(wrapper.find('.tax-info').exists()).toBe(false);
      const priceText = wrapper.find('.pricing').text();
      expect(priceText).toContain('$100.00');
    });
  });
});
