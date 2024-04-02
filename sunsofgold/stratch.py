import pandas as pd

standard_commodities: pd.DataFrame = pd.read_csv("data/standard_commodities.csv")
print(standard_commodities)
standard_commodities.to_json("standard_commodities.json", orient="records")
