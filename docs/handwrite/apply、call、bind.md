# apply、call、bind

这三个函数都是 Javascript 中用于改变普通函数 this 指向的方法，是 Function 的原型上的方法。

### 区别

- apply、call 会在改变 this 之后直接执行一次原函数，bind 则是返回一个改变了 this 的新函数但是不执行
- call、bind 接受多个参数，而 apply 只接受两个参数：第一个是 this 指向的对象，第二个是参数列表

### apply

```javascript
Function.prototype.myApply = function(context = window, args = []) {
  if (typeof this !== 'function') {
    throw new TypeError('Type Error')
  }

  const fn = Symbol()
  context[fn] = this
  let res
  if (Array.isArray(args)) {
    res = context[fn](...args)
  }

  delete context[fn]
  return res
}
```

### call

```javascript
Function.prototype.myCall = function(context = window, ...args) {
  if (typeof this !== 'function') throw new TypeError('Type Error')

  const fn = Symbol()
  context[fn] = this
  const res = context[fn](...args)
  delete context[fn]
  return res
}
```

### bind

```javascript
Function.prototype.myBind = function(context = window, ...bindArgs) {
  if (typeof this !== 'function') throw new TypeError('Type Error')

  const self = this
  return function(...args) {
    return self.apply(context, bindArgs.concat(args))
  }
}
```