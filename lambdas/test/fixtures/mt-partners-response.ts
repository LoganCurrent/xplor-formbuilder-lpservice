export default {
  "data": {
    "meta": {
      "pagination": {
        "count": 140,
        "pages": 2,
        "page": 2,
        "per_page": 100
      }
    },
    "links": null,
    "data": [
      {
        "type": "partners",
        "id": "41393",
        "attributes": {
          "address_line1": "805 SW Industrial Way",
          "address_line2": "Suite 7",
          "address_line3": "",
          "city": "Bend",
          "state_province": "Oregon",
          "postal_code": "97702",
          "address_sorting_code": null,
          "code": "bend",
          "name": "Bend",
          "partner_type": "location",
          "should_display_price_include_tax": false,
          "formatted_address": [
            "805 SW Industrial Way, Suite 7",
            "Bend, Oregon 97702",
            "United States"
          ]
        },
        "relationships": {
          "location": {
            "data": {
              "type": "locations",
              "id": "48738"
            }
          },
          "shared_gateway": {
            "data": {
              "type": "payment_gateways",
              "id": "53224"
            }
          }
        }
      },
    ],
    "included": [
      {
        "type": "locations",
        "id": "48738",
        "attributes": {
          "name": "Bend",
          "timezone": "America/Los_Angeles",
          "address_line1": "805 SW Industrial Way",
          "address_line2": "Suite 7",
          "address_line3": "",
          "address_sorting_code": null,
          "city": "Bend",
          "state_province": "Oregon",
          "postal_code": "97702",
          "phone_number": "+5413232828",
          "description": "",
          "email_address": "bend@barre3.com",
          "latitude": "44.0504778",
          "longitude": "-121.3186318",
          "primary_language": "en-US",
          "listed": true,
          "currency_code": "USD",
          "daily_pending_reservation_limit": 3,
          "enable_geo_check_in": false,
          "class_pass_status": "disabled",
          "is_newsletter_subscription_pre_checked": true,
          "is_waitlist_position_public": true,
          "is_waitlist_count_public": false,
          "enable_change_spots": true,
          "enable_third_party_change_spots": false,
          "enable_royalty_fee_platform": false,
          "geo_check_in_distance": 0,
          "gate_geo_check_in_by_distance": "inherit_from_tenant",
          "australian_business_number": "",
          "vat_number": "",
          "formatted_address": [
            "805 SW Industrial Way, Suite 7",
            "Bend, Oregon 97702",
            "United States"
          ],
          "use_tax_inclusive_pricing": "inherit_from_tenant"
        },
        "relationships": {
          "region": {
            "data": {
              "type": "regions",
              "id": "48570"
            }
          },
          "classrooms": {
            "data": [
              {
                "type": "classrooms",
                "id": "6302"
              },
              {
                "type": "classrooms",
                "id": "6387"
              },
              {
                "type": "classrooms",
                "id": "6279"
              },
              {
                "type": "classrooms",
                "id": "6301"
              },
              {
                "type": "classrooms",
                "id": "6420"
              },
              {
                "type": "classrooms",
                "id": "6398"
              },
              {
                "type": "classrooms",
                "id": "6437"
              },
              {
                "type": "classrooms",
                "id": "6276"
              },
              {
                "type": "classrooms",
                "id": "6410"
              }
            ]
          },
          "partner": {
            "data": {
              "type": "partners",
              "id": "41393"
            }
          },
          "default_product_collection": {
            "data": {
              "type": "product_collections",
              "id": "39408"
            }
          },
          "site": {
            "data": {
              "type": "sites",
              "id": "50886"
            }
          },
          "quick_sale_product_collection": {
            "data": {
              "type": "product_collections",
              "id": "39409"
            }
          },
          "addons_product_collection": {
            "data": {
              "type": "product_collections",
              "id": "39410"
            }
          }
        }
      },
      {
        "type": "payment_gateways",
        "id": "53224",
        "attributes": {
          "gateway_class": "StripeGateway",
          "gateway_type": "stripe",
          "name": "Bend Location Gateway",
          "enabled": true
        },
        "relationships": {}
      }
    ]
  }
}
