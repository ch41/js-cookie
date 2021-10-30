/* eslint-disable no-var */
import assign from './assign.mjs'
import defaultConverter from './converter.mjs'

function init (converter, defaultAttributes) {
  function set (name, value, attributes) {
    if (typeof document === 'undefined') {
      return
    }

    attributes = assign({}, defaultAttributes, attributes)

    if (typeof attributes.expires === 'number') {
      attributes.expires = new Date(Date.now() + attributes.expires * 864e5)
    }
    if (attributes.expires) {
      attributes.expires = attributes.expires.toUTCString()
    }

    name = encodeURIComponent(name)
      .replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent)
      .replace(/[()]/g, escape)

    var stringifiedAttributes = ''
    for (var attributeName in attributes) {
      if (!attributes[attributeName]) {
        continue
      }

      stringifiedAttributes += '; ' + attributeName

      if (attributes[attributeName] === true) {
        continue
      }

      // Considers RFC 6265 section 5.2:
      // ...
      // 3.  If the remaining unparsed-attributes contains a %x3B (";")
      //     character:
      // Consume the characters of the unparsed-attributes up to,
      // not including, the first %x3B (";") character.
      // ...
      stringifiedAttributes += '=' + attributes[attributeName].split(';')[0]
    }

    return (document.cookie =
      name + '=' + converter.write(value, name) + stringifiedAttributes)
  }

  function get (name) {
    if (typeof document === 'undefined' || (arguments.length && !name)) {
      return
    }

    // js-cookie 的实现有点浪费
    let cookies = document.cookie
    const jar = {}
    while (cookies.length > 0) {
      let part
      const splitIndex = cookies.indexOf('; ')

      if (splitIndex > -1) {
        part = cookies.slice(0, splitIndex)
        cookies = cookies.slice(splitIndex + 2)
      } else {
        part = cookies
        cookies = ''
      }

      const equalIndex = part.indexOf('=')

      try {
        const key = decodeURIComponent(part.slice(0, equalIndex))

        if (name) {
          if (name === key) {
            return converter.read(part.slice(equalIndex + 1), key)
          }
        } else {
          jar[key] = converter.read(part.slice(equalIndex + 1), key)
        }
      } catch (e) {
        //
      }
    }

    return name ? undefined : jar

    // let pos = 0
    // const jar = {}
    // while (pos < cookies.length) {
    //   let start = pos
    //   while (cookies[pos] !== '=') pos++
    //   try {
    //     let key = ''
    //     try {
    //       key = decodeURIComponent(cookies.slice(start, pos))
    //     } catch (e) {
    //       // parse 继续
    //     }

    //     // eat '='
    //     pos++
    //     start = pos
    //     while (cookies[pos] !== ';' && pos < cookies.length) pos++
    //     const value = cookies.slice(start, pos)

    //     if (name && name === key) return converter.read(value, key)

    //     // eat "; "
    //     if (pos < cookies.length) pos += 2
    //     if (key) jar[key] = converter.read(value, key)
    //   } catch (e) {
    //     //
    //   }
    // }
    // return name ? undefined : jar

    // To prevent the for loop in the first place assign an empty array
    // in case there are no cookies at all.
    // const cookies = document.cookie
    // let pos = 0
    // while (pos < cookies.length) {
    //   let start = pos
    //   while (cookies[pos] !== '=') pos++
    //   try {
    //     const key = decodeURIComponent(cookies.slice(start, pos))
    //     if (key === name) {
    //       // eat '='
    //       pos++
    //       start = pos
    //       while (cookies[pos] !== ';' && pos < cookies.length) pos++
    //       const value = cookies.slice(start, pos)
    //       return converter.read(value, key)
    //     } else {
    //       while (cookies[pos] !== ';' && cookies[pos + 1] !== ' ' && pos < cookies.length) pos++
    //       // eat "; "
    //       if (pos < cookies.length) pos += 2
    //     }
    //   } catch (e) {}
    // }

    // return undefined
  }

  return Object.create(
    {
      set: set,
      get: get,
      remove: function (name, attributes) {
        set(
          name,
          '',
          assign({}, attributes, {
            expires: -1
          })
        )
      },
      withAttributes: function (attributes) {
        return init(this.converter, assign({}, this.attributes, attributes))
      },
      withConverter: function (converter) {
        return init(assign({}, this.converter, converter), this.attributes)
      }
    },
    {
      attributes: { value: Object.freeze(defaultAttributes) },
      converter: { value: Object.freeze(converter) }
    }
  )
}

export default init(defaultConverter, { path: '/' })
/* eslint-enable no-var */
