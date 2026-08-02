export default function MountainBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <img
        src="/bg-landscape.png"
        alt=""
        className="w-full h-full object-cover object-center"
        draggable={false}
      />
      {/* Top gradient — keeps question/timer readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.20) 25%, transparent 50%, rgba(0,0,0,0.10) 75%, rgba(0,0,0,0.45) 100%)',
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.50) 100%)',
        }}
      />
    </div>
  )
}
