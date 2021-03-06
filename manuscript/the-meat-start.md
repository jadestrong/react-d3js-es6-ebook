# Visualizing data with React and d3.js #

Welcome to the main part of React + D3v4. We're going to talk a little theory, learn some principles, and then get our hands dirty with a few examples. Through this book you're going to build:

- [A few small components in Codepen](#basic-approach)
- [A choropleth map](#choropleth-map)
- [An interactive histogram](#histogram-of-salaries)
- [A rainbow snake](#rainbow-snake)
- [An animated alphabet](#animated-alphabet)
- [A simple particle generator with Redux](#animating-react-redux)
- [A particle generator pushed to 20,000 elements with canvas](#canvas-react-redux)
- [Billiards simulation with MobX and canvas](#billiards-simulation)
- [A dancing fractal tree](#fractal-tree)

Looks random, right? Bear with me.

Examples build on each other in complexity. **The first** teaches you how to make a static data visualization component and shows you an approach to declarative data visualization. **The second** adds interactivity and components interacting with each other in order to teach you about a simple approach to state management. **The third** shows you how to use transitions to build simple animations. **The fifth** shows you complex transitions with entering and exiting components. **The fifth** shows you how to do complex animation using a game loop principle. **The sixth, seventh, and eighth** show you how to approach speed optimization to smoothly animate thousands of elements.

Throughout our examples, we're going to use **React 15**, compatible with **React 16 Fiber**, **D3v4**, and **ES6+**. In the particle generator, we're also going to use **Redux** to drive the game loop and **Konva** for canvas manipulation. The billiards simulation uses **MobX** so you can compare it to Redux and learn both.

Don't worry if you're not comfortable with ES6 syntax yet. By the end of this book, you're gonna love it!

Until then, here's an interactive cheatsheet: [es6cheatsheet.com](https://es6cheatsheet.com/). It uses code samples to compare the ES5 way with the ES6 way so you can brush up quickly.

In the interest of looking towards the future, we'll check out **Preact** and **Inferno** in the final fractal example. They're new React-like libraries that promise better performance and smaller file sizes. Their creators – Jason Miller and Dominic Gannaway - graciously forked my fractal tree example and built the same thing in their respective libraries. Thank you!

----

Before we begin our examples, let's talk about how React and D3 fit together and how we're going to structure our apps. If you prefer to get your hands dirty first and ask questions later, skip this section and jump to the examples.

This section is split into five chapters:

- [Basic Approach](#basic-approach)
- [Blackbox Components](#blackbox-components)
- [Full Feature Integration](#full-feature-integration)
- [State Handling Architecture](#state-handling-architecture)
- [Structuring your React App](#structuring-your-app)

# The basic approach

Our visualizations are going to use SVG - an XML-based image format that lets us describe images in terms of mathematical shapes. For example, the source code of an 800x600 SVG image with a rectangle looks like this:

```html
<svg width="800" height="600">
    <rect width="100" height="200" x="50" y="20" />
</svg>
```

These four lines create an SVG image with a black rectangle at coordinates `(50, 20)` that is 100x200 pixels large. Black fill with no borders is default for all SVG shapes.

SVG is perfect for data visualization on the web because it works in all browsers, renders without blurring or artifacts on all screens, and supports animation and user interaction. You can see examples of interaction and animation later in this book.

But SVG can get slow when you have many thousands of elements on screen. We're going to solve that problem by rendering bitmap images with canvas. More on that later.

----

Another nice feature of SVG is that it's just a dialect of XML - nested elements describe structure, attributes describe the details. They're the same principles that HTML uses.

That makes React's rendering engine particularly suited for SVG. Our 100x200 rectangle from before looks like this as a React component:

```js
const Rectangle = () => (
    <rect width="100" height="200" x="50" y="20" />
);
```

To use this rectangle component in a picture, you'd use a component like this:

```js
const Picture = () => (
    <svg width="800" height="600">
	<Rectangle />
    </svg>
);
```

You're right. This looks like tons of work for a static rectangle. But look closely. Even if you know nothing about React and JSX, you can look at that code and see that it's a `Picture` of a `Rectangle`.

Compare that to a pure D3 approach:

```js
d3.select("svg")
  .attr("width", 800)
  .attr("height", 600)
  .append("rect")
  .attr("width", 100)
  .attr("height", 200)
  .attr("x", 50)
  .attr("y", 20);
```

It's elegant, it's declarative, and it looks like function call soup. It doesn't scream *"Rectangle in an SVG"* to me as much as the React example does.

You have to take your time and read the code carefully: first, we `select` the `svg` element, then we add attributes for `width` and `height`. After that, we `append` a `rect` element and set its attributes for `width`, `height`, `x`, and `y`.

Those 8 lines of code create HTML that looks like this:

```html
<svg width="800" height="600">
    <rect width="100" height="200" x="50" y="20" />
</svg>
```

Would've been easier to just write the HTML, right? Yes, for static images, you're better off using Photoshop or something then exporting to SVG.

Either way, dealing with the DOM is not D3's strong suit. There's a lot of typing, code that's hard to read, it's slow when you have thousands of elements, and it's often hard to keep track of which elements you're changing. D3's enter-update-exit cycle is great in theory, but I personally never found it easy to use.

If you don't completely understand what I just said, don't worry. We'll cover the enter-update-exit cycle in the animations example. Don't worry about D3 either. **I know it's hard**. I've written two books about it, and I still spend as much time reading the docs as writing the code. There's much to learn, and I'll explain everything as we go along.

D3's strong suit is its ability to do everything other than the DOM. There are many statistical functions, great support for data manipulation, and a bunch of built-in data visualizations. **D3 can calculate anything for us. All we have to do is draw it out.**

That's why we're going to follow this approach:

* React owns the DOM
* D3 calculates properties

This way, we can leverage React for SVG structure and rendering optimizations and D3 for all its mathematical and visualization functions.

Now let's look at two different ways to put them together: blackbox and full-feature.

# Blackbox Components

Blackbox components are the simplest way to integrate D3 and React. You can think of them as wrappers around D3 visualizations.

You can take any D3 example from the internets or your brain, wrap it in a thin React component, and it Just Works™. Yes, we go against what I just said and let D3 control a small part of the DOM tree.

We throw away most of React's power, but we gain a quick way to get things working.

I call the approach *"blackbox"* because React's engine can't see inside your component, can't help with rendering, and has no idea what's going on. From this point onward in the DOM tree, you are on your own. It sounds scary, but it's okay if you're careful.

Here's how it works:
- React renders an anchor element
- D3 hijacks it and puts stuff in

You have to manually re-render on props and state changes. You're also throwing away and recreating your component's entire DOM on each re-render.

Manual re-rendering is not as annoying as it sounds, but the inefficiency can get pretty bad with complex visualizations. Use this technique sparingly.

## A quick blackbox example - a D3 axis

Let's build an axis component. Axes are the perfect use-case for blackbox components. D3 comes with an axis generator bundled inside, and they're difficult to build from scratch.

They don't *look* difficult, but there are many tiny details you have to get _just right_.

D3's axis generator takes a scale and some configuration to render an axis for us. The code looks like this:

```js
const scale = d3.scaleLinear()
		.domain([0, 10])
		.range([0, 200]);
const axis = d3.axisBottom(scale);

d3.select('svg')
  .append('g')
  .attr('transform', 'translate(10, 30)')
  .call(axis);
```

If this code doesn't make any sense, don't worry. There's a bunch of D3 to learn, and I'll help you out. If it's obvious, you're a pro! This book will be much quicker to read.

We start with a linear scale that has a domain `[0, 10]` and a range `[0, 200]`. You can think of scales as mathematical functions that map a domain to a range. In this case, calling `scale(0)` returns `0`, `scale(5)` returns `100`, `scale(10)` returns `200`. Just like middle school mathematics.

We create an axis generator with `axisBottom`, which takes a `scale` and is going to generate a `bottom` oriented axis – numbers below the line. You can also tweak settings for the number of ticks, their sizing, and their spacing.

Equipped with an `axis` generator, we `select` the `svg` element, append a grouping element, use a `transform` attribute to move it `10`px to the right and `30`px down, and invoke the generator with `.call()`.

It creates a small axis:

![Simple axis](resources/images/es6v2/simple-axis.png)

You can play around with this example on CodePen [here](https://codepen.io/swizec/pen/YGoYBM). Try changing the scale type.

## A quick blackbox example - a React+D3 axis

Now let's say we want to use that same axis code but as a React component. The simplest way is to use a blackbox component approach like this:

```js
class Axis extends Component {
	componentDidMount() { this.renderAxis() }
	componentDidUpdate() { this.renderAxis() }

	renderAxis() {
		const scale = d3.scaleLinear()
	                  .domain([0, 10])
                   .range([0, 200]);
    	const axis = d3.axisBottom(scale);

		d3.select(this.refs.g)
		  .call(axis);  
	}

	render() {
    	return <g transform="translate(10, 30)" ref="g" />
	}
}
```

Oh man! So much code! Is this really worth it? Yes, for the other benefits of using React in your dataviz. You'll see :)

We created an `Axis` component that extends React base `Component` class. We can't use functional stateless components because we need lifecycle hooks. More on those later.

Our component has a `render` method, which returns a grouping element (`g`) moved 10px to the right and 30px down using the `transform` attribute. Same as before.

We added a `ref` attribute, which lets us reference elements in our component via `this.refs`. This makes D3 integration cleaner, and it probably works with React-native. I haven't tried yet.

The body of `renderAxis` should look familiar. It's where we put code from the pure D3 example. Scale, axis, select, call. There's no need to append a grouping element; we're already there with `this.refs.g`.

For the manual re-rendering part, we call `renderAxis` in `componentDidUpdate` and `componentDidMount`. This ensures that our axis re-renders every time React's engine decides to render our component. On state and prop changes usually.

That wasn't so bad, was it? You can try it out on CodePen [here](https://codepen.io/swizec/pen/qazxPz).

To make our axis more useful, we could get the scale and axis orientation from props. We'll do that for scales in our bigger project.

# A D3 blackbox higher order component – HOC

After the blackbox axis example above, you'd be right to think something like *"Dude, that looks like it's gonna get hella repetitive. Do I really have to do all that every time?"*

Yes, you do. But! We can make it easier with a higher order component - a HOC.

Higher order components are one of the best ways to improve your React code. When you see more than a few components sharing similar code, it's time for a HOC. In our case, that shared code would be:

- rendering an anchor element
- calling D3's render on updates

With a HOC, we can abstract that away into something called a [class factory](https://en.wikipedia.org/wiki/Factory_method_pattern). It's an old concept coming back in vogue now that JavaScript has classes.

You can think of it as a function that takes some params and creates a class – a React component. Another way to think about HOCs is that they're React components wrapping other React components and a function that makes it easy.

Let's build a HOC for D3 blackbox integration. We'll use it in the main example project.

A `D3blackbox` HOC looks like this:

```javascript
function D3blackbox(D3render) {
	return class Blackbox extends React.Component {
		componentDidMount() { D3render.call(this); }
		componentDidUpdate() { D3render.call(this) }

		render() {
	    const { x, y } = this.props;
	    return <g transform={`translate(${x}, ${y})`} ref="anchor" />;
		}
	}
}
```

You'll recognize most of that code from earlier. We have a `componentDidMount` and`componentDidUpdate` lifecycle hooks that call `D3render` on component updates. This used to be called `renderAxis`. `render` renders a grouping element as an anchor into which D3 can put its stuff.

Because `D3render` is no longer a part of the component, we have to use `.call` to give it the scope we want: this class, or rather `this` instance of the `Backbone` class.

We've also made some changes to make `render` more flexible. Instead of hardcoding the `translate()` transformation, we take `x` and `y` props. `{ x, y } = this.props` takes `x` and `y` out of `this.props` using object decomposition, and we used ES6 string templates for the `transform` attribute.

Consult the [ES6 cheatsheet](https://es6cheatsheet.com/) for details on that.

Using our new `D3blackbox` HOC to make an axis looks like this:
```javascript
const Axis = D3blackbox(function () {
    const scale = d3.scaleLinear()
	            .domain([0, 10])
	            .range([0, 200]);
    const axis = d3.axisBottom(scale);

    d3.select(this.refs.anchor)
      .call(axis);    
});
```
It’s the same code as we had in `renderAxis` before. The only difference is that the function is wrapped in a `D3blackbox` call. This turns it into a React component.

I'm not 100% whether wrapping a function in a React component counts as a real HOC, but let's roll with it. More proper HOCs are React components wrapped in components.

You can play with this example on Codepen [here](https://codepen.io/swizec/pen/woNjVw).

# Full-feature Integration

As useful as blackbox components are, we need something better if we want to leverage React's rendering engine. We're going to look at full-feature integration where React does the rendering and D3 calculates the props.

To do that, we're going to follow a 3-part pattern:
- set up D3 objects as class properties
- update D3 objects when component updates
- output SVG in `render()`

It's easiest to show you with an example.

Let's build a rectangle that changes color based on prop values. We'll render a few of them to make a color scale.

Yes, it looks like a trivial example, but color-as-information is an important concept in data visualization. We're going to use it later to build a choropleth map of household income in the US.

I suggest following along in Codepen for now. [Here's one I set up for you](https://codepen.io/swizec/pen/oYNvpQ). It contains the final solution, so you can follow along and nod your head. I'll explain each part.

## A color scale

We start with a `Swatch` component that draws a rectangle and fills it with a color.

```
const Swatch = ({ color, width, x }) => (
	<rect width={width}
			  height="20"
			  x={x}
			  y="0"
			  style={{fill: color}} />
);
```

Looks like our earlier components, doesn't it? It's exactly the same: a functional stateless component that draws a `rect` element with some attributes - dimensions, position, and `fill` style.

Note that `style` is a dictionary, so we specify it with double curly braces: outer braces for a dynamic value, inner braces for a dictionary.

Then we need a `Colors` component. It follows the full-featured integration structure: D3 objects as properties, an `updateD3` function, plus some wiring for updates and rendering.

```js
class Colors extends Component {
    colors = d3.schemeCategory20;
    width = d3.scaleBand()
				      .domain(d3.range(20));
```

We start by inheriting from `Component` and defining defaults for D3 objects. `this.colors` is one of [D3's predefined color scales](https://github.com/d3/d3-scale/blob/master/README.md#schemeCategory10). `schemeCategory20` is a scale of 20 colors designed for categorization. It seemed like a good example, and you're welcome to try others.

`this.width` is a D3 scale designed for producing bands, `d3.scaleBand`. As mentioned earlier, scales map domains to ranges. We know our domain is 20 colors, so we can statically set the domain as `[1, 2, 3, ..., 20]` with `d3.range(20)`.

`d3.range` generates a counting array, by the way. We'll use that often.

We'll use `this.width` to calculate widths and positions of our color swatches. Here's a picture from D3 docs to help you visualize what `scaleBand` does:

![Band Scale from D3 docs](https://raw.githubusercontent.com/d3/d3-scale/master/img/band.png)

Unlike the domain, our range is dynamic so that we can use props to define the width of our color scale. This makes the component more reusable.

```js
componentWillMount() {
    this.updateD3(this.props);
}

componentWillUpdate(newProps) {
    this.updateD3(newProps);
}

updateD3(props) {
    this.width.range([0, props.width]);
}

```

`componentWillMount` and `componentWillUpdate` are component lifecycle hooks. Can you guess when they run?

`componentWillMount` runs just before React's engine inserts our component into the DOM, and `componentWillUpdate` runs just before React updates it. That happens on any prop change or `setState` call.

Both of them call our `updateD3` method with the new value of props. We use it to update `this.width` scale's range. Doing so keeps the internal state of D3 objects in sync with React's reality. Without it, our component might render stale data.

Finally, we render a set of color swatches.

```js
render() {
	return (
		<g>
	    {d3.range(20).map(i => (
	        <Swatch color={this.colors[i]}
	                width={this.width.step()}
	                x={this.width(i)} />
	     ))}
		</g>
	)
}
```

We create a grouping element to fulfill React's one child per component requirement, then render 20 swatches in a loop. Each gets a `color` from `this.colors` and a `width` and `x` from `this.width`.

After inserting into the DOM with `ReactDOM`, we get a series of 20 colorful rectangles.

![20 color swatches](resources/images/es6v2/color-swatches.png)

Try changing the `width="400"` property of `<Colors />`. You'll see D3's `scaleBand` and our update wiring ensure the color strip renders correctly. For more fun, try changing the `Colors` component so it takes the color scale as a prop, then rendering multiple instances of `<Colors />` side-by-side.

Here's the playground again: [CodePen](https://codepen.io/swizec/pen/oYNvpQ)

As an exercise, try to add another row of swatches, but rendered in reverse.

# You're awesome

You know the basics! You can take any D3 example from the internets and wrap it in a React component, *and* you know how to build React+D3 components from scratch. You're amazing. High five! :raised_hand_with_fingers_splayed:

The rest of this book is about using these concepts and pushing them to the limits of practicality. We're going to build an interactive visualization of tech salaries compared to median household income. Why? Because it piqued my interest, and because it shows why you should call yourself an engineer, not a programmer or a developer. **You're an engineer**. Remember that.

Throughout the example, you'll learn more details of D3, tidbits from React, and the animation chapter is going to blow your mind. It's gonna be fun!

![Default view](resources/images/es6v2/full-dataviz.png)

![After a click](resources/images/es6v2/interaction-dataviz.png)

# State Handling Architecture

Before I can set you loose on the world, we should talk about managing state. It's where most engineers shoot themselves in the foot.

I've shot myself in the foot *a lot*. Life gets harder and harder until one day you want to throw all your code away and embark on The Rewrite. That's how projects die.

The Rewrite [killed Netscape](http://www.joelonsoftware.com/articles/fog0000000069.html). You probably don't even remember Netscape :wink:

Let's save you from that.

## Basic architecture

![The basic architecture](resources/images/es6v2/architecture.jpg)

We're going to use a unidirectional dataflow architecture inspired by Flux:

* The Main Component – `App` – is the repository of truth
* Child components react to user events
* They announce changes using callbacks
* The Main Component updates its truth
* The real changes flow back down the chain to update UI

This looks roundabout, but it's awesome. It's far better than worrying about parts of the UI going out of date with the rest of the app. I could talk your ear off with debugging horror stories, but I'm nice, so I won't.

When a user clicks on one of our controls, a `Toggle`, it invokes a callback. This in turn invokes a callback on `ControlRow`, which invokes a callback on `Controls`, which invokes a callback on `App`.

![Callback chain](resources/images/es6v2/architecture_callbacks.jpg)

With each hop, the nature of our callback changes. `Toggle`  tells `ControlRow` which entry was toggled, `ControlRow` tells `Controls` how to update the data filter function, and `Controls` gives `App` a composite filter built from all the controls. You'll see how that works in the next chapter.

The important takeaway right now is that callbacks go from low-level info to high-level semantic info.

When the final callback is invoked, `App` updates its repository of truth and communicates the change back down the chain via props. This happens with no additional wiring on your part.

![Data flows down](resources/images/es6v2/architecture_dataflow.jpg)

You can think of it like calling functions with new arguments. Because the functions – components – render the UI, your interface updates.

Because your components are well-made and rely on their props to render, React's engine can optimize these changes. It can compare the component tree and decide which components to re-render and which to leave alone.

Functional programming for HTML! :sunglasses:

The functional programming concepts we're relying on are called [referential transparency](https://en.wikipedia.org/wiki/Referential_transparency), [idempotent functions](https://en.wikipedia.org/wiki/Idempotence), and [functional purity](https://en.wikipedia.org/wiki/Pure_function). I suggest Googling them if you want to learn the theory behind it all.

## A caveat

The caveat with our basic state handling approach is that it's less flexible and scalable than using a state handling library like Redux or MobX. The more components we add, and the more interaction we come up with, the harder it will become to keep track of our callbacks. Redesigning the UI is also cumbersome because you have to rewire all the callbacks.

We're using the basic approach because it's easier to explain, works without additional libraries, and is Good Enough™. I mention Redux and MobX to make your Googling easier.

You can see an approach to using Redux in dataviz in the [Animating with React, Redux, and D3 chapter](#animating-react-redux), and we'll tackle MobX in the [MobX chapter](#refactoring-to-mobx).


# Structuring your React app

We're going to structure our app into components. Deciding what to put into one component and what to put into another is one of the hardest problems in engineering.

Entire books have been written on the topic, but here's a rule of thumb that I like to use: if you have to use the word "and" to describe what your component does, then it should become two components.

Once you have those two components, you can either make them child components of a bigger component, or you can make them separate. The choice depends on their re-usability and often mimics your design structure.

For example, our tech salary visualization is going to use 1 very top level component, 5 major components, and a bunch of child components.

 - `App` is the very top level component; it handles everything
 - `Title` renders the dynamic title
 - `Description` renders the dynamic description
 - `Histogram` renders the histogram and has child components for the axis and histogram bars
 - `CountyMap` renders the choropleth map and uses child components for the counties
 - `Controls` renders the rows of buttons that let users explore our dataset

Most of these are specific to our use case, but `Histogram` and `CountyMap` have potential to be used elsewhere. We'll keep that mind when we build them.

`Histogram`, `CountyMap`, and `Controls` are going to have their own folder inside `src/components/` to help us group major components with their children. An `index.js` file will help with imports.

We'll use a `Meta` folder for all our metadata components like `Title` and `Description`. We don't *have* to do this, but `import { Title, Description } from './Meta'` looks better than doing separate imports for related-but-different components. Namespacing, if you will.

Each component should be accessible with `import My Component from './MyComponent'` and rendered with `<MyComponent {...params} />`. If a parent component has to know details about the implementation of a child component, something is wrong.

You can read more about these ideas by Googling ["leaky abstractions"](https://en.wikipedia.org/wiki/Leaky_abstraction), ["single responsibility principle"](https://en.wikipedia.org/wiki/Single_responsibility_principle), ["separation of concerns"](https://en.wikipedia.org/wiki/Separation_of_concerns), and ["structured programming"](https://en.wikipedia.org/wiki/Structured_programming). Books from the late 90's and early 2000's (when object-oriented programming was The Future™) are the best source of curated info in my experience.

---

Congratz! You know everything you need to build visualizations with React and D3. :clap:

This is the point in tech books where I run off and start building things on my own. Then I get frustrated, spend hours Googling for answers, and then remember, "Hey! Maybe I should read the rest of the book!"

Reading the rest of the book helps. I'll show you how all this stuff fits together into a larger project.
