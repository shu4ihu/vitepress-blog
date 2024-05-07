# 模块化

ES6 之前，JavaScript 一直没有模块体系，因此出现了一批社区定制的模块加载方案，包括 `CommonJS` 和 `AMD` ，前者用于服务器，后者用于浏览器。
后来，ES6 在语言标准层面上，实现了模块功能，足可以取代 CJS 和 AMD 规范。

ES6 模块（简称 ESM）的设计思想是尽量静态化，使得在编译时就能确定模块的依赖关系，以及输入和输出变量。CJS 和 AMD 都只能在运行时确定。

```javascript
// CJS
const { readfile } = require('fs')
```

本质上说，上面代码是先整体加载 `fs` 模块，生成一个对象，然后再从对象上读取 `readfile` 方法。上述加载过程称为 `运行时加载`，因为只有在运行时才能得到这个对象，导致没办法在编译时做 **静态优化**。

```javascript
import { readfile } from 'fs'
```

而 ESM 与 CJS 不同，上面的代码只会从 `fs` 模块中加载 `readfile` 方法，其他方法不加载。这种加载称为“编译时加载”（ES6 可以在编译时就完成模块的加载），效率要比 CJS 高。

import 命令会被 JS 引擎静态分析，先于模块内的其他语句执行。因此，把 import 置于 if 语句内会报错：

```javascript
if (true) {
  import a from './a'
}
```

上述代码中，引擎处理 import 是在编译时，所以并不会分析或执行 if 语句，所以 import 放在 if 内毫无意义，会直接报语法错误。

**无论是 import 或 export 都只能在模块顶层，不能出现在代码块中。**

通过这样的设计，能够有效提高编译器的编译效率，但是也导致了无法在运行时加载模块。因此，如果想要 import 彻底取代 require 就不可能，因为 require 就是运行时加载模块，import 无法动摇 require 在动态加载方面的地位。

因此，ES2020 提案引入了 `import()` 函数，支持动态加载模块，希望取替 require。

`import()` 返回一个 Promise 对象， `import()` 可以用在任何地方，不仅是模块，非模块的脚本也可以使用，它是运行时执行的（什么时候运行到这一句，就会加载指定的模块）。

`import()` 与它所加载的模块没有静态连接关系，与 `require()` 是类似的，区别在于 `import()` 是**异步**的，而 `require()` 是**同步**的。

`import()` 的使用场景：

1. 按需加载
2. 条件加载

## ESM 和 CJS

- 编译时 vs 运行时

    ESM 希望在编译阶段就确定模块的依赖关系，而不是像 CJS 一样是在运行阶段才知道
- 异步加载 vs 同步加载

    ESM 在浏览器中是通过发请求的方式异步加载模块，而CJS则是以同步阻塞的形式加载模块
- 导入的值的区别

    ESM import 导入的是**引用**，CJS require 导入的是**拷贝**（对于基本数据类型就是值拷贝，对于引用数据类型就是浅拷贝）

```JavaScript
// ESM
// counter.js
export let count = 0;

export function increment() {
  count++;
}

export function decrement() {
  count--;
}

// app.js
import { count, increment } from 'counter.js';

console.log(count); // 输出：0
increment();
console.log(count); // 输出：1
```

```JavaScript
// CJS
// counter.js
let count = 0;

function increment() {
  count++;
}

module.exports = {
  increment,
  count
};

// app.js
const { count, increment } = require("./counter");

console.log(count); // 输出：0
increment();
console.log(count); // 输出：0

```