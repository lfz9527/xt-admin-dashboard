import { NavLink } from 'react-router'

export default function Logo() {
  return (
    <NavLink
      to='/'
      className='bg-primary flex-center aspect-square size-8 rounded-lg'
    >
      <img
        src='/icon-white.svg'
        className='size-6'
      />
    </NavLink>
  )
}
