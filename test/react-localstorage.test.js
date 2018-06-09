const React = require('react');
const TestUtil = require('react-dom/test-utils');
const withLocalStorage = require('../react-localstorage');
const assert = require('assert');

const ls = require('localforage')
describe("suite", function() {
  beforeEach(function(){
    // Cheap way to make the warn function throw so we can catch it easily
    console.warn = function() { throw new Error([].slice.call(arguments).join(' ')); };
    return ls.clear();
  });

  class _ComponentUseDisplayName extends React.Component {
    static displayName = 'component1';
    render() {
      return <div>hello</div>;
    }
  }
  const ComponentUseDisplayName = withLocalStorage(_ComponentUseDisplayName)

  // Change in v1; we now do this on componentWillUnmount
  it("should not save after each setState", async function(done) {
    const component = TestUtil.renderIntoDocument(<ComponentUseDisplayName />);
    await new Promise(resolve => setTimeout(resolve)) // allow for componentDidMount() to finish
    component.setState({
      a: 'world'
    }, async function() {
      assert.equal(
        null,
        await ls.getItem('component1')
      );
      done();
    });
    component.componentWillUnmount();
  });

  it("should use displayName to store into localstorage", async function() {
    const component = TestUtil.renderIntoDocument(<ComponentUseDisplayName />);
    await new Promise(resolve => setTimeout(resolve)) // allow for componentDidMount() to finish
    component.setState({
      a: 'world'
    });
    await component.componentWillUnmount();
    assert.equal(
      JSON.stringify({a: 'world'}),
      await ls.getItem('component1')
    );
  });

  class _ComponentUseStorageKey extends React.Component {
    static displayName = 'component2';
    static defaultProps = {
      'localStorageKey': 'component-key'
    };
    render() {
      return <div>hello</div>;
    }
  }
  const ComponentUseStorageKey = withLocalStorage(_ComponentUseStorageKey)

  it("should use this.props.localStorageKey to store into localstorage", async function() {
    const component = TestUtil.renderIntoDocument(<ComponentUseStorageKey />);
    await new Promise(resolve => setTimeout(resolve)) // allow for componentDidMount() to finish
    component.setState({
      hello: 'moon'
    });
    await component.componentWillUnmount();
    assert.equal(
      JSON.stringify({hello: 'moon'}),
      await ls.getItem('component-key')
    );
  });

  class _ComponentUseMethod extends React.Component {
    static displayName = 'ComponentUseMethod';
    getLocalStorageKey() {
      return this.constructor.displayName + 'DynamicSuffix';
    }
    render() {
      return <div>hello</div>;
    }
  }
  const ComponentUseMethod = withLocalStorage(_ComponentUseMethod)

  it("should use this.getLocalStorageKey() to store into localstorage", async function() {
    const component = TestUtil.renderIntoDocument(<ComponentUseMethod />);
    await new Promise(resolve => setTimeout(resolve)) // allow for componentDidMount() to finish
    component.setState({
      rubber: 'ducky'
    });
    await component.componentWillUnmount();
    assert.equal(
      JSON.stringify({rubber: 'ducky'}),
      await ls.getItem('ComponentUseMethodDynamicSuffix')
    );
  });

  class _ComponentWithNoSetting extends React.Component {
    static displayName = 'ComponentWithNoSetting';
    render() {
      return <div>hello</div>;
    }
  }
  const ComponentWithNoSetting = withLocalStorage(_ComponentWithNoSetting)

  it("should use ComponentWithNoSetting to store into localstorage", async function() {
    const component = TestUtil.renderIntoDocument(<ComponentWithNoSetting />);
    await new Promise(resolve => setTimeout(resolve)) // allow for componentDidMount() to finish
    component.setState({
      hello: 'star'
    });
    await component.componentWillUnmount();
    assert.equal(
      JSON.stringify({hello: 'star'}),
      await ls.getItem('ComponentWithNoSetting') // NOTICE: not `react-localstorage` because of displayName
    );
  });

  class _ComponentUseStateFilter extends React.Component {
    static displayName = 'componentStateFilter';
    static defaultProps = {
      stateFilterKeys: ['a', 'b']
    };
    render() {
      return <div>hello</div>;
    }
  }
  const ComponentUseStateFilter = withLocalStorage(_ComponentUseStateFilter)

  it("should only use state keys that match filter", async function() {
    const component = TestUtil.renderIntoDocument(<ComponentUseStateFilter />);
    await new Promise(resolve => setTimeout(resolve)) // allow for componentDidMount() to finish
    component.setState({
      a: 'world',
      b: 'bar',
      c: 'shouldNotSync'
    });
    await component.componentWillUnmount();
    assert.equal(
      JSON.stringify({a: 'world', 'b': 'bar'}),
      await ls.getItem('componentStateFilter')
    );
  });

  class _ComponentUseStateFilterFunc extends React.Component {
    static displayName = 'componentStateFilterFunc';
    getStateFilterKeys() {
      return ['a', 'b'];
    }
    render() {
      return <div>hello</div>;
    }
  }
  const ComponentUseStateFilterFunc = withLocalStorage(_ComponentUseStateFilterFunc)

  it("should only use state keys that match filter function", async function() {
    const component = TestUtil.renderIntoDocument(<ComponentUseStateFilterFunc />);
    await new Promise(resolve => setTimeout(resolve)) // allow for componentDidMount() to finish
    component.setState({
      a: 'world',
      b: 'bar',
      c: 'shouldNotSync'
    });
    await component.componentWillUnmount();
    assert.equal(
      JSON.stringify({a: 'world', 'b': 'bar'}),
      await ls.getItem('componentStateFilterFunc')
    );
  });

  class _ComponentWithLifecycle extends React.Component {
    static displayName = 'ComponentWithLifecycle';
    componentDidMount() {
      this.setState({
        a: 'world',
      });
    }
    render() {
      return <div>hello</div>;
    }
    componentWillUnmount() {
      this.setState({
        b: 'bar',
      });
    }
  }
  const ComponentWithLifecycle = withLocalStorage(_ComponentWithLifecycle)

  it("should run lifecycle methods of wrapped component", async function() {
    const component = TestUtil.renderIntoDocument(<ComponentWithLifecycle />);
    await new Promise(resolve => setTimeout(resolve)) // allow for componentDidMount() to finish
    assert.deepEqual(component.state, {a: 'world'})
    await component.componentWillUnmount();
    assert.equal(
      JSON.stringify({a: 'world', 'b': 'bar'}),
      await ls.getItem('ComponentWithLifecycle')
    );
  });

  it("should shut off LS syncing with localStorageKey=false", async function() {
    const component = TestUtil.renderIntoDocument(<ComponentUseDisplayName />);
    await new Promise(resolve => setTimeout(resolve)) // allow for componentDidMount() to finish
    component.setState({
      a: 'world',
    });
    await component.componentWillUnmount();
    assert.equal(
      JSON.stringify({a: 'world'}),
      await ls.getItem('component1')
    );

    const component2 = TestUtil.renderIntoDocument(<ComponentUseDisplayName localStorageKey={false} />);
    await new Promise(resolve => setTimeout(resolve)) // allow for componentDidMount() to finish
    component2.setState({
      a: 'hello',
    });
    await component.componentWillUnmount();
    assert.equal(
      JSON.stringify({a: 'world'}),
      await ls.getItem('component1')
    );
  });

  it("should support function as LS key", async function() {
    const component = TestUtil.renderIntoDocument(
      <ComponentUseDisplayName localStorageKey={function() { return this.props.otherKey; }} otherKey="jenkees" />
    );
    await new Promise(resolve => setTimeout(resolve)) // allow for componentDidMount() to finish
    component.setState({
      a: 'world',
    });
    await component.componentWillUnmount();
    assert.equal(
      JSON.stringify({a: 'world'}),
      await ls.getItem('jenkees')
    );

    // Check returning false
    const component2 = TestUtil.renderIntoDocument(<ComponentUseDisplayName localStorageKey={() => false} />);
    await new Promise(resolve => setTimeout(resolve)) // allow for componentDidMount() to finish
    component2.setState({
      a: 'hello',
    });
    await component.componentWillUnmount();
    assert.equal(
      JSON.stringify({a: 'world'}),
      await ls.getItem('jenkees')
    );
  });

  it('should sync on beforeunload, then remove itself', async function() {
    const eventMap = {};
    global.addEventListener = jest.fn((event, cb) => {
      eventMap[event] = cb;
    });
    global.removeEventListener = jest.fn((event, cb) => {
      if (event === 'beforeunload' && eventMap[event] !== cb) throw new Error();
      delete eventMap[event];
    });

    const component = TestUtil.renderIntoDocument(
      <ComponentUseDisplayName localStorageKey="beforeunload" />
    );
    await new Promise(resolve => setTimeout(resolve)) // allow for componentDidMount() to finish
    component.setState({
      a: 'world',
    });
    assert(typeof eventMap['beforeunload'] === 'function');

    assert.equal(
      null,
      await ls.getItem('beforeunload')
    );

    await eventMap['beforeunload']();

    assert.equal(
      JSON.stringify({a: 'world'}),
      await ls.getItem('beforeunload')
    );

    // Should have been removed now
    assert.equal(eventMap['beforeunload'], undefined);
  })
});
