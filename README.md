> **The Australian Government Design System has been decommissioned [Visit our community page for more information](https://community.digital.gov.au/t/dta-design-system-has-been-decommissioned/4649)**

Pancake
=======

> Pancake is a tool to make working with npm on the front end easy and sweet.

> **Legacy scope:** Releases published before the `@truecms/*` migration remain available under the archived `@gov.au/*` namespace for teams who still depend on them. New work happens exclusively in the `@truecms` scope.

![CI](https://github.com/truecms/pancake/actions/workflows/ci.yml/badge.svg)

![The Pancake tool](https://raw.githubusercontent.com/govau/pancake/master/assets/pancake.png)

[Npm wrote about](http://blog.npmjs.org/post/101775448305/npm-and-front-end-packaging) the challenges frontend developers face when trying to use npm. Pancake is addressing those by embracing the idea of small individually versioned independent modules. Interdependencies is what npm does really well and Pancake will help you keep them flat and error out on conflicts. [Read more about our solution](https://medium.com/dailyjs/npm-and-the-front-end-950c79fc22ce)

Pancake will check your `"peerDependencies"` for conflicts and comes with plugins to compile the contents of your modules for you and lists all available modules for you to select and install.



## Contents

* [Getting started](#getting-started)
* [Requirements](#requirements)
* [Migration guidance](#migration-guidance)
* [Settings](#settings)
* [Command line interface](#cli)
* [Creating your own Pancake modules](#creating-your-own-pancake-modules)
* [Contributing](#contributing)
* [Taste / Tests](#taste--tests)
* [License](#license)


----------------------------------------------------------------------------------------------------------------------------------------------------------------


## Getting started

If you are creating a new project using Pancake you will want to look into creating your own [Pancake modules](#creating-your-own-pancake-modules).

Pancake comes installed with Australian Government Design System components. To know if you have `pancake` installed, check your `package.json` file for a `"pancake": { ... }` object. If you have this and you want to change the output look at the [Pancake settings](#settings) section.

If you have issues with using SASS globals in a ReactJS project, please check out the [Design System React starter repo](https://github.com/govau/design-system-starter-react) for an example.

**[⬆ back to top](#contents)**


----------------------------------------------------------------------------------------------------------------------------------------------------------------


## Requirements

- Node.js 22.x (use `.nvmrc` with `nvm use`)
- Corepack enabled to manage pnpm (`corepack enable`)
- pnpm 8.x (Corepack will install `pnpm@8.15.x` defined in `package.json`)
- A `package.json` file in your root (run `npm init --yes`)

_Pancake alone does not come with any dependencies while all plugins have fixed dependencies to specific versions to keep the security impact as low as possible. We also ship a `package-lock.json` file._


**[⬆ back to top](#contents)**


----------------------------------------------------------------------------------------------------------------------------------------------------------------


## Migration guidance

- Follow the end-to-end upgrade checklist in [`MIGRATION.md`](MIGRATION.md) when moving from the legacy `@gov.au/*` packages to the modernised `@truecms/*` scope.
- Review supported runtimes and deprecation dates in [`docs/node-support-policy.md`](docs/node-support-policy.md).
- Validate environments with `pnpm run install:check` (deterministic install/build gate) and the GitHub Actions workflows in `.github/workflows/ci.yml` and `.github/workflows/release.yml`.
- Use the announcement template at [`docs/announcements/truecms-upgrade.md`](docs/announcements/truecms-upgrade.md) to communicate adoption timelines across teams.


**[⬆ back to top](#contents)**


----------------------------------------------------------------------------------------------------------------------------------------------------------------


## Settings

Pancake comes with two different level of settings. Global settings can persist across projects and local settings that are project specific.


### Global settings

To change global settings run Pancake with the `--set` flag.

```shell
npx pancake --set [settingName] [value]
```

|     setting     |                 value                 |  default  |
|-----------------|---------------------------------------|-----------|
|     `npmOrg`    | This is the npm org scope             | `@truecms` |
|    `plugins`    | A switch to disable or enable plugins | `true`    |
| `ignorePlugins` | An array of plugins to be ignored     | `[]`      |

Example:

```shell
npx pancake --set npmOrg yourOrg
```


### Local settings

To change local settings all you have to do is include a `pancake` object into your `package.json` file. All possible settings are stated below:

```js
{
  "name": "your-name",
  "version": "0.1.0",
  "pancake": {                       //the pancake config object
    "auto-save": true,               //enable/disable auto saving the settings into your package.json after each run
    "plugins": true,                 //enable/disable plugins
    "ignore": [],                    //ignore specific plugins
    "css": {                         //settings for the @truecms/pancake-sass plugin
      "minified": true,              //minify the css?
      "modules": false,              //save one css file per module?
      "browsers": [                  //autoprefixer browser matrix
        "last 2 versions",
        "ie 8",
        "ie 9",
        "ie 10"
      ],
      "location": "pancake/css/",    //the location to save the css files to
      "name": "pancake.min.css"      //the name of the css file that includes all modules; set this to false to disable it
    },
    "sass": {                        //settings for the @truecms/pancake-sass plugin
      "modules": false,              //save one Sass file per module?
      "location": "pancake/sass/",   //the location to save the Sass files to
      "name": "pancake.scss"         //the name of the Sass file that includes all modules; set this to false to disable it
    },
    "js": {                          //settings for the @truecms/pancake-js plugin
      "minified": true,              //minify the js?
      "modules": false,              //save one js file per module?
      "location": "pancake/js/",     //the location to save the js files to
      "name": "pancake.min.js"       //the name of the js file that includes all modules; set this to false to disable it
    },
    "react": {                       //settings for the @truecms/pancake-react plugin
      "location": "pancake/react/",  //the location to save the react files to; set this to false to disable it
    },
    "json": {                        //settings for the @truecms/pancake-json plugin
      "enable": false,               //the pancake-json plugin is off by default
      "location": "pancake/js/",     //the location to save the json files to
      "name": "pancake",             //the name of the json file
      "content": {                   //you can curate what the json file will contain
        "name": true,                //include the name key
        "version": true,             //include the version key
        "dependencies": true,        //include the dependencies key
        "path": true,                //include the path key
        "settings": true             //include the settings key
      }
    }
  }
}
```

To remove `js` you can set the value of `"name": false` and remove the values `minified`, `modules` and `location`.


**[⬆ back to top](#contents)**


----------------------------------------------------------------------------------------------------------------------------------------------------------------


## CLI

You can display the help with `pancake --help`.


### Don’t save to package.json
`-n`, `--nosave`  
Type: `<flag>`  

The command will stop Pancake from merging your local settings, complete them with the defaults and save them into your `package.json`.
This will sort-of shrink-wrap all settings in so you are completely reproducible.
You can also opt-out of this behavior by adding `"auds": { "auto-save": false }` into your package.json.

```shell
npx pancake --nosave
```


### Overwrite npm org name
`-o`, `--org`  
Type: `<flag> [value]`  

You can temporarily overwrite the npm org scope by suppling this flag. This can be useful for testing. Do make sure to use the [settings](#settings) for a
permanent change.

```shell
npx pancake --org @otherOrg
```


### Overwrite the plugin toggle
`-p`, `--noplugins`  
Type: `<flag>`  

You can temporarily disable all plugins. This is great for ci integration.

```shell
npx pancake --noplugins
```


### Overwrite the plugin ignore list
`-i`, `--ignore`  
Type: `<flag> [comma separated list]`  

You can temporarily overwrite the list of plugins to be disabled.

```shell
npx pancake --ignore @truecms/pancake-svg,@truecms/pancake-js
```


### Verbose output
`-v`, `--verbose`  
Type: `<flag>`  

Run Pancake in verbose silly mode.

```shell
npx pancake --verbose
```


**[⬆ back to top](#contents)**


----------------------------------------------------------------------------------------------------------------------------------------------------------------


## Creating your own Pancake modules

💡 You can use Pancake with your own modules. All you have to do in your modules is:

1. Install Pancake
2. Add the Pancake module object to your `package.json` file
3. Add the Pancake `postinstall` script and dependency to your `package.json` file
4. Add your peer dependencies


### 1. Install Pancake

To install pancake use node package manager.

```
npm i @truecms/pancake
```


### 2. Pancake module object

To make sure Pancake can detect your module amongst the other hundred npm packages you have to add the `pancake-module` object into your `pancake` object.

```diff
{
  "name": "your-module-name",
  "version": "1.0.0",
  "description": "Your description",
+  "pancake": {
+    "pancake-module": {                   //pancake is looking for this object to id your module as a pancake module
+      "version": "1.0.0",                 //the major version of pancake
+      "plugins": [                        //only state the plugins you need here
+        "@truecms/pancake-sass"
+      ],
+      "org": "@truecms @nsw.gov.au",       //the npm organisations that will be searched for pancake modules
+      "sass": {                           //sass plugin specific settings
+        "path": "lib/sass/_module.scss",  //where is your sass
+        "sass-versioning": true           //enable sass-versioning. Read more here: https://github.com/dominikwilkowski/sass-versioning
+      },
+      "js": {                             //js plugin specific settings
+        "path": "lib/js/module.js"        //where is your js
+      },
+      "react": {
+        "location": "lib/js/react.js"     //the location to move the react files to
+      }
+    }
+  },
  "dependencies": {},
  "peerDependencies": {},
  "devDependencies": {},
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC"
}
```

### 3. The script

The magic of Pancake lies within the `postinstall` script. To enable Pancake add it as a dependency and add the script:

```diff
{
  "name": "your-module-name",
  "version": "1.0.0",
  "description": "Your description",
  "pancake": {
    "pancake-module": {
      "version": "1.0.0",
      "plugins": [
        "@truecms/pancake-sass"
      ],
      "sass": {
        "path": "lib/sass/_module.scss",
        "sass-versioning": true
      },
      "js": {
        "path": "lib/js/module.js"
      },
      "react": {
        "location": "lib/js/react.js"
      }
    }
  },
  "dependencies": {
+    "@truecms/pancake": "~1"
  },
  "peerDependencies": {},
  "devDependencies": {},
  "scripts": {
+    "postinstall": "pancake"
  },
  "author": "",
  "license": "ISC"
}
```

This will run Pancake right after install and make sure you always get the latest version of the release 1.0.0.
If you have to change settings (very likely) you don’t actually have to fork this project. You can set those settings globally before running it with your
`postinstall` script.

```shell
"postinstall": "pancake --set npmOrg yourOrg && pancake"
```

### 4. Peer dependencies

Adding peer dependencies is simple as long as you remember to add it to the `dependencies` and `peerDependencies` the same time. That way npm will install the
peer dependency and pancake can check if you have conflicts.

```diff
{
  "name": "your-module-name",
  "version": "1.0.0",
  "description": "Your description",
  "pancake": {
    "pancake-module": {
      "version": "1.0.0",
      "plugins": [
        "@truecms/pancake-sass"
      ],
      "sass": {
        "path": "lib/sass/_module.scss",
        "sass-versioning": true
      },
      "js": {
        "path": "lib/js/module.js"
      },
      "react": {
        "location": "lib/js/react.js"
      }
    }
  },
  "dependencies": {
    "@truecms/pancake": "~1",

+    "@truecms/core": "^0.1.0"
  },
  "peerDependencies": {
+    "@truecms/core": "^0.1.0"
  },
  "devDependencies": {},
  "scripts": {
    "postinstall": "pancake"
  },
  "author": "",
  "license": "ISC"
}
```

Now you’re ready to publish your modules and start using Pancake.


**[⬆ back to top](#contents)**


----------------------------------------------------------------------------------------------------------------------------------------------------------------


## Contributing

Hi there 👀,

❤️ We LOVE that you’re looking into this section. We welcome any feedback or pull requests and are super psyched about you putting your own time into this
project. To make your contribution count, have a read through the code first and see what our thinking was. We will do the same with yours.

> **NOTE**: If you are looking to build this project on Windows, you'll need to clone this repository with symlinks enabled using an administrator shell.
```bash
git clone -c core.symlinks=true https://github.com/govau/pancake
```

To run this project make sure you are on Node.js 22 (the root `.nvmrc` declares the version) and enable Corepack once per machine. Then install dependencies with pnpm:

```shell
nvm use
corepack enable
pnpm install --frozen-lockfile
```

Build all packages:

```shell
pnpm run build
```

To develop in one of the modules run the watch inside of it:

```shell
cd packages/pancake/
pnpm run watch
```

❗️ Make sure you only edit file inside the `src/` folder. Files inside the `bin/` folder are overwritten by the transpiler.

_Please look at the coding style and work with it, not against it. 🌴_


**[⬆ back to top](#contents)**


----------------------------------------------------------------------------------------------------------------------------------------------------------------


## Taste / Tests

### Install check

Use the deterministic install gate to verify Pancake can bootstrap, build, and package across the workspace:

```shell
pnpm run install:check
```

The script requires Node.js 22 and Corepack-enabled pnpm. It will exit with a non-zero status if `pnpm install --frozen-lockfile`, `pnpm run build`, or `pnpm pack` fail for any package.

### Test modules

We have published four test modules in our scoped npm org to test interdependencies and to debug with verbose mode switched on.
Find below a list of what is inside each version:

**@truecms/testmodule1**
- ![Testmodule1 version](https://img.shields.io/npm/v/@truecms/testmodule1.svg?label=version&colorA=313131&colorB=1B7991)  

**@truecms/testmodule2**
- ![Testmodule2 version](https://img.shields.io/npm/v/@truecms/testmodule2.svg?label=version&colorA=313131&colorB=1B7991)  
	- └── `@truecms/testmodule1`: `^15.0.0`

**@truecms/testmodule3**
- ![Testmodule3 version](https://img.shields.io/npm/v/@truecms/testmodule3.svg?label=version&colorA=313131&colorB=1B7991)  
	- ├── `@truecms/testmodule1`: `^15.0.0`
	- └── `@truecms/testmodule2`: `^19.0.0`

**@truecms/testmodule4**
- ![Testmodule4 version](https://img.shields.io/npm/v/@truecms/testmodule4.svg?label=version&colorA=313131&colorB=1B7991)  
	- └── `@truecms/testmodule1`: `^15.0.0`


### Software tests

We have an [end-to-end test script](https://github.com/govau/pancake/blob/develop/tests/tester.js) that will take a number of scenarios and compare the output
of pancake against fixtures.

We also use unit tests with [jest](https://facebook.github.io/jest/).

To run all tests use the below command:

```shell
npm test
```

### Node support

Pancake has been tested with Ubuntu 16.04, Mac OS 10.11, 10.12 and Windows 10 all node version coming with npm 3 and higher:

- node `v5.0.0`
- node `v5.12.0`
- node `v6.9.5`
- node `v7.0.0`
- node `v7.4.0`
- node `v7.5.0`
- node `v7.6.0`
- node `v10.0.0`


**[⬆ back to top](#contents)**


----------------------------------------------------------------------------------------------------------------------------------------------------------------


## License

Copyright (c) Commonwealth of Australia.
Licensed under [MIT](https://raw.githubusercontent.com/govau/pancake/master/LICENSE).


**[⬆ back to top](#contents)**

# };
