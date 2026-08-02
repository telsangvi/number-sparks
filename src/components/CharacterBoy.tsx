interface Props { size?: number }

export default function CharacterBoy({ size = 90 }: Props) {
  return (
    <img
      src="/char-boy.png"
      alt=""
      width={size}
      height={size * 1.5}
      style={{ objectFit: 'contain', display: 'block' }}
      draggable={false}
    />
  )
}
