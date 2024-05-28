"""
swnsogold.generators
~~~~~~~~~~~~~~~~~~~~
Generators for planetary trade tables.
"""

import random
import json
from typing import List

import streamlit as st
import pandas as pd

from sunsofgold.parser import TradeGood, TradeProfile

CARGO_TYPES = [
    "Agricultural",
    "Alien",
    "Astronautic",
    "Biotech",
    "Consumer",
    "Cultural",
    "Livestock",
    "Low Tech",
    "Luxury",
    "Maltech",
    "Medical",
    "Military",
    "Mineral",
    "Postech",
    "Pretech",
    "Religious",
    "Sapient",
    "Surival",
    "Tool",
    "Vehicle"
]

DEFAULT_TROUBLES = [
    "Delayed 1d4 weeks.",
    "Delayed 1d8 weeks.",
    "Lose 1d4 x 10% of the Cargo.",
    "Lose 1d6 x 10% of the Cargo.",
    "Friction increases by 1.",
    "Friction increases by 1d6."
]

tonnes_per_month = {
    "Failed colony": None,
    "Outpost": (1, 1),
    "Fewer than a million inhabitants": (2, 200),
    "Several million inhabitants": (600, 20_000),
    "Hundreds of millions of inhabitants": (60_000, 200_000),
    "Billions of inhabitants": (600_000, 200_000_000),
}

with open("data/standard_commodities.json") as file:
    STANDARD_COMODITIES = pd.DataFrame.from_records(json.load(file))

def generate_trade_profile_manual():
    st.markdown("### Set Base Friction")
    friction = st.number_input("Friction", 1, 5)

    st.markdown("### Choose Modifiers")
    st.info("For most purposes use: -2, -1, +1, +2 (where -2 indicates high supply and +2 indicates high demand)")
    neg_cargo_1, neg_cargo_2, pos_cargo_1, pos_cargo_2= st.columns(4)
    modifiers = {
        neg_cargo_1.selectbox("Choose a Cargo Type", options=CARGO_TYPES): neg_cargo_1.number_input("Choose a Number", -4, -1, -2, format="%d"),
        neg_cargo_2.selectbox("Choose a Cargo Type", options=CARGO_TYPES, key="second_neg_cargo"): neg_cargo_2.number_input("Choose a Number", -4, -1, -1, format="%d"),
        pos_cargo_1.selectbox("Choose a Cargo Type", options=CARGO_TYPES, key="first_pos_cargo"): pos_cargo_1.number_input("Choose a Number", 1, 4, 1, format="%d"),
        pos_cargo_2.selectbox("Choose a Cargo Type", options=CARGO_TYPES, key="second_pos_cargo"): pos_cargo_2.number_input("Choose a Number", 1, 4, 2, format="%d")
    }

    st.markdown("### Choose Trade Goods")
    STANDARD_COMODITIES['Selected'] = False
    trade_goods = st.data_editor(STANDARD_COMODITIES)
    if trade_goods["Selected"].sum() != 10:
        st.warning("The reccomended number of trade goods is 10.")

    selected_trade_goods = trade_goods[trade_goods['Selected']].drop("Selected", axis=1).to_dict("records")
    
    st.markdown("### Choose Trouble Chance")
    trouble_chance = st.number_input("X in 10", 1, 5)
    troubles = pd.Series(
        DEFAULT_TROUBLES, name=f"Troubles ({trouble_chance} in 10 chance)",
    )
    troubles.index = [1, 2, 3, 4, 5, 6]
    st.markdown("#### Edit Troubles")
    troubles = st.data_editor(troubles)

    profile = TradeProfile(
        friction,
        modifiers,
        [TradeGood(**i) for i in selected_trade_goods],
        trouble_chance,
        troubles.to_list()
    )
    
    st.markdown("# Current Profile")
    profile.display()

    return profile
