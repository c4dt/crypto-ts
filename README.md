# Crypto for Angular-8 and Nativescript-6

This is a demo for how to use 
[@dedis/cothority](https://github.com/dedis/cothority),
[@c4dt/dynacred](https://github.com/c4dt/omniledger/tree/master/dynacred) and 
[crypto-browserify](https://www.npmjs.com/package/crypto-browserify) in Angular-8 and Nativescript-6.

TLDR, look at the following diff and implement the same in your project:
[fix-diff](https://github.com/c4dt/crypto-ts/commit/b0242974fecda85a720d16e8c627fad3a896e76f)

## Why is this so difficult?

The main problem, as far as I understood in my 18 months of JavaScript 
ordeal, has to do with the history of javascript havingat least three 
possible environments for running in:

- `browser` - the original one (where I started in 1998...)
- `node` - Google's hilarious idea of running javascript on the server, 
  using [v8](https://v8.dev/)
- `nativescript` - which does a mix of both, a little bit different on 
  [Android](https://docs.nativescript.org/core-concepts/android-runtime/overview) and 
  [iOS](https://docs.nativescript.org/core-concepts/ios-runtime/Overview)

Over the years, different ways of coping with these systems have evolved.
The following means are used by different modules:
- older modules use detection by global variables (is `window.global` defined
 or not?)
- newer modules use `package.json` to indicate which the main module is:
  - `"main"` mostly used for node, or just for the `main` (duh)
  - `"module"` is a size optimized distribution
  - `"browser"` indicates the browser entry point
- for nativescript, [some packages](https://market.nativescript.org/) are available as `nativescript-*`

## And crypto?

For crypto, as far as I can trace it back, the following is used:
- [crypto](https://nodejs.org/api/crypto.html) has been introduced in `node`
- there is a [window.Crypto](https://www.w3.org/TR/WebCryptoAPI/)-support in 
modern browsers, different than the node-crypto
- [crypto-browserify](https://github.com/crypto-browserify/crypto-browserify) is supposed to be used in browsers, but depends on 
other modules, where each module has its own node/browser compatibility

## Use-case

The use-case in this repository is integrating the following three libraries:
- `crypto-browserify` to create a random number
- `@c4dt/dynacred` for a random keypair
- `@dedis/cothority` for getting the latest block from the DEDIS blockchain

It is implemented in three commits:
- [Initial](https://github.com/c4dt/crypto-ts/commit/cdc0c2cae8dd1342cbef53ecdd335311201ea275) - with the bare-bones automatically created by the frameworks
- [Demo](https://github.com/c4dt/crypto-ts/commit/e9afe387be0be5136c4bbc1e9f2c0a9b91760832) - the implementation that should work (tm)
- [Fix](https://github.com/c4dt/crypto-ts/commit/b0242974fecda85a720d16e8c627fad3a896e76f) - how to make it work with the least changes

### Initial

The [initial commit](https://github.com/c4dt/crypto-ts/commit/cdc0c2cae8dd1342cbef53ecdd335311201ea275)
 has two directories with a very basic setup:
- `angular8` which holds a basic vanilla directory created with `ng 
 new angular8`
- `nativescript6` a basic vanilla directory created with `tns create 
 nativescript6 --ts`

### Demo

The [next commit](https://github.com/c4dt/crypto-ts/commit/e9afe387be0be5136c4bbc1e9f2c0a9b91760832) contains the following small set of calls to 
 crypto-methods:
```ts
        // Print 32 bytes of randomness
        Log.print(randomBytes(32));

        // Create a new random keypair from the dynacred library
        Log.print(new KeyPair());

        // Set websockets to nativescript-websockets and fetch the latest
        // block from the DEDIS-blockchain
        const conn = new WebSocketConnection("wss://conode.c4dt.org:7771", "byzcoin");
        const bc = await ByzCoinRPC.fromByzcoin(conn, Buffer.from
         ("9cc36071ccb902a1de7e0d21a2c176d73894b1cf88ae4cc2ba4c95cd76f474f3", "hex"));
        Log.print(bc.getConfig());
```

These calls use most of the methods and crypto-code, as well as network code,
 as needed in the rest of the library.
If you run them like this, it will fail:

```
angular8# npm ci; ng serve
nativescript6# npm ci; tns run android
```

### Fix

[The commit](https://github.com/c4dt/crypto-ts/commit/b0242974fecda85a720d16e8c627fad3a896e76f) contains the fix.
Remember from the intro that there are different things the modules need to 
 understand.
Here is a rundown of the different parts that need to be fixed.

#### Angular 8

For Angular 8, there is a fix using `@angular-builders/custom-webpack`.
I chose this over the `polyfill.ts` approach, because I prefer 'fixing' the 
 backend.
The `custom-webpack` allows to configure webpack in more detail.
To include it in your own project, install it:
```
npm i -D @angular-builders/custom-webpack
```

Add a file `extra-webpack.config.json` to your directory:
```
cat <<EOF > extra-webpack.config.json
module.exports = {
  node: {},
}
EOF
```

And adjust your `angular.json` like this:
```patch
       "prefix": "app",
       "architect": {
         "build": {
-          "builder": "@angular-devkit/build-angular:browser",
+          "builder": "@angular-builders/custom-webpack:browser",
           "options": {
+            "customWebpackConfig": {
+              "path": "./extra-webpack.config.js"
+            },
             "outputPath": "dist/angular8",
             "index": "src/index.html",
             "main": "src/main.ts",
@@ -61,7 +64,7 @@
           }
         },
         "serve": {
-          "builder": "@angular-devkit/build-angular:dev-server",
+          "builder": "@angular-builders/custom-webpack:dev-server",
           "options": {
             "browserTarget": "angular8:build"
           },
```
This tells webpack to not try to be node-compatible at all.

The following lines need to be added to `tsconfig.json` to correct
behaviour of the `bn.js` module:
```patch
   "compilerOptions": {
+    "allowSyntheticDefaultImports": true,
     "baseUrl": "./",
```

#### Nativescript 6

For Nativescript, it is a bit more complicated. There are three parts:
- configure `webconfig` to behave nicely
- add `nativescript-randombytes` to provide good randomness
- use `nativescript-websockets` to replace the browser-websocket interface

- Webconfig diff:
```patch
     const alias = {
+        'randombytes': resolve(__dirname, 'node_modules/nativescript-randombytes/randombytes-native.android.js'),
         '~': appFullPath
[...]
             ],
+            mainFields: ['browser', 'module', 'main'],
             alias,
[...]
             new webpack.DefinePlugin({
                 "global.TNS_WEBPACK": "true",
-                "process": "global.process",
+                // "process": "global.process",
```
  - `alias: randombytes`: replaces all `require('randombytes')` with the 
  implementation from [nativescript-randombytes](https://github.com/EddyVerbruggen/nativescript-randombytes)
  - `resolve: mainFields`: prefer the `"browser"` entry from `package.json` 
  for all modules
  - `DefinePlugin: process`: commented out to allow some modules correctly 
  detecting which environment they should run
- [nativescript-websocket](https://github.com/c4dt/crypto-ts/blob/master/nativescript6/app/nativescript-ws.ts): also needs the following line to tell 
`@dedis/cothority` to use a different websocket, as well as adding 
[nativescript-ws.ts](https://github.com/c4dt/crypto-ts/blob/master/nativescript6/app/nativescript-ws.ts) 
to your directory.
```
        setFactory((path: string): WebSocketAdapter => new NativescriptWebSocketAdapter(path));
```
 

## Wrapup

That's it, easy, no?
I suppose that's what you get when you can configure your
- compiler with `tsconfig.json`
- linker with `angular.json`/`webpack.config`
- environment by people who write a module for `leftpad`, even this 
functionality is in the standard library...

But that seems the price to pay to have a billion libraries to chose from and
 a thriving ecosystem going from servers to browsers and mobile devices.
