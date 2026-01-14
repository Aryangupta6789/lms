import React, { useContext } from 'react'
import { assets } from '../../assets/assets'
import { Link, useNavigate, useMatch } from 'react-router-dom'
import { useClerk, UserButton, useUser, useAuth } from '@clerk/clerk-react'
import { AppContext } from '../../context/AddContext'

const Navbar = () => {
  const navigate = useNavigate()
  const isCourceListpage = useMatch('/course-list/*')

  const { isEducator } = useContext(AppContext)
  const { openSignIn } = useClerk()
  const { user } = useUser()
  const { getToken } = useAuth()

  // ===================== BECOME EDUCATOR =====================
  const becomeEducator = async () => {
    try {
      const token = await getToken()

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/educator/update-role`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const data = await res.json()

      if (data.success) {
        alert('Ab tu Educator hai 🎉')
        window.location.reload()
      } else {
        alert(data.message)
      }
    } catch (err) {
      console.error(err)
      alert('Error aaya')
    }
  }

  // ===================== BUTTON HANDLER =====================
  const handleEducatorClick = () => {
    if (isEducator) {
      navigate('/educator')
    } else {
      becomeEducator()
    }
  }

  return (
    <div
      className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-500 py-4 ${
        isCourceListpage ? 'bg-white' : 'bg-cyan-100/70'
      }`}
    >
      {/* Logo */}
      <img
        onClick={() => navigate('/')}
        src={assets.logo}
        alt='logo'
        className='w-28 lg:w-32 cursor-pointer'
      />

      {/* ===================== DESKTOP ===================== */}
      <div className='hidden md:flex items-center gap-5 text-gray-500'>
        {user && (
          <>
            <button onClick={handleEducatorClick}>
              {isEducator ? 'Educator Dashboard' : 'Become Educator'}
            </button>
            <Link to='/my-enrollments'>My Enrollments</Link>
          </>
        )}

        {user ? (
          <UserButton />
        ) : (
          <button
            onClick={() => openSignIn()}
            className='bg-blue-600 text-white px-5 py-2 rounded-full cursor-pointer'
          >
            Create account
          </button>
        )}
      </div>

      {/* ===================== MOBILE ===================== */}
      <div className='md:hidden flex items-center gap-2 text-gray-500'>
        {user && (
          <>
            <button onClick={handleEducatorClick}>
              {isEducator ? 'Educator Dashboard' : 'Become Educator'}
            </button>
            <Link to='/my-enrollments'>My Enrollments</Link>
          </>
        )}

        {user ? (
          <UserButton />
        ) : (
          <button onClick={() => openSignIn()}>
            <img src={assets.user_icon} alt='user' />
          </button>
        )}
      </div>
    </div>
  )
}

export default Navbar
