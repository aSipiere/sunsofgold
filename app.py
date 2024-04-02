import json

import streamlit as st

from sunsofgold.parser import (
    Gazeteer,
    TradeProfileCollection,
    build_system_gazeteer,
    parse_trade_profile_collection,
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
    for planet in gazeteer.systems[target_system].children:
        with st.expander(f"{planet.name}"):
            if planet.trade_profile is None and 'f"{planet.name}_select' not in state:
                target_template = st.selectbox(
                    "Choose a trade template:",
                    example_worlds.keys(),
                    key=f"{planet.name}_select",
                )
                if st.button("Add Template to Planet", key=f"{planet.name}_button"):
                    planet.overwrite_trade_profile(
                        default_trade_profiles[target_template],
                    )
                    state["gazeteer_json"] = json.dumps(gazeteer.to_dict())
                    planet.display()
            else:
                planet.display()
                st.json(planet.to_dict())
