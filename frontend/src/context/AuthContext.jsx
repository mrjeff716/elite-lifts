import { createContext, useCallback, useEffect, useState } from 'react'
import axios from '../api'

export const AuthContext = createContext()

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const refreshUser = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = !window.location.href.includes('/reset-password') && await axios.get('/user')
      setUser(res.data.user)
    } catch (err) {
      setUser(null)
      if (err.response?.status !== 401) setError('Unable to connect to Elite Lifts. Check that the server is running and try again.')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { refreshUser() }, [refreshUser])
  return (<>
  <AuthContext.Provider value={{user, setUser, loading, error, refreshUser}}>
    {children}
  </AuthContext.Provider>
  </>)
}
