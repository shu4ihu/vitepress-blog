# Hooks

Hooks 是 React 在 16.8 版本引入的新特性，个人感觉这是 React 从类组件转向函数组件或者说拥抱函数组件的一次更新。

翻阅官方文档也确实如此，文档中讲到了 **Hooks are a new addition in React 16.8. They let you use state and other React features without writing a class.** 可以让你在不需要写一个类组件的情况下，使用到 state 和其他的 React 特性。

## Hooks Motivation

紧接着，文档提到了提出 Hooks 的动机。
1. It’s hard to reuse stateful logic between components
2. Complex components become hard to understand
3. Classes confuse both people and machines

先翻译下这 3 句话：
1. 在组件之间难以复用状态逻辑
2. 复杂的组件变得难以理解
3. 类组件使人和计算机都混淆了

基于上述的 3 个问题，React 提出了 Hooks，Hooks 允许开发者在不编写类组件的情况下，使用 state 和其他 React 特性。

下面针对这 3 个问题来讨论一下，使用 hooks 和不使用 hooks 之间的区别：

### 在组件之间难以复用状态逻辑

考虑一个场景，需要在多个组件中实现功能：监听窗口宽度，并根据宽度的变化做出响应。在类组件中，实现的代码可能会是这样的：

```javascript
// 在类组件中监听窗口宽度变化
class WidthListenerComponent extends React.Component {
  state = { width: window.innerWidth };

  updateWidth = () => {
    this.setState({ width: window.innerWidth });
  };

  componentDidMount() {
    window.addEventListener('resize', this.updateWidth);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWidth);
  }

  render() {
    return <div>Current window width: {this.state.width}</div>;
  }
}
```

要是现在需要再另外一个组件中也实现这个功能，难道要把上述的代码复制到新的组件中吗？显然不可能，我们可以使用高阶组件的方法来实现对这部分逻辑的封装或是复用，高阶组件就是一个函数，接受一个组件作为参数，返回一个新的组件。

使用高阶组件的好处是可以在不修改原始组件代码的情况下，为组件添加新的功能或数据，这其实是装饰器模式的一种体现。下面看看是如何通过高阶组件复用状态逻辑的：

```javascript
function withWindowWidth(WrappedComponent) {
  return class extends React.Component {
    state = { width: window.innerWidth };

    updateWidth = () => {
      this.setState({ width: window.innerWidth });
    };

    componentDidMount() {
      window.addEventListener('resize', this.updateWidth);
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.updateWidth);
    }

    render() {
      // 将当前窗口宽度作为prop传递给WrappedComponent
      return <WrappedComponent {...this.props} width={this.state.width} />;
    }
  };
}

// 被包裹的组件
class MyComponent extends React.Component {
  render() {
    // 从props中获取width
    const { width } = this.props;
    return <div>Current window width: {width}</div>;
  }
}

// 使用高阶组件包裹MyComponent
const EnhancedMyComponent = withWindowWidth(MyComponent);
```

可以看到，当我们需要为组件添加可复用的逻辑时，只需要再写一个 HOC（高阶组件），然后同样再包装一层即可。看起来是非常方便的事，就好像给一个人穿衣服，先穿一件短袖，觉得有点冷可以再穿一件薄薄的外套，如果还是很冷还可以再穿一件羽绒服，只要你觉得还是很冷，你就可以一直穿。但是随着越穿越多，人会变得很臃肿很迟钝。

这个也是 HOC 的潜在问题，当一个组件被多个 HOC 包装时，层级会变得越来越复杂，而 React 是组件级的更新粒度，也就是说，当组件的 state 或 props 发生变化时，React 会重新渲染该组件及其子组件，这就导致在组件层级复杂的情况下，有时会影响性能。

而且，当多个 HOC 向组件传递相同名称的 props 时，也会导致命名冲突的发生，这个时候后者会覆盖前者，同时，props 的来源也难以追踪。

自定义 Hooks 可以封装并共享状态逻辑，使用时只需调用 Hook 函数即可复用逻辑。Hooks 不会增加组件树中的层级，因为它们是函数，不像 HOC 那样返回一个新的组件。使用 Hooks ，状态逻辑可以写在函数内部，而不需要通过 props 传递，消除了命名冲突的问题。

```javascript
// 使用自定义Hook实现窗口宽度监听
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}

// 使用自定义Hook的组件
function WidthListenerComponent() {
  const width = useWindowWidth();
  return <div>Current window width: {width}</div>;
}
```

### 复杂的组件变得难以理解

当一个类组件包含多种 state 字段和多个生命周期函数时，理解组件的工作原理就会变得相当棘手。每个生命周期函数通常包含多种不相关的逻辑，例如在 componentDidMount 或 componentDidUpdate 中同时发起网络请求、设置事件监听器、操作 DOM 等。Hooks 允许你根据逻辑关联而不是生命周期事件来组织代码，从而使得组件变得更易于理解和管理。

从上面的两个代码方案的对比就可以发现，类组件的代码比起使用了 Hooks 的函数组件要多了不少，在更为复杂的业务组件中，也是一样的。

### 类组件使人和计算机都混淆了

这个问题其实主要是体现在类组件的 this 指向问题上，通常是发生在开发者试图在某个类组件的方法中访问 this.props 或 this.state，如果方法没有被正确地绑定到类的实例上，this 可能会指向不正确的上下文，导致运行错误。

```javascript
class ToggleButton extends React.Component {
   state = {
      isToggleOn: true
   };

   handleClick() {
      this.setState(prevState => ({
         isToggleOn: !prevState.isToggleOn
      }));
   }

   render() {
      return (
         <button onClick={this.handleClick}>
            {this.state.isToggleOn ? 'ON' : 'OFF'}
         </button>
      );
   }
}
```

在上面的例子中，如果按钮被点击，会报错，因为 this 并没有被绑定到组件实例上。要修复这个问题，有以下方法：
1. 在构造函数中绑定实例
  ```javascript
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }
  ```
2. 使用箭头函数来声明方法

如果使用 Hooks 加函数组件的方案，则不需要考虑 this 的问题。

```javascript
function ToggleButton() {
  // 使用useState Hook来创建isToggleOn状态变量及其更新函数setIsToggleOn
  const [isToggleOn, setIsToggleOn] = useState(true);

  // handleClick函数会在按钮被点击时调用，用来切换isToggleOn状态
  const handleClick = () => {
    setIsToggleOn(prevIsToggleOn => !prevIsToggleOn);
  };

  // 渲染按钮，并将按钮的点击事件处理器设置为handleClick函数
  // 当isToggleOn状态变化时，按钮的文本也会相应更新
  return (
    <button onClick={handleClick}>
      {isToggleOn ? 'ON' : 'OFF'}
    </button>
  );
}
```