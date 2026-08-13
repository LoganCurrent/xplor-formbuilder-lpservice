export default {
  "data": {
    "meta": null,
    "links": null,
    "data": {
      "type": "child_products",
      "id": "14692",
      "attributes": {
        "title": "San Diego - Unlimited Membership",
        "description": "Take 20% off your first month of Unlimited Membership with code 20OFFSD. Your Unlimited Membership includes: Unlimited studio classes, first access to in-studio class booking, unlimited subscription to barre3 online's on-demand library of 1,200+ workouts, discounted Play Lounge for your kiddos, 15% off retail, and invites to exclusive events, programs, and more! Perfect if you plan to attend three or more times per week. ($15.75 per class)",
        "is_discountable": true,
        "slug": "san-diego-unlimited-membership-2",
        "date_created": "2024-04-24T03:37:45.007087Z",
        "date_updated": "2024-06-26T04:03:52.178601Z",
        "supported_currencies": [],
        "options": {
          "exclude_discounts": {
            "name": "Exclude Discounts",
            "required": false
          },
          "start_date": {
            "name": "Start Date",
            "required": false
          },
          "payment_interval_start_type": {
            "name": "Payment Interval Start Type",
            "required": false
          },
          "billing_type": {
            "name": "Billing Type",
            "required": false
          },
          "membership_instance_id": {
            "name": "Membership Instance ID",
            "required": false
          }
        },
        "is_public": true,
        "default_inventoriable": false,
        "is_active": true,
        "user_has_any_locations": false,
        "user_has_all_locations": false,
        "is_live_stream": false,
        "is_first_timer_only": false,
        "is_intro_offer": false,
        "price": null,
        "pricing": [
          {
            "price": 199.0,
            "currency_code": "USD",
            "enabled": true
          },
          {
            "price": null,
            "currency_code": "CAD",
            "enabled": false
          }
        ],
        "upc": "652328804362",
        "sub_title": "Grace Period: 2, Membership: San Diego - Unlimited Membership, Payment Interval: MO, Commitment Length: 3, Renewal Limit: None, Payment Interval Start Type: date_purchased, Payment Interval Length: 1, Usage Interval Limit: None, Guest Usage Interval Limit: 0, Start Date: None, End Date: None, Billing Type: bill_on_purchase, Intro Offer: None",
        "sku": "san-diego-unlimi-memberships-295"
      },
      "relationships": {
        "product_class": {
          "data": {
            "type": "product_classes",
            "id": "929"
          }
        },
        "parent": {
          "data": {
            "type": "products",
            "id": "14691"
          }
        }
      }
    },
    "included": [
      {
        "type": "product_classes",
        "id": "929",
        "attributes": {
          "name": "Memberships",
          "slug": "memberships",
          "default_inventoriable": false,
          "default_anonymously_purchasable": false,
          "product_attributes": {
            "is_intro_offer": {
              "name": "Intro Offer",
              "type": "boolean",
              "required": false,
              "options": []
            },
            "billing_type": {
              "name": "Billing Type",
              "type": "option",
              "required": true,
              "options": [
                "bill_on_start",
                "bill_on_purchase"
              ]
            },
            "end_date": {
              "name": "End Date",
              "type": "date",
              "required": false,
              "options": []
            },
            "start_date": {
              "name": "Start Date",
              "type": "date",
              "required": false,
              "options": []
            },
            "guest_usage_interval_limit": {
              "name": "Guest Usage Interval Limit",
              "type": "positive_integer",
              "required": false,
              "options": []
            },
            "usage_interval_limit": {
              "name": "Usage Interval Limit",
              "type": "positive_integer",
              "required": false,
              "options": []
            },
            "payment_interval_length": {
              "name": "Payment Interval Length",
              "type": "positive_integer",
              "required": true,
              "options": []
            },
            "payment_interval_start_type": {
              "name": "Payment Interval Start Type",
              "type": "option",
              "required": true,
              "options": [
                "specific_start",
                "date_purchased",
                "first_usage"
              ]
            },
            "renewal_limit": {
              "name": "Renewal Limit",
              "type": "positive_integer",
              "required": false,
              "options": []
            },
            "commitment_length": {
              "name": "Commitment Length",
              "type": "positive_integer",
              "required": false,
              "options": []
            },
            "payment_interval": {
              "name": "Payment Interval",
              "type": "option",
              "required": true,
              "options": [
                "YR",
                "MO",
                "WK",
                "DY"
              ]
            },
            "membership": {
              "name": "Membership",
              "type": "entity",
              "required": true,
              "options": []
            },
            "grace_period": {
              "name": "Grace Period",
              "type": "positive_integer",
              "required": true,
              "options": []
            }
          },
          "product_options": {
            "exclude_discounts": {
              "name": "Exclude Discounts",
              "required": false
            },
            "start_date": {
              "name": "Start Date",
              "required": false
            },
            "payment_interval_start_type": {
              "name": "Payment Interval Start Type",
              "required": false
            },
            "billing_type": {
              "name": "Billing Type",
              "required": false
            },
            "membership_instance_id": {
              "name": "Membership Instance ID",
              "required": false
            }
          },
          "product_attributes_array": [
            {
              "name": "Intro Offer",
              "code": "is_intro_offer",
              "attribute_type": "boolean",
              "required": false,
              "options": null
            },
            {
              "name": "Billing Type",
              "code": "billing_type",
              "attribute_type": "option",
              "required": true,
              "options": [
                "bill_on_start",
                "bill_on_purchase"
              ]
            },
            {
              "name": "End Date",
              "code": "end_date",
              "attribute_type": "date",
              "required": false,
              "options": null
            },
            {
              "name": "Start Date",
              "code": "start_date",
              "attribute_type": "date",
              "required": false,
              "options": null
            },
            {
              "name": "Guest Usage Interval Limit",
              "code": "guest_usage_interval_limit",
              "attribute_type": "positive_integer",
              "required": false,
              "options": null
            },
            {
              "name": "Usage Interval Limit",
              "code": "usage_interval_limit",
              "attribute_type": "positive_integer",
              "required": false,
              "options": null
            },
            {
              "name": "Payment Interval Length",
              "code": "payment_interval_length",
              "attribute_type": "positive_integer",
              "required": true,
              "options": null
            },
            {
              "name": "Payment Interval Start Type",
              "code": "payment_interval_start_type",
              "attribute_type": "option",
              "required": true,
              "options": [
                "specific_start",
                "date_purchased",
                "first_usage"
              ]
            },
            {
              "name": "Renewal Limit",
              "code": "renewal_limit",
              "attribute_type": "positive_integer",
              "required": false,
              "options": null
            },
            {
              "name": "Commitment Length",
              "code": "commitment_length",
              "attribute_type": "positive_integer",
              "required": false,
              "options": null
            },
            {
              "name": "Payment Interval",
              "code": "payment_interval",
              "attribute_type": "option",
              "required": true,
              "options": [
                "YR",
                "MO",
                "WK",
                "DY"
              ]
            },
            {
              "name": "Membership",
              "code": "membership",
              "attribute_type": "entity",
              "required": true,
              "options": null
            },
            {
              "name": "Grace Period",
              "code": "grace_period",
              "attribute_type": "positive_integer",
              "required": true,
              "options": null
            }
          ]
        },
        "relationships": {}
      }
    ]
  }
}
