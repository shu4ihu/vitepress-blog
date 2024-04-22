# 手写 Promise

根据 Promise A+ 规范对 Promise 的定义，「`promise` 是一个拥有符合本规范的 then 方法的对象或者函数」

规范要求：

1. 状态：pending、fulfilled、rejected

    pending → fulfilled || rejected ☑️

    fulfilled || rejected → 任意状态 ❌

    当promise 处于 fulfilled 或 rejected 状态时，必须有一个对应的value 或 reason
2. then 方法

    promise 必须要提供一个 then 方法，并能通过此方法去访问当前或者最终的 value 或 reason

    then 方法接受两个可选参数 `onFulfilled` 和 `onRejected` 

    1. then 必须要返回promise
    2. then可以被同一个promise重复调用
    3. 针对`onFulfilled` 和 `onRejected` 的情况分析
        - 不是函数，则忽略
        - `onFulfilled` 是一个函数

            必须在promise的状态被`fulfilled` 之后，以promise的 value 作为第一个参数调用

            不能再promise改变状态之前调用

            只能被调用一次
        - `onRejected` 同理

        两个回调函数只能以函数形式调用
3. 特殊情况
    1. 自引用、循环引用检测
    2. 处理promise

```JavaScript
let x = new Promise((resolve, reject) => {
  resolve(100);
});

let promise = new Promise((resolve, reject) => {
  resolve(x); // promise的状态将跟随x的状态
});

promise.then(value => {
  console.log(value); // 100
});
```
    3. 处理thenable对象

```JavaScript
let x = {
  then: function(resolve, reject) {
    resolve(42);
  }
};

let promise = new Promise((resolve, reject) => {
  resolve(x); // promise解析thenable对象x
});

promise.then(value => {
  console.log(value); // 42
});

```
    4. 处理非thenable的值，穿透

```javascript
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

class MyPromise {
	#state = PENDING;
	#result = undefined;
	#handlers = [];

	#isPromise(value) {
		if (value !== null && (typeof value === "object" || typeof value === "function")) {
			return typeof value.then === "function";
		}
		return false;
	}

	#runMicroTask(func) {
		// node 环境
		if (typeof process === "object" && typeof process.nextTick === "function") {
			process.nextTick(func);
		} else if (typeof MutationObserver === "function") {
			const ob = new MutationObserver(func);
			const text = document.createTextNode("1");
			ob.observe(text, {
				characterData: true,
			});
			text = 2;
		} else {
			setTimeout(func, 0);
		}
	}

	#runOne(callback, resolve, reject) {
		this.#runMicroTask(() => {
			if (typeof callback === "function") {
				try {
					const data = callback(this.#result);
					if (this.#isPromise(data)) {
						data.then(resolve, reject);
					} else resolve(data);
				} catch (err) {
					reject(err);
				}
			} else {
				const settled = this.#state === FULFILLED ? resolve : reject;
				settled(this.#result);
				return;
			}
		});
	}

	#run() {
		if (this.#state === PENDING) return;
		while (this.#handlers.length) {
			const { onFulfilled, onRejected, resolve, reject } = this.#handlers.shift();
			if (this.#state === FULFILLED) {
				this.#runOne(onFulfilled, resolve, reject);
			} else {
				this.#runOne(onRejected, resolve, reject);
			}
		}
	}

	#changeState(state, result) {
		if (this.#state !== PENDING) return;
		this.#state = state;
		this.#result = result;
		this.#run();
	}

	then(onFulfilled, onRejected) {
		return new MyPromise((resolve, reject) => {
			console.log(this.#handlers.length);
			this.#handlers.push({
				onFulfilled,
				onRejected,
				resolve,
				reject,
			});
			this.#run();
		});
	}

	constructor(executor) {
		const resolve = (result) => {
			this.#changeState(FULFILLED, result);
		};
		const reject = (reason) => {
			this.#changeState(REJECTED, reason);
		};
		try {
			executor(resolve, reject);
		} catch (err) {
			reject(REJECTED, err);
		}
	}
}
```

## Promise.all

根据阮一峰老师对 all 的介绍，这个方法是用于将多个 Promise 实例，包装成一个新的 Promise 实例。

个人理解这句话，一个 Promise 实例是只有一个状态的，而多个 Promise 实例是有多个状态的，那么将多个 Promise 实例包装成一个新的 Promise 实例，其实就很好理解，新的 Promise 实例的状态是根据旧的多个 Promise 实例的状态决定的。

其实具体来看也是如此，场景如下：

```javascript
const p = Promise.all([p1, p2, p3])
```

我们都知道 Promise 有三种状态，包含一种初始态 (pending)、两种最终态 (fulfilled、rejected)。那么 all 方法返回的新 Promise 实例的最终态也不外乎两种，所以我们只需要知道哪种情况下对应 pending -> fulfilled 和 pending -> rejected，那么就能理解并手写 all 方法。

以上述代码为例：
1. pending -> fulfilled：只有传入参数中的所有 Promise 实例的状态都变成 fulfilled，那么 p 的状态也会切换成 fulfilled，此时所有 Promise 实例的返回值都会组成一个数组，然后传递给 p 的回调函数
2. pending -> rejected：只要传入参数中的 Promise 实例有一个状态变成 rejected，那么 p 的状态也会切换成 rejected，此时第一个被 reject 的实例的返回值就会被传递给 p 的回调函数

所以，对于传入的 Promise 实例数组来说，all 是非常苛刻的，只要失败一个就是失败。当然对于 all 来说，接受的参数不一定必须是 Promise 实例数组，只要传入的参数具有 Iterator 接口即可。

完整代码如下：
```javascript
function promiseAll(arr) {
  if (typeof arr[Symbol.iterator] !== 'function') {
    throw new TypeError(`${arr} is not iterable`)
  }
  if (arr.length === 0) {
    return Promise.resolve([])
  }
  return new Promise((resolve, reject) => {
    // 记录已经 resolve 的 promise 的数量
    let resolvedCount = 0
    // 记录 resolve 后的结果
    const res = new Array(arr.length)

    for (let i = 0; i < arr.length; i++) {
      Promise.resolve(arr[i]).then(
        // 成功
        value => {
          resolvedCount++
          res[i] = value

          // 全部都成功了，将所有结果 resolve
          if (resolvedCount === arr.length) {
            resolve(res)
          }
        }, 
        // 失败
        err => {
          // 直接 reject
          reject(err)
        }
      )
    }
  })
}
```

## Promise.allSettled

跟 all 挺相似的，区别在于，all 中的单个实例的 rejectd 状态会直接影响新实例的状态，导致新实例也变成 rejectd，而 allSettled 则是等待所有给定的 Promise 实例已经 fulfilled 或 rejected。allSettled 只有 pending 和 fulfilled 状态，对于 allSettled 来说，pending 状态就是所有 Promise 实例都还没有完成，fulfilled 状态就是所有 Promise 实例都已经完成。allSettled 返回值也会传递给新实例的回调函数，返回值是一个数组，数组中的每个元素都是一个结果对象，结果对象包含 status ("fulfilled" 或 "rejected") 和 value 或 reason 分别对应两个 status。

完整代码如下：

```javascript
function promiseAllSettled(arr) {
  if (typeof arr[Symbol.iterator] !== 'function') {
    throw new Error(`${arr} is not iterable`)
  }

  return new Promise((resolve) => {
    if (arr.length === 0) resolve([])

    let settledCount = 0
    const res = new Array(arr.length)

    arr.forEach((p, index) => {
      Promise.resolve(p).then(val => {
        settledCount++
        res[index] = {
          status = 'fulfilled',
          value = val
        }
        if (settledCount === arr.length) resolve(res)
      },
      err => {
        settledCount++
        res[index] = {
          status = 'rejected',
          reason = err
        }
        if (settledCount === arr.length) resolve(res)
      }
      )
    })
  })
}
```

## Promise.race

描述上跟 all 相似，race 同样是将多个 Promise 实例包装成一个新的 Promise 实例，但是实际行为跟 all 却是反着来，理解起来比 all 更加简单，就是原先的多个 Promise 实例中，
最先改变状态的实例，新实例的状态跟它一起改变，改变之后返回值就会传递给新实例的回调函数

```javascript
function promiseRace(arr) {
  if (typeof arr[Symbol.iterator] !== 'function') {
    throw new TypeError(`${arr} is not iterable`)
  }
  if (arr.length === 0) {
    throw new TypeError('can not be empty')
  }
  return new Promise((resolve, reject) => {
    arr.forEach(p => {
      Promise.resolve(p).then(val => resolve(val), err => reject(err))
    })
  })
}
```

## Promise.any

个人感觉 any 就是反过来的 all， all 的状态变化规则是：
- 全部 fulfilled 才 fulfilled，有 rejected 就 rejected
而 any 的状态变化规则是：
- 全部 rejected 才 rejected，有 fulfilled 就 fulfilled

所以，会手写 all，就能手写 any，因为它们的原理是很类似的，直接上代码：

```javascript
function promiseAny(arr) {
  if (typeof arr[Symbol.iterator] !== 'function') {
    throw new Error(`${arr} is not iterable`)
  }

  return new Promise((resolve, reject) => {
    if (arr.length === 0) reject(new AggregateError([], 'All promises were rejected'))
    let rejectedCount = 0
    const res = new Array(arr.length)
    arr.forEach((p, index) => {
      Promise.resolve(p).then(val => {
        resolve(val)
      },
      err => {
        rejectedCount++
        res[index] = err

        if (rejectedCount === arr.length) {
          reject(new AggregateError(res))
        }
      })
    })
  })
}
```

额外介绍一下 AggregateError 对象，这个错误对象是在 ES2021 中，为了配合 any 新引入的错误对象，可以在一个 AggregateError 错误对象中封装多个不同的错误。如果是某个操作同时引发了多个错误需要将全部错误信息都抛出，那么就可以抛出一个 AggregateError 错误对象，将各种错误封装在这个对象中。

AggregateError 本身就是一个构造函数，接受 2 个参数：
- errors：错误对象数组，该参数是必须的。
- message：字符串，表示该对象抛出时的错误信息，该参数是可选的。