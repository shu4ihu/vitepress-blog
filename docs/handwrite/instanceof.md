# instanceof

`instanceof` 是 JS 的一个运算符，用于检测一个对象的原型链上是否有指定的构造函数。

```javascript
function myInstanceof(leftVal, rightVal) {
  if (typeof leftVal !== 'object') return false

  if (typeof rightVal !== 'function') throw new Error('right-hand side is not a function')

  let proto = Object.getPrototypeOf(leftVal)

  while (proto !== null) {
    if (proto === rightVal) return true
    proto = Object.getPrototypeOf(proto)
  }

  return false
}
```