import './config/env'
import './config/dayjs'
import app from './app'
import { env } from './config/env'

app.listen(env.PORT, () => {
  console.log(`BE running on port ${env.PORT} [${env.NODE_ENV}]`)
})
