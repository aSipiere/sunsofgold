"""
swnogold.parser
~~~~~~~~~~~~~~~
Parser for sectors without number json.
"""

import json
from typing import Dict, List, Optional, TypedDict

import pandas as pd
import streamlit as st


class TradeGood(TypedDict):
    trade_good: str
    types: List[str]
    cost: int


class TradeProfile:
    def __init__(self, friction, modifiers, trade_goods, trouble_chance, troubles):
        self.friction: int = friction
        self.modifiers: Dict[str, int] = modifiers
        self.trade_goods: List[TradeGood] = trade_goods
        self.trouble_chance: str = trouble_chance
        self.troubles: List[str] = troubles

    @classmethod
    def parse_trade_profile(cls, data: dict) -> "TradeProfile":
        """Create a trade profile from dictionary"""
        return cls(
            friction=data["friction"],
            modifiers=data["modifiers"],
            trade_goods=[
                TradeGood(trade_good=i["trade_good"], types=i["types"], cost=i["cost"])
                for i in data["trade_goods"]
            ],
            trouble_chance=data["trouble_chance"],
            troubles=data["troubles"],
        )

    def generate_trade_goods_df(self) -> pd.DataFrame:
        """generates a dataframe of the available trade goods"""
        return pd.DataFrame.from_records(self.trade_goods)

    def generate_troubles_series(self) -> pd.Series:
        """generates a series of the troubles"""
        troubles = pd.Series(
            self.troubles, name=f"Troubles ({self.trouble_chance} in 10 chance)",
        )
        troubles.index += 1
        return troubles
    
    def display(self):
        st.markdown("# " + f"{' | '.join([f'{cargo_type} {modifier:+}' for cargo_type, modifier in self.modifiers.items()])}",)

        # Render Goods and troubles tables
        goods_col, troubles_col = st.columns(2)
        goods_col.dataframe(
            self.generate_trade_goods_df(), hide_index=True,
        )
        troubles_col.dataframe(self.generate_troubles_series())

    def to_dict(self):
        return {
            "friction": self.friction,
            "modifiers": self.modifiers,
            "trade_goods": [dict(i) for i in self.trade_goods],
            "trouble_chance": self.trouble_chance,
            "troubles": self.troubles,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "TradeProfile":
        return cls(
            friction=data["friction"],
            modifiers=data["modifiers"],
            trade_goods=[TradeGood(i) for i in data["trade_goods"]],
            trouble_chance=data["trouble_chance"],
            troubles=data["troubles"],
        )


def get_parent_system_and_hex(data: dict, planet: dict):
    """
    retrieves system name and hexcoords for a planet
    return parent_name, parent_hex
    """
    parent = data[planet["parentEntity"]][planet["parent"]]
    return parent["name"], f"{parent['x']-1:02d}{parent['y']-1:02d}"


class Planet:
    def __init__(
        self,
        name,
        parent,
        tech_level,
        atmosphere,
        temperature,
        biosphere,
        population,
        tags,
        trade_profile,
    ):
        self.name: str = name
        self.parent: str = parent
        self.tech_level: str = tech_level
        self.atmosphere: str = atmosphere
        self.temperature: str = temperature
        self.biosphere: str = biosphere
        self.population: str = population
        self.tags: List[str] = tags
        self.trade_profile: Optional[TradeProfile] = trade_profile

    def overwrite_trade_profile(self, profile: TradeProfile):
        """add trade profile"""
        self.trade_profile = profile

    @classmethod
    def parse_planet(cls, planet_data: dict) -> "Planet":
        """create a planet typed dict from the Sectors data."""

        return cls(
            name=planet_data["name"],
            parent=planet_data["parent"],
            tech_level=planet_data["attributes"]["techLevel"],
            atmosphere=planet_data["attributes"]["atmosphere"],
            temperature=planet_data["attributes"]["temperature"],
            biosphere=planet_data["attributes"]["biosphere"],
            population=planet_data["attributes"]["population"],
            tags=[i["name"] for i in planet_data["attributes"]["tags"]],
            trade_profile=None,
        )

    def display(self):
        col1, col2, col3 = st.columns(3)
        col1.markdown(f"# {self.tech_level}")
        col2.markdown(f"**Population:**\n {self.population}")
        col2.markdown(f"**Tags:**\n {', '.join(self.tags)}")
        col3.markdown(
            f"**Atmosphere:** {self.atmosphere} \n **Biosphere:** {self.biosphere}",
        )
        col3.markdown(f"**Temperature:** {self.temperature}")

        if self.population == "Failed colony":
            st.warning(
                "Little to no trade infrastructure, possible salvage opportunity.",
                icon="⚠️",
            )
        if self.trade_profile is not None:
            self.trade_profile.display()

    def to_dict(self):
        return {
            "name": self.name,
            "parent": self.parent,
            "tech_level": self.tech_level,
            "atmosphere": self.atmosphere,
            "temperature": self.temperature,
            "biosphere": self.biosphere,
            "population": self.population,
            "tags": self.tags,
            "trade_profile": self.trade_profile.to_dict()
            if self.trade_profile is not None
            else None,
        }

    @classmethod
    def from_dict(cls, data) -> "Planet":
        return cls(
            name=data["name"],
            parent=data["parent"],
            tech_level=data["tech_level"],
            atmosphere=data["atmosphere"],
            temperature=data["temperature"],
            biosphere=data["biosphere"],
            population=data["population"],
            tags=data["tags"],
            trade_profile=None
            if data["trade_profile"] is None
            else TradeProfile.from_dict(data["trade_profile"]),
        )


class System:
    def __init__(self, entity, name, hex, children=[]):
        self.entity: str = entity
        self.name: str = name
        self.hex: str = hex
        self.children: List[Planet] = children

    def add_child(self, child: Planet):
        self.children.append(child)

    def to_dict(self):
        return {
            "entity": self.entity,
            "name": self.name,
            "hex": self.hex,
            "children": [i.to_dict() for i in self.children],
        }

    @classmethod
    def from_dict(cls, data: dict) -> "System":
        return cls(
            entity=data["entity"],
            name=data["name"],
            hex=data["hex"],
            children=[Planet.from_dict(i) for i in data["children"]],
        )


class Gazeteer:
    def __init__(self, systems: Dict[str, System] = {}):
        self.systems: Dict[str, System] = systems

    def to_dict(self):
        return {k: v.to_dict() for k, v in self.systems.items()}

    def to_json(self):
        return json.dumps(self.to_dict())

    @classmethod
    def from_dict(cls, data) -> "Gazeteer":
        # get ready for some awful recursion nightmare trash
        return cls(systems={k: System.from_dict(v) for k, v in data.items()})


TradeProfileCollection = Dict[str, TradeProfile]


def parse_trade_profile_collection(data: dict) -> TradeProfileCollection:
    """Parse a trade profile collection from dict"""
    return {k: TradeProfile.parse_trade_profile(v) for k, v in data.items()}


@st.cache_data
def build_system_gazeteer(data: dict) -> Gazeteer:
    """
    loop through the planets, get their parents, if parent not in gazeteer,
    add system to gazeteer. Then if parent in gazeteer, parse planet and add it to children.

    #TODO: Support for non-planet entities
    """
    gazeteer = Gazeteer()
    for _, planet_data in data["planet"].items():
        if planet_data["parent"] not in gazeteer.systems:
            parent_name, parent_hex = get_parent_system_and_hex(data, planet_data)
            gazeteer.systems[planet_data["parent"]] = System(
                entity=planet_data["parentEntity"],
                name=parent_name,
                hex=parent_hex,
                children=[],
            )
        gazeteer.systems[planet_data["parent"]].add_child(
            Planet.parse_planet(planet_data),
        )
    return gazeteer
