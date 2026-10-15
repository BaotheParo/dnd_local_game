const stops = [
  ["lobby", "Trạm Đèn"],
  ["ferry_rescue", "Bến Phà"],
  ["bridge_puzzle", "Tam Chung"],
  ["silent_market", "Chợ Tĩnh"],
  ["creature_tracks", "Dấu Chân"],
  ["rest_stop", "Trạm Lửa"],
  ["storm_challenge", "Bão Sương"],
  ["delivery_ending", "Thông Thì Thầm"],
];

export function JourneyRoute({ sceneId }: { sceneId: string }) {
  const current = stops.findIndex(
    ([id]) =>
      id === (sceneId === "bridge_crossing" ? "bridge_puzzle" : sceneId),
  );
  return (
    <nav className="route-progress" aria-label="Tiến trình lữ hành">
      {stops.map(([id, label], index) => (
        <span
          key={id}
          className={
            index === current ? "current" : index < current ? "visited" : ""
          }
          aria-current={index === current ? "step" : undefined}
        >
          <i />
          {label}
          {index < stops.length - 1 && <b />}
        </span>
      ))}
    </nav>
  );
}
