"""Seed data for first-startup database initialization.

NOTE: SEED_PRODUCTS is intentionally empty — real products are managed via
the admin API. Reviews still seed so the social proof grid has content.
"""

SEED_PRODUCTS = []

SEED_REVIEWS = [
    {"name": "Marcus T.", "location": "Toronto, ON", "rating": 5,
     "text": "Got my Jordan 1s in 4 days. Packaging was insane and the shoes are 100% legit. OSneakers is the real deal — won't buy anywhere else.",
     "product_name": "Air Jordan 1 High OG",
     "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Aisha K.", "location": "Vancouver, BC", "rating": 5,
     "text": "I've ordered 3 pairs over the past year. Quality and authenticity are unmatched. The team responds within minutes on Instagram.",
     "product_name": "Yeezy 350 V2",
     "image": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Diego R.", "location": "Montréal, QC", "rating": 5,
     "text": "Honestly didn't expect this level of service from a dropshipping site. Tracking was clear, customs handled, and the Balenciagas are perfect.",
     "product_name": "Balenciaga Triple S",
     "image": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Jordan P.", "location": "Calgary, AB", "rating": 5,
     "text": "Seven years strong. These guys built trust in a market full of scams. Best prices, fastest shipping in Canada.",
     "product_name": "Nike Dunk Low",
     "image": "https://images.unsplash.com/photo-1520316587275-5e4f06f355e6?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Sienna L.", "location": "Ottawa, ON", "rating": 5,
     "text": "Customer service is on another level. They helped me size correctly and shipped same day. Sneakers smell like a boutique.",
     "product_name": "Nike Air Max",
     "image": "https://images.unsplash.com/photo-1585232004423-244e0e6904e3?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Kai M.", "location": "Mississauga, ON", "rating": 5,
     "text": "Walked into an event with the Off-White Prestos — got stopped 10 times. OSneakers always has the heat first.",
     "product_name": "Off-White Presto",
     "image": "https://images.unsplash.com/photo-1605523741177-cd660595c2cf?crop=entropy&cs=srgb&fm=jpg&q=85"},
]
