import axios from '../api'
import { createGoogleHandoff } from './googleHandoff'

export const googleHandoff = createGoogleHandoff({
  storage: window.localStorage,
  cryptoApi: window.crypto,
  exchange: body => axios.post('/google/mobile/exchange', body),
})
