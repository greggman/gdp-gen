# Graphic Design Poster Generator

Let's plan out an html/svg based graph design generator. It should make random graph designs.
Features:

* May or may not have text
* Text is made up. 
* Text uses the worlds characters (Chinese, Japanese, Korean, Thai, Arabic, Sanskrit, etc...)
* Text uses one language or one language + English
* There's a composition engine
* The composition engine has multiple composition algorithms
* Each composition is very parameterized so that designs using one composition algorithm don't all look the same.
* The parameters are random but choose values based on design rules. They may even be dependant
* The designs use the default web fonts
* The colors chosen follow graphic design rules
* The designs take contrast into account so that items that need to have contrast, have contrast
* If text overflows different areas of the design it must do so in an appropriate way, with contrast if required
* There are at least 20 or more composition algorithms
* There are graphic design image / pattern generators. Over 100 of them.
  * Generators also use rules to follow graph design rules and patterns
  * Generators are also parameterized so they don't always produce the same thing.


* The page is simple HTML and includes a main.js file
* The JavaScript is generated from TypeScript using esbuild
* the TypeScript used is formatted in the Google TypeScript Style Guild style
* Each composition algorithm and each generator are in their own .ts file
* No external libraries are used on the page.
* The page uses modern CSS with nested CSS rules when appropriate, loaded from styles.css
* The page has a small refresh button in the top right to generate a new design

* compositions and generators take inspiration from museum posters, design books, 90s and 2000s techno CD covers,
  concert posters, exhibit posters, etc...
