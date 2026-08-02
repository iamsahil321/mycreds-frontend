export function IconSlot({ icon: Icon }) {
  return <span aria-hidden="true">{Icon ? <Icon /> : null}</span>;
}
