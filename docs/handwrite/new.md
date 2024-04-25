# new

先来搞清楚 `new` 到底做了什么事？

红宝书原话：

使用 `new` 调用构造函数会执行如下操作。

1. 在内存中创建一个新对象
2. 这个新对象内部的 `[[Prototype]]` 特性被赋值为构造函数的 `prototype` 属性
3. 构造函数内部的 `this` 被赋值为这个新对象（即 `this` 指向新对象）
4. 执行构造函数内部的代码（给新对象添加属性）
5. 如果构造函数返回非空对象，则返回该对象；否则，返回刚创建的新对象

```javascript
function myNew(constructor, ...args) {
  const obj = {}
  Object.setPrototypeOf(obj, constructor.prototype)
  const res = constructor.apply(obj, args)
  return Object.prototype.toString.call(res) === '[object Object]' ? res : obj
}

function Func(name) {
  this.name = name
}

const f = myNew(Func, 'name')
```