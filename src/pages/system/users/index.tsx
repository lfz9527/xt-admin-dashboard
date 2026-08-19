import { Outlet, useNavigate } from 'react-router'

export default function Users() {
  const navigate = useNavigate()

  return (
    <>
      users
      <button
        type='button'
        onClick={() => {
          const id = Math.floor(Math.random() * 1000000)
          navigate(`/system/users/${id}`)
        }}
      >
        查询用户详情
      </button>
      <Outlet />
    </>
  )
}
