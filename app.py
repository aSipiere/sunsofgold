import json

import streamlit as st
import pandas as pd

from sunsofgold.parser import (
    Gazeteer,
    TradeProfileCollection,
    build_system_gazeteer,
    parse_trade_profile_collection,
    TradeProfile,
    TradeGood
)
from sunsofgold.generators import (
    generate_trade_profile_manual
)

state = st.session_state

st.set_page_config(layout="wide")
st.sidebar.title("Sectors With Suns of Gold")
st.sidebar.markdown(
    "A simple interface for Suns of Gold trade generation using your sectors without number file.",
)

with open("data/example_worlds.json") as file:
    example_worlds = json.load(file)
default_trade_profiles: TradeProfileCollection = parse_trade_profile_collection(
    example_worlds,
)

swn_file = st.sidebar.file_uploader(
    "Choose a File:", type=".json", help="Upload your Sectors Without Number file here.",
)

if "gazeteer_json" not in state:
    # Load data and build gazeteer
    if swn_file is not None:
        swn_data = json.load(swn_file)
        gazeteer = build_system_gazeteer(swn_data)
        state["gazeteer_json"] = json.dumps(gazeteer.to_dict())

if "gazeteer_json" in state:
    gazeteer = Gazeteer.from_dict(json.loads(state["gazeteer_json"]))
    # Select a target system
    system_select = {f"{v.name} {v.hex}": k for k, v in gazeteer.systems.items()}
    target_system = system_select[st.selectbox("System:", system_select.keys())]

    # Create a tab for each planet
    planets = {planet.name: planet for planet in gazeteer.systems[target_system].children}
    tabs = dict(zip(planets.keys(), st.tabs(planets.keys())))
    
    for planet_name, tab in tabs.items():
        with tab:
            planet = planets[planet_name]
            planet.display()
            if planet.trade_profile is None and 'f"{planet.name}_select' not in state:
                st.warning("No Trade Profile for this Planet.")
             
            with st.expander("Generate Trade Profile"):
                match st.selectbox("Method", ["Template", "Manual"], key=f"edit_method_{planet_name}"):
                    case "Template":
                        target_template = st.selectbox(
                            "Choose a trade template:",
                            example_worlds.keys(),
                            key=f"{planet.name}_select",
                        )
                        profile = default_trade_profiles[target_template]
                        profile.display()
                        if st.button("Add Template to Planet", key=f"{planet.name}_template_button"):
                            planet.overwrite_trade_profile(
                                profile,
                            )
                            state["gazeteer_json"] = json.dumps(gazeteer.to_dict())
                            st.rerun()
                    case "Manual":
                        profile: TradeProfile = generate_trade_profile_manual()
                        if st.button("Add Profile to Planet", key=f"{planet.name}_manual_button"):
                            planet.overwrite_trade_profile(
                                profile,
                            )
                            state["gazeteer_json"] = json.dumps(gazeteer.to_dict())
                            st.rerun()