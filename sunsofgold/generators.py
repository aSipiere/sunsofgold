"""
swnsogold.generators
~~~~~~~~~~~~~~~~~~~~
Generators for planetary trade tables.
"""

import random
from typing import List

from sunsofgold.types import TradeGood

tonnes_per_month = {
    "Failed colony": None,
    "Outpost": (1, 1),
    "Fewer than a million inhabitants": (2, 200),
    "Several million inhabitants": (600, 20_000),
    "Hundreds of millions of inhabitants": (60_000, 200_000),
    "Billions of inhabitants": (600_000, 200_000_000),
}

# def get_supply_and_demand(planet) -> dict:
#     supply = set()
#     demand = set()
#     if planet.population == "Alien inhabitants":
#         supply.update("Alien")


def generate_modifiers(possible_cargo_types: list) -> dict:
    """choose 4 random types and give them modifiers from -2, -1, 1, 2."""

    modifier_types = random.sample(possible_cargo_types, 4)
    random.shuffle(modifier_types)

    return dict(zip(modifier_types, [-2, -1, 1, 2]))


def generate_trade_goods_from_common(
    tech_level, standard_commodities: List[TradeGood], current_modifiers: dict,
) -> List[TradeGood]:
    """
    Trade good generation works as follows, we get the list of types from the modifiers,
    then add common, we then add tags based on the planet's tech level.
    """
    # available_types = set(current_modifiers.keys()).add("Common")
    pass