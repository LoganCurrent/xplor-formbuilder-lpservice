import { shallowMount } from '@vue/test-utils';
import ActFast from '@/components/ActFast.vue';
import HelpFooter from '@/components/HelpFooter.vue';
import EventBus from '@/event-bus';

jest.mock('@/event-bus', () => ({
  $emit: jest.fn(),
}));

describe('ActFast.vue', () => {
  let wrapper;
  const parameters = {
    name: 'Test Product',
    product: { price: 100 },
    discount: 20,
    currency: 'USD',
    customerType: 'existing',
    button_color: '#ff0000',
    email: 'test@example.com',
    phone: '1234567890',
    brandName: 'TestBrand',
    isCustomClientAuthEnabled: true,
    customClientCreateAccountEndpoint: 'http://example.com'
  };

  beforeEach(() => {
    wrapper = shallowMount(ActFast, {
      propsData: { parameters }
    });
  });

  it('renders product name and price correctly', () => {
    expect(wrapper.text()).toContain(parameters.name);
    expect(wrapper.text()).toContain('$100.00');
  });

  it('computes discount price correctly', () => {
    expect(wrapper.vm.priceWithDiscount).toBe('$80.00');
  });

  it('shows sign in message for existing customers', () => {
    expect(wrapper.text()).toContain(`Sign In with your ${parameters.brandName} credentials`);
  });

  it('emits correct event on button click', async () => {
    await wrapper.find('.custom').trigger('click');
    expect(EventBus.$emit).toHaveBeenCalledWith('show_mt_login');
  });

  it('passes email and phone to HelpFooter for contact info', () => {
    const helpFooter = wrapper.find(HelpFooter);
    expect(helpFooter.exists()).toBe(true);
    expect(helpFooter.props('email')).toBe(parameters.email);
    expect(helpFooter.props('phone')).toBe(parameters.phone);
  });

  it('checks for the presence of create account link based on custom client auth', () => {
    const linkExists = wrapper.find('.link').exists();
    expect(linkExists).toBe(parameters.isCustomClientAuthEnabled && !!parameters.customClientCreateAccountEndpoint);
  });

  describe('Tax functionality', () => {
    it('displays price without tax when displayInclusiveTax is false', () => {
      const taxParameters = {
        ...parameters,
        displayInclusiveTax: false
      };
      const taxWrapper = shallowMount(ActFast, {
        propsData: { parameters: taxParameters }
      });

      expect(taxWrapper.vm.price).toBe('$100.00');
    });

    it('displays price with tax when displayInclusiveTax is true and tax_rate exists', () => {
      const taxParameters = {
        ...parameters,
        displayInclusiveTax: true,
        tax_rate: 0.10
      };
      const taxWrapper = shallowMount(ActFast, {
        propsData: { parameters: taxParameters }
      });

      expect(taxWrapper.vm.price).toBe('$110.00');
    });

    it('displays discounted price with tax when displayInclusiveTax is true and tax_rate exists', () => {
      const taxParameters = {
        ...parameters,
        displayInclusiveTax: true,
        tax_rate: 0.10
      };
      const taxWrapper = shallowMount(ActFast, {
        propsData: { parameters: taxParameters }
      });

      expect(taxWrapper.vm.priceWithDiscount).toBe('$88.00');
    });

    it('displays "Price includes tax" when displayInclusiveTax is true', () => {
      const taxParameters = {
        ...parameters,
        displayInclusiveTax: true,
        tax_rate: 0.10
      };
      const taxWrapper = shallowMount(ActFast, {
        propsData: { parameters: taxParameters }
      });

      const taxInfo = taxWrapper.find('.tax-info');
      expect(taxInfo.exists()).toBe(true);
      expect(taxInfo.text()).toContain('Price includes tax');
    });

    it('displays "Price does not include tax" when displayInclusiveTax is false', () => {
      const taxParameters = {
        ...parameters,
        displayInclusiveTax: false
      };
      const taxWrapper = shallowMount(ActFast, {
        propsData: { parameters: taxParameters }
      });

      const taxInfo = taxWrapper.find('.tax-info');
      expect(taxInfo.exists()).toBe(true);
      expect(taxInfo.text()).toContain('Price does not include tax');
    });

    it('does not show tax info when feature flag is disabled (displayInclusiveTax not present)', () => {
      const taxWrapper = shallowMount(ActFast, {
        propsData: { parameters }
      });

      expect(taxWrapper.find('.tax-info').exists()).toBe(false);
    });

    it('does not apply tax when displayInclusiveTax is true but tax_rate is missing', () => {
      const taxParameters = {
        ...parameters,
        displayInclusiveTax: true,
        tax_rate: null
      };
      const taxWrapper = shallowMount(ActFast, {
        propsData: { parameters: taxParameters }
      });

      expect(taxWrapper.vm.price).toBe('$100.00');
    });
  });
});
