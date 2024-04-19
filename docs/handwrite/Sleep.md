# 手写 Sleep

两种方案：
1. 异步等待，Promise 里面设置一个定时器，时间到了 resolve，后续操作需要通过 then，这种方式下，可以在等待期间处理其他任务
2. 同步等待，记录开始时间，不断循环比较当前时间与开始时间的差值，直到超过约定时间才退出循环，会完全阻塞 js 线程直到循环结束

```javascript
function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

function sleep(time) {
  let prev = Date.now()
  while (Date.now() - prev <= time) {
    continue
  }
}
```