import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import axios from '../api'

export const AuthContext = createContext()

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestVersion = useRef(0)
  const refreshUser = useCallback(async () => {
    const version = ++requestVersion.current
    setLoading(true)
    setError('')
    try {
      const res = await axios.get('/user')
      if (version === requestVersion.current) setUser(res.data.user)
      return res.data.user
    } catch (err) {
      if (version === requestVersion.current) {
        setUser(null)
        if (err.response?.status !== 401) setError('Unable to connect to Elite Lifts. Check that the server is running and try again.')
      }
      return null
        
    } finally {
      if (version === requestVersion.current) setLoading(false)
    }
  }, [])
  useEffect(() => { refreshUser() }, [refreshUser])
  return (<>
  <AuthContext.Provider value={{user, setUser, loading, error, refreshUser}}>
    {children}
  </AuthContext.Provider>
  </>)
}
