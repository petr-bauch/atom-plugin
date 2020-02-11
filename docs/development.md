# Development

For development purposes you will need to install Atom from official website: [atom.io](https://atom.io/).

Clone this repository:
```shell script
$ git clone https://github.com/DeepCodeAI/atom-plugin.git
```

Install npm dependencies:
```shell script
$ npm install
```

Go to the folder with cloned project and create symlink for plugin:
```shell script
$ cd atom-plugin
$ apm link
```

> Read more about [Atom Package Manager](https://flight-manual.atom.io/using-atom/sections/atom-packages/#command-line)

After that you can open any project in Atom and use package `DeepCode`.

> Please, note that right after linking plugin it will not be started automatically and not be 
> presented in the "Packages" menu.
> 
>To see the plugin in the "Packages" menu and start it you have to reload
> Atom window via menu command `View` -> `Developer` -> `Reload Window`
> (you can also use hotkey `Ctrl` + `Alt` + `F5`)

To remove plugin just type:
```shell script
$ cd atom-plugin
$ apm unlink
```

During development you may want to reset the whole plugin. It is available via command
`deepcode:reset-plugin`.

In order to use this command open command panel in Atom (`Ctrl` + `Shift` + `P`) and find
command titled as `Deepcode: Reset Plugin`.

## Testing

In order to run tests open plugin folder in `Atom` and use menu command
`View` -> `Developer` -> `Run Package Specs`
or just press `Ctrl` + `Shift` + `Y`.

## Publishing

In order to publish package to the [atom.io package registry](https://atom.io/packages)
you may use the `apm publish` command:
```shell script
$ cd atom-plugin
$ apm publish <version-type>

# where <version-type> is one of:
# - patch
# - minor
# - major
```

To read more about publishing visit [official docs page](https://flight-manual.atom.io/hacking-atom/sections/publishing/).

## Usage with local package `@deepcode/tsc`

In order to test plugin with local package `@deepcode/tsc` you should make the following steps.

1. Clone package repository:
```shell script
$ git clone https://github.com/DeepCodeAI/tsc.git
```

> Probably you will need the `dev` branch with the latest changes:
> ```shell script
> $ git clone https://github.com/DeepCodeAI/tsc.git -b dev
> ```

2. Go to the package folder, install dependencies and create symlink:
```shell script
$ cd tsc
$ npm install
$ npm link
```

3. Go to the plugin folder and install package from local symlink:
```shell script
$ cd atom-plugin
$ npm link @deepcode/tsc
```

After that you can add package to your `package.json`:
```json
"dependencies": {
 "@deepcode/tsc": "^1.0.0"
}
```
           
and use this package as usual:
```javascript
import { ServiceAI } from '@deepcode/tsc';

const AI = new ServiceAI();
AI.init({
 baseURL: 'https://www.deepcode.ai',
 useDebug: true,
});

async login() {
 const { sessionToken } = await AI.startSession({ source: 'atom' });
 return Promise.resolve(sessionToken);
}
```
