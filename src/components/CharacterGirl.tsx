interface Props { size?: number }

export default function CharacterGirl({ size = 90 }: Props) {
  return (
    <img
      src="/char-girl.png"
      alt=""
      width={size}
      height={size * 1.5}
      style={{ objectFit: 'contain', display: 'block' }}
      draggable={false}
    />
  )
}
