import type { TradeProfile } from "../types";

interface Props {
  profile: TradeProfile;
}

export function TradeProfileDisplay({ profile }: Props) {
  const modifierString = Object.entries(profile.modifiers)
    .map(([type, mod]) => `${type} ${mod > 0 ? "+" : ""}${mod}`)
    .join(" | ");

  return (
    <div className="trade-profile">
      <h3 className="modifiers-header">{modifierString}</h3>

      <div className="trade-profile-tables">
        <div className="trade-goods-table">
          <h4>Trade Goods</h4>
          <table>
            <thead>
              <tr>
                <th>Trade Good</th>
                <th>Types</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {profile.trade_goods.map((good, i) => (
                <tr key={i}>
                  <td>{good.trade_good}</td>
                  <td>{good.types.join(", ")}</td>
                  <td>${good.cost.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="troubles-table">
          <h4>Troubles ({profile.trouble_chance} chance)</h4>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Trouble</th>
              </tr>
            </thead>
            <tbody>
              {profile.troubles.map((trouble, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{trouble}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
