import * as _ from 'lodash'
import f from 'isomorphic-unfetch'

export const fetch = (url, options) => {
  return f(url, options)
    .then(response => response.json())
    .then(response => {
      if (response.error) {
        console.error(`Error fetching ${url}:`)
        console.error(response.error)
      } else {
        if (process.browser) {
          console.log(`Successfully fetched ${url}:`)
          console.log(response.data)
        }
        return response.data
      }
    })
}
