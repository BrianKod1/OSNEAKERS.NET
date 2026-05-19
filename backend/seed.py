"""Seed data for first-startup database initialization.

NOTE: SEED_PRODUCTS is intentionally empty — real products are managed via
the admin API. Reviews still seed so the social proof grid has content.
"""

SEED_PRODUCTS = []

SEED_REVIEWS = [
    {"name": "Brenda Kodawa", "location": "Toronto, ON", "rating": 5,
     "text": "My third pair from OSneakers and they still set the bar. The Bred 11s arrived in 4 days, packaging was immaculate and the pair smelled like a fresh boutique. Will never buy sneakers anywhere else.",
     "product_name": "Air Jordan 11 Retro 'Bred'",
     "image": "https://customer-assets.emergentagent.com/job_neon-kicks-7/artifacts/k3dp6604_IMG_3227.JPG"},
    {"name": "Scott", "location": "Calgary, AB", "rating": 5,
     "text": "Was nervous ordering a $310 Yeezy online but these guys delivered. The Inertia 700s look exactly like the pics — boost cushioning is real, sizing was spot on. Customer service replied to my DM in under 10 minutes.",
     "product_name": "Yeezy Boost 700 'Inertia'",
     "image": "https://customer-assets.emergentagent.com/job_neon-kicks-7/artifacts/99lu41f1_IMG_6522.JPG"},
    {"name": "Tom White", "location": "Vancouver, BC", "rating": 5,
     "text": "The Balenciaga Stapler is a statement piece and OSneakers nailed every detail — the visible staples, the sculpted outsole, even the heel embossing. This is the only Canadian dropshipper I trust with luxury silhouettes.",
     "product_name": "Balenciaga Stapler Sneaker 'Black'",
     "image": "https://customer-assets.emergentagent.com/job_neon-kicks-7/artifacts/ih51yvo8_IMG_1873.JPG"},
    {"name": "Adrian Omanga", "location": "Mississauga, ON", "rating": 5,
     "text": "Picked up the New Balance 471 in tan and got stopped twice on the way home asking where I got them. Quality is unreal for the price, shipping was lightning fast. OSneakers is the move.",
     "product_name": "New Balance 471 'Tan Suede'",
     "image": "https://customer-assets.emergentagent.com/job_neon-kicks-7/artifacts/uhpvdog5_IMG_3893.JPG"},
]
